import type { PlayType } from "@prisma/client";

export type LotteryResultNumbers = {
  number1: string;
  number2?: string | null;
  number3?: string | null;
};

export type TicketItemForPrize = {
  playType: PlayType;
  number1: string;
  number2?: string | null;
  number3?: string | null;
  amount: number;
  odds: number;
};

export function checkQuinielaWin(item: TicketItemForPrize, result: LotteryResultNumbers): boolean {
  return item.number1 === result.number1;
}

export function checkPaleWin(item: TicketItemForPrize, result: LotteryResultNumbers): boolean {
  if (!result.number1 || !result.number2) return false;
  const nums = [item.number1, item.number2!].sort();
  const res = [result.number1, result.number2].sort();
  return nums[0] === res[0] && nums[1] === res[1];
}

export function checkTripletaWin(item: TicketItemForPrize, result: LotteryResultNumbers): boolean {
  if (!result.number1 || !result.number2 || !result.number3) return false;
  return (
    item.number1 === result.number1 &&
    item.number2 === result.number2 &&
    item.number3 === result.number3
  );
}

export function isTicketItemWinner(
  item: TicketItemForPrize,
  result: LotteryResultNumbers
): boolean {
  switch (item.playType) {
    case "QUINIELA":
      return checkQuinielaWin(item, result);
    case "PALE":
      return checkPaleWin(item, result);
    case "TRIPLETA":
      return checkTripletaWin(item, result);
    default:
      return false;
  }
}

export function calculateItemPrize(item: TicketItemForPrize, result: LotteryResultNumbers): number {
  if (!isTicketItemWinner(item, result)) return 0;
  return item.amount * item.odds;
}

export function calculateTicketPrize(
  items: TicketItemForPrize[],
  result: LotteryResultNumbers
): { totalWin: number; winningItems: number[] } {
  let totalWin = 0;
  const winningItems: number[] = [];

  items.forEach((item, index) => {
    const prize = calculateItemPrize(item, result);
    if (prize > 0) {
      totalWin += prize;
      winningItems.push(index);
    }
  });

  return { totalWin, winningItems };
}
