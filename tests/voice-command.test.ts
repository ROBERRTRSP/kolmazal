import { describe, it, expect } from "vitest";
import { parseVoiceCommand, normalizeVoiceText } from "@/lib/voice";

describe("ChatVoz - normalizeVoiceText", () => {
  it("normalizes accents and pale", () => {
    expect(normalizeVoiceText("Palé veintitrés")).toContain("pale");
    expect(normalizeVoiceText("Palé veintitrés")).toContain("23");
  });

  it("converts word amounts", () => {
    expect(normalizeVoiceText("juega cien al 09")).toContain("100");
    expect(normalizeVoiceText("juega cien al 09")).toContain("09");
  });
});

describe("ChatVoz - CREATE_PLAY", () => {
  it('1. "Juega 100 al 23 en Nacional"', () => {
    const r = parseVoiceCommand("Juega 100 al 23 en Nacional");
    expect(r.intent).toBe("CREATE_PLAY");
    expect(r.confidence).toBeGreaterThanOrEqual(0.75);
    expect(r.entities.playType).toBe("QUINIELA");
    expect(r.entities.numbers).toEqual(["23"]);
    expect(r.entities.amount).toBe(100);
    expect(r.entities.lotteries).toContain("Nacional");
    expect(r.missingFields).toEqual([]);
    expect(r.requiresConfirmation).toBe(true);
    expect(r.backendAction).toBe("CREATE_PLAY_DRAFT");
    expect(r.userMessage).toContain("¿Confirmas?");
  });

  it('2. "Ponme 50 al 45 en La Primera"', () => {
    const r = parseVoiceCommand("Ponme 50 al 45 en La Primera");
    expect(r.intent).toBe("CREATE_PLAY");
    expect(r.entities.numbers).toContain("45");
    expect(r.entities.amount).toBe(50);
    expect(r.entities.lotteries?.length).toBeGreaterThan(0);
    expect(r.missingFields).toEqual([]);
    expect(r.backendAction).toBe("CREATE_PLAY_DRAFT");
  });

  it('3. "Palé 12 con 45 por 20 en Loteka"', () => {
    const r = parseVoiceCommand("Palé 12 con 45 por 20 en Loteka");
    expect(r.intent).toBe("CREATE_PLAY");
    expect(r.entities.playType).toBe("PALE");
    expect(r.entities.numbers?.sort()).toEqual(["12", "45"]);
    expect(r.entities.amount).toBe(20);
    expect(r.entities.lotteries).toContain("Loteka");
    expect(r.requiresConfirmation).toBe(true);
  });

  it('4. "Tripleta 12 45 80 por 10"', () => {
    const r = parseVoiceCommand("Tripleta 12 45 80 por 10 en Loteka");
    expect(r.intent).toBe("CREATE_PLAY");
    expect(r.entities.playType).toBe("TRIPLETA");
    expect(r.entities.numbers).toEqual(["12", "45", "80"]);
    expect(r.entities.amount).toBe(10);
    expect(r.missingFields).toEqual([]);
  });
});

describe("ChatVoz - CONFIRM / CANCEL", () => {
  it('5. "Confirma"', () => {
    const r = parseVoiceCommand("Confirma");
    expect(r.intent).toBe("CONFIRM_PLAY");
    expect(r.confidence).toBeGreaterThanOrEqual(0.9);
    expect(r.requiresConfirmation).toBe(false);
    expect(r.backendAction).toBe("CONFIRM_CURRENT_DRAFT");
    expect(r.userMessage).toContain("Confirmando");
  });

  it('6. "Cancela"', () => {
    const r = parseVoiceCommand("Cancela");
    expect(r.intent).toBe("CANCEL_CURRENT_DRAFT");
    expect(r.backendAction).toBe("CANCEL_CURRENT_DRAFT");
    expect(r.requiresConfirmation).toBe(false);
  });
});

describe("ChatVoz - MODIFY / REPEAT / QUERIES", () => {
  it('7. "Cambia el monto a 200"', () => {
    const r = parseVoiceCommand("Cambia el monto a 200");
    expect(r.intent).toBe("MODIFY_DRAFT_PLAY");
    expect(r.entities.modification?.field).toBe("amount");
    expect(r.entities.modification?.value).toBe(200);
    expect(r.backendAction).toBe("MODIFY_CURRENT_DRAFT");
  });

  it('8. "Repite la última jugada"', () => {
    const r = parseVoiceCommand("Repite la última jugada");
    expect(r.intent).toBe("REPEAT_LAST_PLAY");
    expect(r.backendAction).toBe("REPEAT_LAST_PLAY");
    expect(r.requiresConfirmation).toBe(true);
  });

  it('9. "Cuánto balance tengo"', () => {
    const r = parseVoiceCommand("Cuánto balance tengo");
    expect(r.intent).toBe("GET_BALANCE");
    expect(r.backendAction).toBe("GET_PLAYER_BALANCE");
    expect(r.userMessage).toContain("balance");
    expect(r.requiresConfirmation).toBe(false);
  });

  it('10. "Muéstrame mis tickets"', () => {
    const r = parseVoiceCommand("Muéstrame mis tickets");
    expect(r.intent).toBe("LIST_TICKETS");
    expect(r.backendAction).toBe("GET_PLAYER_TICKETS");
  });

  it('11. "Qué salió en Nacional"', () => {
    const r = parseVoiceCommand("Qué salió en Nacional");
    expect(r.intent).toBe("GET_LOTTERY_RESULT");
    expect(r.entities.lotteries).toContain("Nacional");
    expect(r.backendAction).toBe("GET_LOTTERY_RESULT");
  });

  it('12. "Muestra mi QR"', () => {
    const r = parseVoiceCommand("Muestra mi QR");
    expect(r.intent).toBe("SHOW_PLAYER_QR");
    expect(r.backendAction).toBe("GET_PLAYER_QR");
  });
});

describe("ChatVoz - missing fields", () => {
  it("13. entrada sin monto", () => {
    const r = parseVoiceCommand("Juega al 23 en Nacional");
    expect(r.intent).toBe("CREATE_PLAY");
    expect(r.missingFields).toContain("amount");
    expect(r.userMessage).toContain("Cuánto");
    expect(r.requiresConfirmation).toBe(false);
  });

  it("14. entrada sin número", () => {
    const r = parseVoiceCommand("Juega 100 en Nacional");
    expect(r.missingFields).toContain("numbers");
    expect(r.userMessage).toContain("número");
  });

  it("15. entrada sin lotería", () => {
    const r = parseVoiceCommand("Juega 100 al 23");
    expect(r.missingFields).toContain("lotteries");
    expect(r.userMessage).toContain("lotería");
  });
});

describe("ChatVoz - UNKNOWN", () => {
  it("16. texto incomprensible", () => {
    const r = parseVoiceCommand("asdfgh qwerty zxcvbn");
    expect(r.intent).toBe("UNKNOWN");
    expect(r.backendAction).toBe("NONE");
    expect(r.userMessage).toContain("No entendí");
  });
});
