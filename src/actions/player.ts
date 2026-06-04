"use server";

import { prisma } from "@/lib/db";
import { requireAuth, createAuditLog } from "@/lib/auth";
import { getPlayerBalance, getWalletHistory } from "@/lib/wallet/service";
import {
  expandPlayItems,
  parsePlayText,
  validateParsedPlay,
  type ParsedPlay,
} from "@/lib/parser/play-parser";
import { validateLotteriesOpen, getNextClosingLottery, getSystemOdds } from "@/lib/lottery/service";
import {
  generateOrderNumber,
  generateTicketNumber,
  generateVerificationCode,
} from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getPlayerDashboard() {
  const user = await requireAuth(["PLAYER"]);
  const balance = await getPlayerBalance(user.id);

  const [lastTicket, , nextClose, openLotteries] = await Promise.all([
    prisma.ticket.findFirst({
      where: { playerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { lottery: true } } },
    }),
    prisma.ticket.aggregate({
      where: { playerId: user.id, status: "WON" },
      _sum: { totalAmount: true },
      _count: true,
    }),
    getNextClosingLottery(),
    validateLotteriesOpen([]).then(() =>
      prisma.lottery.findMany({ where: { isActive: true }, take: 5 })
    ),
  ]);

  const wonTickets = await prisma.ticket.findMany({
    where: { playerId: user.id, status: "WON" },
    include: { items: true },
  });

  let accumulatedPrizes = 0;
  for (const t of wonTickets) {
    for (const item of t.items) {
      if (item.isWinner && item.winAmount) {
        accumulatedPrizes += Number(item.winAmount);
      }
    }
  }

  return {
    balance,
    lastTicket,
    accumulatedPrizes,
    nextClose,
    openCount: openLotteries.length,
  };
}

export async function parsePlay(text: string) {
  const user = await requireAuth(["PLAYER"]);
  const parsed = parsePlayText(text);
  const validation = validateParsedPlay(parsed);

  if (!validation.valid) {
    return { success: false, error: validation.error, parsed };
  }

  if (parsed.intent === "CREATE_PLAY") {
    await prisma.playDraft.upsert({
      where: { userId: user.id },
      create: { userId: user.id, draftJson: JSON.stringify(parsed) },
      update: { draftJson: JSON.stringify(parsed) },
    });

    await createAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: "CREATE_PLAY_DRAFT",
      entityType: "PlayDraft",
      entityId: user.id,
      newValue: parsed,
    });

    const items = expandPlayItems(parsed);
    const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);

    return {
      success: true,
      parsed,
      items,
      totalAmount,
      needsConfirmation: true,
      message: `¿Confirmas jugar ${totalAmount} pesos?`,
    };
  }

  return { success: true, parsed };
}

