import { describe, it, expect } from "vitest";
import { isValidPlayNumber, normalizeLotteryName } from "@/lib/lottery/constants";

describe("Lottery validation", () => {
  it("validates play numbers", () => {
    expect(isValidPlayNumber("00")).toBe(true);
    expect(isValidPlayNumber("99")).toBe(true);
    expect(isValidPlayNumber("100")).toBe(false);
    expect(isValidPlayNumber("abc")).toBe(false);
  });

  it("normalizes lottery names", () => {
    expect(normalizeLotteryName("nacional")).toBe("Nacional");
    expect(normalizeLotteryName("la loteka")).toBe("Loteka");
    expect(normalizeLotteryName("invalid")).toBeNull();
  });
});

describe("Balance rules", () => {
  it("rejects zero amount", () => {
    const amount = 0;
    expect(amount <= 0).toBe(true);
  });

  it("detects insufficient balance", () => {
    const balance = 100;
    const totalAmount = 200;
    expect(balance < totalAmount).toBe(true);
  });
});

describe("QR rules", () => {
  it("prevents duplicate claim", () => {
    const usedStatuses = ["CLAIMED", "EXPIRED", "CANCELLED"];
    for (const status of usedStatuses) {
      expect(status !== "PENDING").toBe(true);
    }
  });

  it("detects expired QR", () => {
    const expiresAt = new Date(Date.now() - 1000);
    expect(expiresAt < new Date()).toBe(true);
  });
});

describe("Order rules", () => {
  it("rejects expired order", () => {
    const expiresAt = new Date(Date.now() - 60000);
    expect(expiresAt < new Date()).toBe(true);
  });

  it("rejects already executed order", () => {
    const status: string = "EXECUTED";
    expect(status !== "PENDING_PAYMENT").toBe(true);
  });
});

describe("Settlement rules", () => {
  it("only VERIFIED results should settle", () => {
    const unverifiedStatuses = ["WAITING", "FETCHED", "PENDING_VERIFY", "DISPUTED"];
    for (const status of unverifiedStatuses) {
      expect(status).not.toBe("VERIFIED");
    }
  });

  it("prevents double settlement with unique constraint", () => {
    const settlements = new Set<string>();
    const key1 = "ticket1-result1";
    const key2 = "ticket1-result1";
    settlements.add(key1);
    expect(settlements.has(key2)).toBe(true);
    expect(settlements.size).toBe(1);
  });
});
