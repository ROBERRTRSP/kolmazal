import { describe, it, expect } from "vitest";
import {
  checkQuinielaWin,
  checkPaleWin,
  checkTripletaWin,
  calculateItemPrize,
  isTicketItemWinner,
} from "@/lib/prizes/prize-engine";

describe("Prize Engine - Quiniela", () => {
  it("wins when number matches first prize", () => {
    const item = { playType: "QUINIELA" as const, number1: "23", amount: 100, odds: 70 };
    const result = { number1: "23", number2: "45", number3: "67" };
    expect(checkQuinielaWin(item, result)).toBe(true);
    expect(calculateItemPrize(item, result)).toBe(7000);
  });

  it("loses when number does not match", () => {
    const item = { playType: "QUINIELA" as const, number1: "99", amount: 100, odds: 70 };
    const result = { number1: "23", number2: "45", number3: "67" };
    expect(checkQuinielaWin(item, result)).toBe(false);
    expect(calculateItemPrize(item, result)).toBe(0);
  });
});

describe("Prize Engine - Palé", () => {
  it("wins when both numbers match", () => {
    const item = {
      playType: "PALE" as const,
      number1: "23",
      number2: "45",
      amount: 20,
      odds: 1000,
    };
    const result = { number1: "23", number2: "45", number3: "67" };
    expect(checkPaleWin(item, result)).toBe(true);
    expect(calculateItemPrize(item, result)).toBe(20000);
  });

  it("wins regardless of order", () => {
    const item = {
      playType: "PALE" as const,
      number1: "45",
      number2: "23",
      amount: 20,
      odds: 1000,
    };
    const result = { number1: "23", number2: "45", number3: "67" };
    expect(checkPaleWin(item, result)).toBe(true);
  });
});

describe("Prize Engine - Tripleta", () => {
  it("wins when all three match in order", () => {
    const item = {
      playType: "TRIPLETA" as const,
      number1: "23",
      number2: "45",
      number3: "67",
      amount: 10,
      odds: 20000,
    };
    const result = { number1: "23", number2: "45", number3: "67" };
    expect(checkTripletaWin(item, result)).toBe(true);
    expect(calculateItemPrize(item, result)).toBe(200000);
  });

  it("loses when order differs", () => {
    const item = {
      playType: "TRIPLETA" as const,
      number1: "45",
      number2: "23",
      number3: "67",
      amount: 10,
      odds: 20000,
    };
    const result = { number1: "23", number2: "45", number3: "67" };
    expect(checkTripletaWin(item, result)).toBe(false);
  });
});

describe("Prize Engine - isTicketItemWinner", () => {
  it("delegates to correct checker", () => {
    expect(
      isTicketItemWinner(
        { playType: "QUINIELA", number1: "23", amount: 100, odds: 70 },
        { number1: "23" }
      )
    ).toBe(true);
  });
});

describe("Prize Engine - Unverified result", () => {
  it("returns 0 prize for losing ticket regardless of verification", () => {
    const item = { playType: "QUINIELA" as const, number1: "99", amount: 100, odds: 70 };
    const result = { number1: "23" };
    expect(calculateItemPrize(item, result)).toBe(0);
  });
});