export async function confirmPlay() {
  const user = await requireAuth(["PLAYER"]);

  const draft = await prisma.playDraft.findUnique({ where: { userId: user.id } });
  if (!draft) {
    return { success: false, error: "No hay jugada pendiente de confirmar" };
  }

  const parsed: ParsedPlay = JSON.parse(draft.draftJson);
  const validation = validateParsedPlay(parsed);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const items = expandPlayItems(parsed);
  const lotteryNames = [...new Set(items.map((i) => i.lottery))];
  const lotteryCheck = await validateLotteriesOpen(lotteryNames);
  if (!lotteryCheck.valid) {
    return { success: false, error: lotteryCheck.error };
  }

  const oddsMap = await getSystemOdds();
  const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
  const balance = await getPlayerBalance(user.id);

  if (balance < totalAmount) {
    return createPendingOrder(parsed, items, totalAmount);
  }

  const lotteryRecords = lotteryCheck.lotteries!;
  const lotteryMap = new Map(lotteryRecords.map((l) => [l.name, l.id]));

  const ticket = await prisma.$transaction(async (tx) => {
    const ticketNumber = generateTicketNumber();
    const verificationCode = generateVerificationCode();

    const newTicket = await tx.ticket.create({
      data: {
        ticketNumber,
        verificationCode,
        playerId: user.id,
        totalAmount,
        status: "ACTIVE",
        items: {
          create: items.map((item) => ({
            lotteryId: lotteryMap.get(item.lottery)!,
            playType: item.playType,
            number1: item.number1,
            number2: item.number2,
            number3: item.number3,
            amount: item.amount,
            odds: oddsMap[item.playType] ?? item.odds,
            possibleWin: item.possibleWin,
          })),
        },
      },
      include: { items: { include: { lottery: true } } },
    });

    const profile = await tx.playerProfile.findUnique({ where: { userId: user.id } });
    const balanceBefore = profile!.balance;
    const balanceAfter = balanceBefore.minus(totalAmount);

    await tx.playerProfile.update({
      where: { userId: user.id },
      data: { balance: balanceAfter },
    });

    await tx.walletTransaction.create({
      data: {
        userId: user.id,
        type: "BET",
        amount: totalAmount,
        balanceBefore,
        balanceAfter,
        referenceType: "Ticket",
        referenceId: newTicket.id,
        description: `Ticket ${ticketNumber}`,
      },
    });

    return newTicket;
  });

  await prisma.playDraft.delete({ where: { userId: user.id } });

  await createAuditLog({
    actorId: user.id,
    actorRole: user.role,
    action: "CONFIRM_TICKET",
    entityType: "Ticket",
    entityId: ticket.id,
    newValue: { ticketNumber: ticket.ticketNumber, totalAmount },
  });

  revalidatePath("/player");
  return { success: true, ticket, type: "TICKET" as const };
}

async function createPendingOrder(
  parsed: ParsedPlay,
  items: ReturnType<typeof expandPlayItems>,
  totalAmount: number
) {
  const user = await requireAuth(["PLAYER"]);
  const lotteryCheck = await validateLotteriesOpen([...new Set(items.map((i) => i.lottery))]);
  if (!lotteryCheck.valid) {
    return { success: false, error: lotteryCheck.error };
  }

  const lotteryMap = new Map(lotteryCheck.lotteries!.map((l) => [l.name, l.id]));
  const oddsMap = await getSystemOdds();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.playOrder.create({
      data: {
        orderNumber: generateOrderNumber(),
        playerId: user.id,
        totalAmount,
        status: "PENDING_PAYMENT",
        expiresAt,
        items: {
          create: items.map((item) => ({
            lotteryId: lotteryMap.get(item.lottery)!,
            playType: item.playType,
            number1: item.number1,
            number2: item.number2,
            number3: item.number3,
            amount: item.amount,
            odds: oddsMap[item.playType] ?? item.odds,
            possibleWin: item.possibleWin,
          })),
        },
      },
      include: { items: { include: { lottery: true } } },
    });
    return newOrder;
  });

  await prisma.playDraft.deleteMany({ where: { userId: user.id } });

  await createAuditLog({
    actorId: user.id,
    actorRole: user.role,
    action: "CREATE_PENDING_ORDER",
    entityType: "PlayOrder",
    entityId: order.id,
    newValue: { orderNumber: order.orderNumber, totalAmount },
  });

  revalidatePath("/player");
  return {
    success: true,
    order,
    type: "PENDING_ORDER" as const,
    message: "Saldo insuficiente. Se creó orden pendiente.",
  };
}

export async function cancelPlayDraft() {
  const user = await requireAuth(["PLAYER"]);
  await prisma.playDraft.deleteMany({ where: { userId: user.id } });
  return { success: true };
}

export async function getTickets(status?: string) {
  const user = await requireAuth(["PLAYER"]);
  const where: { playerId: string; status?: import("@prisma/client").TicketStatus } = {
    playerId: user.id,
  };
  if (status && status !== "ALL") {
    where.status = status as import("@prisma/client").TicketStatus;
  }

  return prisma.ticket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { items: { include: { lottery: true } } },
  });
}

export async function getTicketDetail(ticketId: string) {
  const user = await requireAuth(["PLAYER"]);
  return prisma.ticket.findFirst({
    where: { id: ticketId, playerId: user.id },
    include: { items: { include: { lottery: true } } },
  });
}

