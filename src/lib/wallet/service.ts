import { prisma } from "@/lib/db";
import type { WalletTransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export async function getPlayerBalance(userId: string): Promise<number> {
  const profile = await prisma.playerProfile.findUnique({ where: { userId } });
  return profile ? Number(profile.balance) : 0;
}

export async function updateBalance(params: {
  userId: string;
  amount: number;
  type: WalletTransactionType;
  referenceType?: string;
  referenceId?: string;
  description?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const profile = await tx.playerProfile.findUnique({ where: { userId: params.userId } });
    if (!profile) throw new Error("Perfil de jugador no encontrado");

    const balanceBefore = profile.balance;
    const change = new Decimal(params.amount);
    let balanceAfter: Decimal;

    if (["BET", "WITHDRAWAL"].includes(params.type)) {
      balanceAfter = balanceBefore.minus(change.abs());
      if (balanceAfter.lessThan(0)) {
        throw new Error("Saldo insuficiente");
      }
    } else {
      balanceAfter = balanceBefore.plus(change.abs());
    }

    await tx.playerProfile.update({
      where: { userId: params.userId },
      data: { balance: balanceAfter },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        userId: params.userId,
        type: params.type,
        amount: change.abs(),
        balanceBefore,
        balanceAfter,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        description: params.description,
      },
    });

    return { balanceAfter: Number(balanceAfter), transaction };
  });
}

export async function getWalletHistory(userId: string, limit = 50) {
  return prisma.walletTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
