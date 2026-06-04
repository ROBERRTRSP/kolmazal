"use server";

import { prisma } from "@/lib/db";
import { requireAuth, createAuditLog } from "@/lib/auth";
import { generateCode, generateTicketNumber, generateVerificationCode } from "@/lib/utils";
import { validateLotteriesOpen } from "@/lib/lottery/service";
import { revalidatePath } from "next/cache";

async function getOpenShift(cashierId: string) {
  return prisma.cashierShift.findFirst({
    where: { cashierId, status: "OPEN" },
    orderBy: { openedAt: "desc" },
  });
}

export async function getCashierDashboard() {
  const user = await requireAuth(["CASHIER"]);
  let shift = await getOpenShift(user.id);

  if (!shift) {
    shift = await prisma.cashierShift.create({
      data: { cashierId: user.id, status: "OPEN" },
    });
  }

  const [pendingOrders, recentActivity] = await Promise.all([
    prisma.playOrder.findMany({
      where: { status: "PENDING_PAYMENT", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        player: true,
        items: { include: { lottery: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { actorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return { shift, pendingOrders, recentActivity };
}

export async function scanQr(token: string) {
  await requireAuth(["CASHIER"]);

  const playerProfile = await prisma.playerProfile.findUnique({
    where: { qrToken: token },
    include: { user: true },
  });
  if (playerProfile) {
    return {
      type: "PLAYER" as const,
      data: {
        userId: playerProfile.userId,
        phone: playerProfile.user.phone,
        balance: Number(playerProfile.balance),
      },
    };
  }

  const order = await prisma.playOrder.findUnique({
    where: { paymentToken: token },
    include: {
      player: true,
      items: { include: { lottery: true } },
    },
  });
  if (order) {
    return { type: "PENDING_ORDER" as const, data: order };
  }

  const recharge = await prisma.rechargeCode.findUnique({ where: { token } });
  if (recharge) {
    return { type: "RECHARGE" as const, data: recharge };
  }

  return { type: "UNKNOWN" as const, error: "QR no reconocido" };
}

export async function executePendingOrder(orderId: string) {
  const user = await requireAuth(["CASHIER"]);

  const order = await prisma.playOrder.findUnique({
    where: { id: orderId },
    include: { items: { include: { lottery: true } } },
  });

  if (!order) return { success: false, error: "Orden no encontrada" };
  if (order.status !== "PENDING_PAYMENT") {
    return { success: false, error: "Orden ya procesada" };
  }
  if (order.expiresAt < new Date()) {
    await prisma.playOrder.update({
      where: { id: orderId },
      data: { status: "EXPIRED" },
    });
    return { success: false, error: "Orden expirada" };
  }

  const lotteryNames = order.items.map((i) => i.lottery.name);
  const lotteryCheck = await validateLotteriesOpen(lotteryNames);
  if (!lotteryCheck.valid) {
    return { success: false, error: lotteryCheck.error };
  }

  const shift = await getOpenShift(user.id);
  if (!shift) return { success: false, error: "No hay turno abierto" };

  const ticket = await prisma.$transaction(async (tx) => {
    const ticketNumber = generateTicketNumber();
    const verificationCode = generateVerificationCode();

    const newTicket = await tx.ticket.create({
      data: {
        ticketNumber,
        verificationCode,
        playerId: order.playerId,
        totalAmount: order.totalAmount,
        status: "ACTIVE",
        items: {
          create: order.items.map((item) => ({
            lotteryId: item.lotteryId,
            playType: item.playType,
            number1: item.number1,
            number2: item.number2,
            number3: item.number3,
            amount: item.amount,
            odds: item.odds,
            possibleWin: item.possibleWin,
          })),
        },
      },
    });

    await tx.playOrder.update({
      where: { id: orderId },
      data: {
        status: "EXECUTED",
        cashierId: user.id,
        ticketId: newTicket.id,
        paidAt: new Date(),
        executedAt: new Date(),
      },
    });

    await tx.cashierShift.update({
      where: { id: shift.id },
      data: {
        totalSales: { increment: Number(order.totalAmount) },
        ordersExecuted: { increment: 1 },
      },
    });

    return newTicket;
  });

  await createAuditLog({
    actorId: user.id,
    actorRole: user.role,
    action: "CASHIER_EXECUTE_ORDER",
    entityType: "PlayOrder",
    entityId: orderId,
    newValue: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
  });

  revalidatePath("/cashier");
  return { success: true, ticket };
}

export async function createRechargeQr(amount: number) {
  const user = await requireAuth(["CASHIER"]);

  if (amount <= 0) return { success: false, error: "Monto inválido" };

  const code = await prisma.rechargeCode.create({
    data: {
      code: generateCode("RC-"),
      amount,
      createdBy: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "PENDING",
    },
  });

  await createAuditLog({
    actorId: user.id,
    actorRole: user.role,
    action: "CREATE_RECHARGE_QR",
    entityType: "RechargeCode",
    entityId: code.id,
    newValue: { amount, code: code.code },
  });

  revalidatePath("/cashier/recharge");
  return { success: true, code };
}

export async function printRechargeQr(codeId: string) {
  const user = await requireAuth(["CASHIER"]);

  const code = await prisma.rechargeCode.update({
    where: { id: codeId, createdBy: user.id },
    data: {
      printedAt: new Date(),
      printCount: { increment: 1 },
    },
  });

  return { success: true, code };
}

export async function payPrize(ticketId: string) {
  const user = await requireAuth(["CASHIER"]);

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { items: true, player: { include: { playerProfile: true } } },
  });

  if (!ticket) return { success: false, error: "Ticket no encontrado" };
  if (ticket.status !== "WON") {
    return { success: false, error: "Ticket no es ganador o ya fue pagado" };
  }

  let prizeAmount = 0;
  for (const item of ticket.items) {
    if (item.isWinner && item.winAmount) {
      prizeAmount += Number(item.winAmount);
    }
  }

  if (prizeAmount <= 0) {
    return { success: false, error: "Sin premio pendiente" };
  }

  const shift = await getOpenShift(user.id);

  await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id: ticketId },
      data: { status: "PAID" },
    });

    const profile = ticket.player.playerProfile!;
    const balanceBefore = profile.balance;
    const balanceAfter = balanceBefore.minus(prizeAmount);

    await tx.playerProfile.update({
      where: { userId: ticket.playerId },
      data: { balance: balanceAfter },
    });

    await tx.walletTransaction.create({
      data: {
        userId: ticket.playerId,
        type: "CASHIER_PAYMENT",
        amount: prizeAmount,
        balanceBefore,
        balanceAfter,
        referenceType: "Ticket",
        referenceId: ticketId,
        description: `Pago premio ${ticket.ticketNumber}`,
      },
    });

    if (shift) {
      await tx.cashierShift.update({
        where: { id: shift.id },
        data: { totalPrizesPaid: { increment: prizeAmount } },
      });
    }
  });

  revalidatePath("/cashier");
  return { success: true, amount: prizeAmount };
}

export async function closeShift() {
  const user = await requireAuth(["CASHIER"]);

  const shift = await getOpenShift(user.id);
  if (!shift) return { success: false, error: "No hay turno abierto" };

  await prisma.cashierShift.update({
    where: { id: shift.id },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  await createAuditLog({
    actorId: user.id,
    actorRole: user.role,
    action: "CASHIER_CLOSE_SHIFT",
    entityType: "CashierShift",
    entityId: shift.id,
    newValue: {
      totalSales: Number(shift.totalSales),
      totalRecharges: Number(shift.totalRecharges),
      totalPrizesPaid: Number(shift.totalPrizesPaid),
    },
  });

  revalidatePath("/cashier");
  return { success: true, shift };
}

export async function getCashierActivity() {
  const user = await requireAuth(["CASHIER"]);
  const shift = await getOpenShift(user.id);

  const orders = await prisma.playOrder.findMany({
    where: { cashierId: user.id },
    orderBy: { executedAt: "desc" },
    take: 20,
    include: { player: true },
  });

  const recharges = await prisma.rechargeCode.findMany({
    where: { createdBy: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return { shift, orders, recharges };
}

export async function getPendingOrders() {
  await requireAuth(["CASHIER"]);
  return prisma.playOrder.findMany({
    where: { status: "PENDING_PAYMENT", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    include: {
      player: true,
      items: { include: { lottery: true } },
    },
  });
}

export async function getCashierTickets() {
  const user = await requireAuth(["CASHIER"]);
  return prisma.playOrder.findMany({
    where: { cashierId: user.id, status: "EXECUTED" },
    orderBy: { executedAt: "desc" },
    take: 50,
    include: { ticket: true, player: true },
  });
}
