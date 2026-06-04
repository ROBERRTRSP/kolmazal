import { describe, it, expect } from "vitest";
import { parsePlayText, validateParsedPlay, expandPlayItems } from "@/lib/parser/play-parser";

describe("Play Parser - Quiniela", () => {
  it("parses quiniela from Dominican text", () => {
    const result = parsePlayText("Juega 100 al 23 en Nacional");
    expect(result.intent).toBe("CREATE_PLAY");
    expect(result.type).toBe("QUINIELA");
    expect(result.numbers).toEqual(["23"]);
    expect(result.amount).toBe(100);
    expect(result.lotteries).toContain("Nacional");
  });

  it("parses with ponme variant", () => {
    const result = parsePlayText("Ponme 50 al 45 en La Primera");
    expect(result.intent).toBe("CREATE_PLAY");
    expect(result.numbers).toContain("45");
    expect(result.amount).toBe(50);
  });

  it("parses word numbers", () => {
    const result = parsePlayText("Juega cien al veintitrés en Nacional");
    expect(result.amount).toBe(100);
    expect(result.numbers).toContain("23");
  });
});

describe("Play Parser - Palé", () => {
  it("parses pale", () => {
    const result = parsePlayText("Palé 12 con 45 por 20 en Nacional");
    expect(result.intent).toBe("CREATE_PLAY");
    expect(result.type).toBe("PALE");
    expect(result.numbers?.sort()).toEqual(["12", "45"]);
    expect(result.amount).toBe(20);
  });
});

describe("Play Parser - Tripleta", () => {
  it("parses tripleta", () => {
    const result = parsePlayText("Tripleta 12 45 80 por 10 en Loteka");
    expect(result.intent).toBe("CREATE_PLAY");
    expect(result.type).toBe("TRIPLETA");
    expect(result.numbers).toEqual(["12", "45", "80"]);
    expect(result.amount).toBe(10);
  });
});

describe("Play Parser - Invalid", () => {
  it("rejects invalid play", () => {
    const result = parsePlayText("Juega sin lotería");
    expect(result.intent).toBe("UNKNOWN");
  });

  it("validates parsed play", () => {
    const parsed = parsePlayText("Juega 100 al 23 en Nacional");
    const validation = validateParsedPlay(parsed);
    expect(validation.valid).toBe(true);
  });
});

describe("Play Parser - Confirm/Cancel", () => {
  it("detects confirm intent", () => {
    expect(parsePlayText("Sí").intent).toBe("CONFIRM");
    expect(parsePlayText("Confirma").intent).toBe("CONFIRM");
    expect(parsePlayText("Dale").intent).toBe("CONFIRM");
  });

  it("detects cancel intent", () => {
    expect(parsePlayText("Cancela").intent).toBe("CANCEL");
    expect(parsePlayText("No la juegues").intent).toBe("CANCEL");
  });
});

describe("Expand Play Items", () => {
  it("expands to multiple lotteries", () => {
    const parsed = parsePlayText("Juega 50 al 23 en todas las de la noche");
    const items = expandPlayItems(parsed);
    expect(items.length).toBeGreaterThan(1);
    expect(items.every((i) => i.number1 === "23")).toBe(true);
  });
});
