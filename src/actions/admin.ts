"use server";

import { prisma } from "@/lib/db";
import { requireAuth, createAuditLog } from "@/lib/auth";
import { calculateItemPrize, isTicketItemWinner } from "@/lib/prizes/prize-engine";
import { revalidatePath } from "next/cache";

export async function getAdminDashboard() {
  await requireAuth(["ADMIN", "SUPER_ADMIN"]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    ticketsToday,
    rechargesToday,
    pendingOrders,
    activePlayers,
    activeCashiers,
    recentResults,
    alerts,
  ] = await Promise.all([
    prisma.ticket.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.walletTransaction.aggregate({
      where: { type: "DEPOSIT", createdAt: { gte: today } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.playOrder.count({
      where: { status: "PENDING_PAYMENT", expiresAt: { gt: new Date() } },
    }),
    prisma.user.count({ where: { role: "PLAYER", isActive: true } }),
    prisma.user.count({ where: { role: "CASHIER", isActive: true } }),
    prisma.lotteryResult.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { lottery: true },
    }),
    prisma.lotteryResult.count({ where: { status: "DISPUTED" } }),
  ]);

  const prizesPaid = await prisma.walletTransaction.aggregate({
    where: { type: "CASHIER_PAYMENT", createdAt: { gte: today } },
    _sum: { amount: true },
  });

  return {
    salesToday: Number(ticketsToday._sum.totalAmount ?? 0),
    ticketsSold: ticketsToday._count,
    rechargesToday: Number(rechargesToday._sum.amount ?? 0),
    rechargesCount: rechargesToday._count,
    prizesPaid: Number(prizesPaid._sum.amount ?? 0),
    pendingOrders,
    activePlayers,
    activeCashiers,
    recentResults,
    alerts,
  };
}

export async function getPlayers() {
  await requireAuth(["ADMIN", "SUPER_ADMIN"]);
  return prisma.user.findMany({
    where: { role: "PLAYER" },
    include: { playerProfile: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCashiers() {
  await requireAuth(["ADMIN", "SUPER_ADMIN"]);
  return prisma.user.findMany({
    where: { role: "CASHIER" },
    include: {
      cashierProfile: true,
      cashierShifts: { where: { status: "OPEN" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminTickets() {
  await requireAuth(["ADMIN", "SUPER_ADMIN"]);
  return prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      player: true,
      items: { include: { lottery: true } },
    },
  });
}

export async function getAdminResults() {
  await requireAuth(["ADMIN", "SUPER_ADMIN"]);
  return prisma.lotteryResult.findMany({
    orderBy: { drawDate: "desc" },
    include: { lottery: true, source: true },
  });
}

export async function getAdminPrizes() {
  await requireAuth(["ADMIN", "SUPER_ADMIN"]);
  return prisma.prizeSettlement.findMany({
    orderBy: { settledAt: "desc" },
    take: 100,
    include: {
      ticket: { include: { player: true } },
      result: { include: { lottery: true } },
    },
  });
}

export async function getReports() {
  await requireAuth(["ADMIN", "SUPER_ADMIN"]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [dailyTickets, weeklyTickets, dailyRecharges] = await Promise.all([
    prisma.ticket.groupBy({
      by: ["status"],
      where: { createdAt: { gte: today } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.ticket.aggregate({
      where: { createdAt: { gte: weekAgo } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.walletTransaction.aggregate({
      where: { type: "DEPOSIT", createdAt: { gte: today } },
      _sum: { amount: true },
    }),
  ]);

  return { dailyTickets, weeklyTickets, dailyRecharges };
}

export async function updateLotterySchedule(
  lotteryId: string,
  data: { drawTime: string; closeTime: string }
) {
  const user = await requireAuth(["ADMIN", "SUPER_ADMIN"]);

  const lottery = await prisma.lottery.update({
    where: { id: lotteryId },
    data: { drawTime: data.drawTime, closeTime: data.closeTime },
  });

  await createAuditLog({
    actorId: user.id,
    actorRole: user.role,
    action: "ADMIN_UPDATE_SETTING",
    entityType: "Lottery",
    entityId: lotteryId,
    newValue: data,
  });

  revalidatePath("/admin/settings");
  return { success: true, lottery };
}

export async function updateLimits(data: {
  maxBetAmount?: number;
  minBetAmount?: number;
  oddsQuiniela?: number;
  oddsPale?: number;
  oddsTripleta?: number;
}) {
  const user = await requireAuth(["ADMIN", "SUPER_ADMIN"]);

  const settings = [
    { key: "MAX_BET_AMOUNT", value: data.maxBetAmount?.toString() },
    { key: "MIN_BET_AMOUNT", value: data.minBetAmount?.toString() },
    { key: "ODDS_QUINIELA", value: data.oddsQuiniela?.toString() },
    { key: "ODDS_PALE", value: data.oddsPale?.toString() },
    { key: "ODDS_TRIPLETA", value: data.oddsTripleta?.toString() },
  ].filter((s) => s.value !== undefined);

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      create: { key: setting.key, value: setting.value!, updatedBy: user.id },
      update: { value: setting.value!, updatedBy: user.id },
    });
  }

  await createAuditLog({
    actorId: user.id,
    actorRole: user.role,
    action: "ADMIN_UPDATE_SETTING",
    entityType: "SystemSetting",
    newValue: data,
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function runDemoResultsSettlement() {
  const user = await requireAuth(["ADMIN", "SUPER_ADMIN"]);

  const pendingResults = await prisma.lotteryResult.findMany({
    where: { status: { in: ["FETCHED", "PENDING_VERIFY"] } },
    include: { lottery: true },
  });

  let settledCount = 0;

  for (const result of pendingResults) {
    const verified = await prisma.lotteryResult.update({
      where: { id: result.id },
      data: { status: "VERIFIED", verifiedAt: new Date() },
    });

    await createAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: "RESULT_VERIFIED",
      entityType: "LotteryResult",
      entityId: result.id,
    });

    const tickets = await prisma.ticket.findMany({
      where: {
        status: "ACTIVE",
        items: { some: { lotteryId: result.lotteryId } },
      },
      include: { items: { where: { lotteryId: result.lotteryId } } },
    });

    for (const ticket of tickets) {
      const existingSettlement = await prisma.prizeSettlement.findFirst({
        where: { ticketId: ticket.id, resultId: result.id },
      });
      if (existingSettlement) continue;

      let totalWin = 0;
      const winningItems: string[] = [];

      for (const item of ticket.items) {
        const winner = isTicketItemWinner(
          {
            playType: item.playType,
            number1: item.number1,
            number2: item.number2,
            number3: item.number3,
            amount: Number(item.amount),
            odds: item.odds,
          },
          {
            number1: result.number1,
            number2: result.number2,
            number3: result.number3,
          }
        );

        if (winner) {
          const prize = calculateItemPrize(
            {
              playType: item.playType,
              number1: item.number1,
              number2: item.number2,
              number3: item.number3,
              amount: Number(item.amount),
              odds: item.odds,
            },
            {
              number1: result.number1,
              number2: result.number2,
              number3: result.number3,
            }
          );
          totalWin += prize;
          winningItems.push(item.id);

          await prisma.ticketItem.update({
            where: { id: item.id },
            data: { isWinner: true, winAmount: prize },
          });
        }
      }

      const allItems = await prisma.ticketItem.findMany({ where: { ticketId: ticket.id } });
      const anyWinner = allItems.some((i) => i.isWinner);

      if (totalWin > 0) {
        await prisma.$transaction(async (tx) => {
          await tx.prizeSettlement.create({
            data: {
              ticketId: ticket.id,
              resultId: result.id,
              amount: totalWin,
            },
          });

          const profile = await tx.playerProfile.findUnique({
            where: { userId: ticket.playerId },
          });
          const balanceBefore = profile!.balance;
          const balanceAfter = balanceBefore.plus(totalWin);

          await tx.playerProfile.update({
            where: { userId: ticket.playerId },
            data: { balance: balanceAfter },
          });

          await tx.walletTransaction.create({
            data: {
              userId: ticket.playerId,
              type: "WIN",
              amount: totalWin,
              balanceBefore,
              balanceAfter,
              referenceType: "Ticket",
              referenceId: ticket.id,
              description: `Premio ${ticket.ticketNumber}`,
            },
          });

          await tx.ticket.update({
            where: { id: ticket.id },
            data: { status: "WON" },
          });

          await tx.notificationEvent.create({
            data: {
              userId: ticket.playerId,
              type: "PRIZE_WON",
              title: "¡Ganaste!",
              message: `Tu ticket ${ticket.ticketNumber} ganó ${totalWin} pesos`,
              metadata: JSON.stringify({ ticketId: ticket.id, amount: totalWin }),
            },
          });
        });

        await createAuditLog({
          actorId: user.id,
          actorRole: user.role,
          action: "PRIZE_SETTLED",
          entityType: "Ticket",
          entityId: ticket.id,
          newValue: { totalWin, resultId: result.id },
        });

        settledCount++;
      } else if (!anyWinner) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: "LOST" },
        });
      }

      await prisma.lotteryResult.update({
        where: { id: verified.id },
        data: { status: "SETTLED", settledAt: new Date() },
      });
    }
  }

  revalidatePath("/admin");
  return { success: true, verified: pendingResults.length, settled: settledCount };
}

export async function getAuditLogs(limit = 100) {
  await requireAuth(["ADMIN", "SUPER_ADMIN"]);
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: true },
  });
}

export async function getSystemSettings() {
  await requireAuth(["ADMIN", "SUPER_ADMIN"]);
  return prisma.systemSetting.findMany({ orderBy: { key: "asc" } });
}

export async function getLotteriesAdmin() {
  await requireAuth(["ADMIN", "SUPER_ADMIN"]);
  return prisma.lottery.findMany({ orderBy: { name: "asc" } });
}

export async function createDemoResult(lotteryId: string, numbers: string[]) {
  const user = await requireAuth(["ADMIN", "SUPER_ADMIN"]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await prisma.lotteryResult.upsert({
    where: {
      lotteryId_drawDate: { lotteryId, drawDate: today },
    },
    create: {
      lotteryId,
      drawDate: today,
      number1: numbers[0],
      number2: numbers[1],
      number3: numbers[2],
      status: "PENDING_VERIFY",
    },
    update: {
      number1: numbers[0],
      number2: numbers[1],
      number3: numbers[2],
      status: "PENDING_VERIFY",
    },
  });

  await createAuditLog({
    actorId: user.id,
    actorRole: user.role,
    action: "RESULT_FETCHED",
    entityType: "LotteryResult",
    entityId: result.id,
    newValue: numbers,
  });

  return { success: true, result };
}