export async function getResults() {
  await requireAuth(["PLAYER"]);
  return prisma.lotteryResult.findMany({
    orderBy: { drawDate: "desc" },
    take: 30,
    include: { lottery: true },
  });
}

export async function getPrizes() {
  const user = await requireAuth(["PLAYER"]);
  return prisma.ticket.findMany({
    where: { playerId: user.id, status: { in: ["WON", "PAID"] } },
    orderBy: { updatedAt: "desc" },
    include: { items: { where: { isWinner: true }, include: { lottery: true } } },
  });
}

export async function claimRechargeQr(token: string) {
  const user = await requireAuth(["PLAYER"]);

  const code = await prisma.rechargeCode.findUnique({ where: { token } });
  if (!code) return { success: false, error: "QR inválido" };
  if (code.status !== "PENDING") return { success: false, error: "QR ya utilizado o cancelado" };
  if (code.expiresAt < new Date()) {
    await prisma.rechargeCode.update({
      where: { id: code.id },
      data: { status: "EXPIRED" },
    });
    return { success: false, error: "QR expirado" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.rechargeCode.update({
      where: { id: code.id },
      data: {
        status: "CLAIMED",
        claimedBy: user.id,
        claimedAt: new Date(),
      },
    });

    const profile = await tx.playerProfile.findUnique({ where: { userId: user.id } });
    const amount = Number(code.amount);
    const balanceBefore = profile!.balance;
    const balanceAfter = balanceBefore.plus(amount);

    await tx.playerProfile.update({
      where: { userId: user.id },
      data: { balance: balanceAfter },
    });

    await tx.walletTransaction.create({
      data: {
        userId: user.id,
        type: "DEPOSIT",
        amount,
        balanceBefore,
        balanceAfter,
        referenceType: "RechargeCode",
        referenceId: code.id,
        description: `Recarga QR ${code.code}`,
      },
    });
  });

  await createAuditLog({
    actorId: user.id,
    actorRole: user.role,
    action: "CLAIM_RECHARGE_QR",
    entityType: "RechargeCode",
    entityId: code.id,
    newValue: { amount: Number(code.amount) },
  });

  revalidatePath("/player");
  return { success: true, amount: Number(code.amount) };
}

export async function getPlayerQr() {
  const user = await requireAuth(["PLAYER"]);
  const profile = await prisma.playerProfile.findUnique({ where: { userId: user.id } });
  return {
    token: profile?.qrToken,
    phone: user.phone,
  };
}

export { getWalletHistory };

export async function getLastPlayDraft() {
  const user = await requireAuth(["PLAYER"]);
  const draft = await prisma.playDraft.findUnique({ where: { userId: user.id } });
  if (!draft) return null;
  return JSON.parse(draft.draftJson) as ParsedPlay;
}

export async function repeatLastPlay() {
  const user = await requireAuth(["PLAYER"]);
  const lastTicket = await prisma.ticket.findFirst({
    where: { playerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { lottery: true } } },
  });

  if (!lastTicket) {
    return { success: false, error: "No hay jugada anterior" };
  }

  const parsed: ParsedPlay = {
    intent: "CREATE_PLAY",
    type: lastTicket.items[0]?.playType,
    numbers: [
      lastTicket.items[0]?.number1,
      lastTicket.items[0]?.number2,
      lastTicket.items[0]?.number3,
    ].filter(Boolean) as string[],
    amount: Number(lastTicket.items[0]?.amount),
    lotteries: [...new Set(lastTicket.items.map((i) => i.lottery.name))],
    rawText: "repetir última jugada",
  };

  await prisma.playDraft.upsert({
    where: { userId: user.id },
    create: { userId: user.id, draftJson: JSON.stringify(parsed) },
    update: { draftJson: JSON.stringify(parsed) },
  });

  const items = expandPlayItems(parsed);
  const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);

  return { success: true, parsed, items, totalAmount, needsConfirmation: true };
}
