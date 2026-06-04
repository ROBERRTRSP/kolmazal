import { prisma } from "@/lib/db";
import { isLotteryOpen } from "@/lib/lottery/constants";
import type { LotteryStatus } from "@prisma/client";

export async function getLotteryByName(name: string) {
  return prisma.lottery.findUnique({ where: { name } });
}

export async function getOpenLotteries() {
  const lotteries = await prisma.lottery.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return lotteries.map((lottery) => {
    const open = isLotteryOpen(lottery.closeTime, lottery.drawTime);
    return {
      ...lottery,
      computedOpen: open,
      status: (open ? "OPEN" : "CLOSED") as LotteryStatus,
    };
  });
}

export async function validateLotteriesOpen(lotteryNames: string[]) {
  const lotteries = await prisma.lottery.findMany({
    where: { name: { in: lotteryNames }, isActive: true },
  });

  if (lotteries.length !== lotteryNames.length) {
    const found = new Set(lotteries.map((l) => l.name));
    const missing = lotteryNames.filter((n) => !found.has(n));
    return { valid: false, error: `Lotería no encontrada: ${missing.join(", ")}` };
  }

  const closed = lotteries.filter((l) => !isLotteryOpen(l.closeTime, l.drawTime));
  if (closed.length) {
    return { valid: false, error: `Lotería cerrada: ${closed.map((l) => l.name).join(", ")}` };
  }

  return { valid: true, lotteries };
}

export async function getSystemOdds() {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: ["ODDS_QUINIELA", "ODDS_PALE", "ODDS_TRIPLETA"] },
    },
  });

  const map: Record<string, number> = {
    QUINIELA: 70,
    PALE: 1000,
    TRIPLETA: 20000,
  };

  for (const s of settings) {
    const key = s.key.replace("ODDS_", "");
    map[key] = parseInt(s.value, 10);
  }

  return map;
}

export async function getNextClosingLottery() {
  const lotteries = await getOpenLotteries();
  const open = lotteries.filter((l) => l.computedOpen);
  if (!open.length) return null;
  return open.sort((a, b) => a.closeTime.localeCompare(b.closeTime))[0];
}
