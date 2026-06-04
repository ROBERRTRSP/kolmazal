import { DAY_LOTTERIES, NIGHT_LOTTERIES } from "@/lib/lottery/constants";
import {
  BACKEND_ACTIONS,
  BALANCE_PATTERNS,
  CANCEL_PATTERNS,
  CONFIRM_PATTERNS,
  HELP_PATTERNS,
  LOTTERY_ALIAS_MAP,
  MODIFY_PATTERNS,
  OPEN_LOTTERIES_PATTERNS,
  PALE_PATTERNS,
  PLAY_VERBS,
  PROFILE_PATTERNS,
  QR_PATTERNS,
  RECHARGE_PATTERNS,
  REPEAT_PATTERNS,
  RESULT_PATTERNS,
  SCHEDULE_PATTERNS,
  SUPPORT_PATTERNS,
  TICKET_PATTERNS,
  TRIPLETA_PATTERNS,
  WINNING_PATTERNS,
} from "./voice-intents";
import { normalizeVoiceText } from "./voice-normalizer";
import { finalizeVoiceCommand } from "./voice-validator";
import type {
  LotteryGroup,
  VoiceCommandResult,
  VoiceEntities,
  VoiceIntent,
  VoicePlayType,
} from "./voice-types";

function detectPlayType(text: string): VoicePlayType {
  if (TRIPLETA_PATTERNS.test(text)) return "TRIPLETA";
  if (PALE_PATTERNS.test(text)) return "PALE";
  return "QUINIELA";
}

function extractAmount(text: string, playNumbers: string[]): number | undefined {
  const porMatch = text.match(/(?:por|de)\s+(\d+)/);
  if (porMatch) return parseInt(porMatch[1], 10);

  const commandMatch = text.match(
    /(?:juega|jugar|ponme|tirame|dame|meteme|mete|echame|pon)\s+(\d+)/
  );
  if (commandMatch) return parseInt(commandMatch[1], 10);

  const numbers = text.match(/\b(\d+)\b/g);
  if (numbers) {
    const playSet = new Set(playNumbers.map((n) => String(parseInt(n, 10))));
    const candidates = numbers
      .map(Number)
      .filter((n) => n >= 5 && n <= 100000 && !playSet.has(String(n)));
    if (candidates.length) return candidates[0];
  }

  return undefined;
}

function extractPlayNumbers(text: string, playType: VoicePlayType, amount?: number): string[] {
  const numbers: string[] = [];

  for (const m of text.matchAll(/\b(?:al|a)\s+(\d{1,2})\b/g)) {
    const num = m[1].padStart(2, "0");
    if (!numbers.includes(num)) numbers.push(num);
  }

  for (const m of text.matchAll(/\bcon\s+(\d{1,2})\b/g)) {
    const num = m[1].padStart(2, "0");
    if (!numbers.includes(num)) numbers.push(num);
  }

  for (const m of text.matchAll(/\b(\d{1,2})\b/g)) {
    const intVal = parseInt(m[1], 10);
    if (amount && intVal === amount) continue;
    const num = m[1].padStart(2, "0");
    if (intVal >= 0 && intVal <= 99 && !numbers.includes(num)) numbers.push(num);
  }

  const required = playType === "QUINIELA" ? 1 : playType === "PALE" ? 2 : 3;
  return numbers.slice(0, required);
}

function resolveLotteryGroup(text: string): LotteryGroup | undefined {
  if (text.includes("todas las de la noche") || text.includes("todas de la noche")) {
    return "NIGHT";
  }
  if (
    text.includes("todas las del dia") ||
    text.includes("todas del dia") ||
    text.includes("todas las de la manana") ||
    text.includes("todas de la manana")
  ) {
    return "DAY";
  }
  if (text.includes("todas las abiertas") || /\btodas\b/.test(text)) {
    return "ALL";
  }
  return undefined;
}

function resolveLotteries(text: string): { lotteries: string[]; lotteryGroup?: LotteryGroup } {
  const group = resolveLotteryGroup(text);
  if (group === "NIGHT") return { lotteries: [...NIGHT_LOTTERIES], lotteryGroup: "NIGHT" };
  if (group === "DAY") return { lotteries: [...DAY_LOTTERIES], lotteryGroup: "DAY" };
  if (group === "ALL") {
    return { lotteries: [...DAY_LOTTERIES, ...NIGHT_LOTTERIES], lotteryGroup: "ALL" };
  }

  const found: string[] = [];
  const sortedAliases = Object.entries(LOTTERY_ALIAS_MAP).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [alias, name] of sortedAliases) {
    if (text.includes(alias) && !found.includes(name)) {
      found.push(name);
    }
  }

  return { lotteries: found };
}

function detectIntent(text: string): VoiceIntent {
  const trimmed = text.trim();

  if (CONFIRM_PATTERNS.test(trimmed)) return "CONFIRM_PLAY";
  if (CANCEL_PATTERNS.test(trimmed)) return "CANCEL_CURRENT_DRAFT";
  if (HELP_PATTERNS.test(trimmed)) return "HELP";
  if (REPEAT_PATTERNS.test(trimmed)) return "REPEAT_LAST_PLAY";
  if (BALANCE_PATTERNS.test(trimmed)) return "GET_BALANCE";
  if (WINNING_PATTERNS.test(trimmed) && !PLAY_VERBS.test(trimmed)) return "CHECK_WINNING_TICKETS";
  if (TICKET_PATTERNS.test(trimmed)) {
    if (/ultimo|último|gano|ganó/.test(trimmed)) return "CHECK_TICKET";
    return "LIST_TICKETS";
  }
  if (RESULT_PATTERNS.test(trimmed)) return "GET_LOTTERY_RESULT";
  if (RECHARGE_PATTERNS.test(trimmed)) return "OPEN_RECHARGE";
  if (QR_PATTERNS.test(trimmed)) {
    if (/escanear|scan/.test(trimmed)) return "SCAN_RECHARGE_QR";
    if (/crear|pago|pendiente|cajero/.test(trimmed)) return "CREATE_PENDING_PAYMENT_QR";
    return "SHOW_PLAYER_QR";
  }
  if (OPEN_LOTTERIES_PATTERNS.test(trimmed)) return "GET_OPEN_LOTTERIES";
  if (SCHEDULE_PATTERNS.test(trimmed)) return "GET_DRAW_SCHEDULE";
  if (PROFILE_PATTERNS.test(trimmed)) return "OPEN_PROFILE";
  if (SUPPORT_PATTERNS.test(trimmed)) return "CREATE_SUPPORT_TICKET";
  if (MODIFY_PATTERNS.test(trimmed)) return "MODIFY_DRAFT_PLAY";

  if (
    PLAY_VERBS.test(trimmed) ||
    PALE_PATTERNS.test(trimmed) ||
    TRIPLETA_PATTERNS.test(trimmed)
  ) {
    return "CREATE_PLAY";
  }

  return "UNKNOWN";
}

function extractModification(text: string): VoiceEntities["modification"] | undefined {
  if (/monto|pesos|ponlo en|dejalo en/.test(text)) {
    const amount = extractAmount(text, []);
    if (amount) return { field: "amount", value: amount };
  }
  if (/numero|número/.test(text)) {
    const nums = extractPlayNumbers(text, "QUINIELA");
    if (nums[0]) return { field: "number", value: nums[0] };
  }
  if (/quita/.test(text)) {
    const { lotteries } = resolveLotteries(text);
    if (lotteries[0]) return { field: "remove_lottery", value: lotteries[0] };
  }
  if (/agrega|agregar|ponlo en la/.test(text)) {
    const { lotteries } = resolveLotteries(text);
    if (lotteries[0]) return { field: "add_lottery", value: lotteries[0] };
  }
  return undefined;
}

function extractCreatePlayEntities(text: string): VoiceEntities {
  const playType = detectPlayType(text);
  const preAmount = extractAmount(text, []);
  const numbers = extractPlayNumbers(text, playType, preAmount);
  const amount = extractAmount(text, numbers);
  const { lotteries, lotteryGroup } = resolveLotteries(text);

  return { playType, numbers, amount, lotteries, lotteryGroup };
}

function buildUserMessage(
  intent: VoiceIntent,
  entities: VoiceEntities,
  missingFields: string[]
): string {
  if (missingFields.includes("amount")) return "¿Cuánto quieres jugar?";
  if (missingFields.includes("numbers")) return "¿Qué número quieres jugar?";
  if (missingFields.includes("lotteries")) return "¿En cuál lotería quieres jugar?";

  switch (intent) {
    case "CREATE_PLAY": {
      const type = entities.playType?.toLowerCase() ?? "jugada";
      const nums = entities.numbers?.join("-") ?? "";
      const lot = entities.lotteries?.join(", ") ?? "";
      const amt = entities.amount ?? 0;
      return `Detecté ${type} ${nums} en ${lot} por RD$${amt}. ¿Confirmas?`;
    }
    case "CONFIRM_PLAY":
      return "Confirmando jugada.";
    case "CANCEL_CURRENT_DRAFT":
      return "Jugada cancelada.";
    case "GET_BALANCE":
      return "Consultando tu balance.";
    case "LIST_TICKETS":
      return "Mostrando tus tickets.";
    case "CHECK_TICKET":
      return "Revisando tu último ticket.";
    case "CHECK_WINNING_TICKETS":
      return "Buscando tickets ganadores.";
    case "GET_LOTTERY_RESULT": {
      const lot = entities.lotteries?.[0] ?? "la lotería";
      return `Consultando resultado de ${lot}.`;
    }
    case "SHOW_PLAYER_QR":
      return "Mostrando tu QR personal.";
    case "OPEN_RECHARGE":
      return "Abriendo recarga.";
    case "REPEAT_LAST_PLAY":
      return "Repitiendo tu última jugada.";
    case "MODIFY_DRAFT_PLAY": {
      const mod = entities.modification;
      if (mod?.field === "amount") return `Monto actualizado a RD$${mod.value}.`;
      if (mod?.field === "number") return `Número actualizado a ${mod.value}.`;
      if (mod?.field === "remove_lottery") return `Se quitó ${mod.value}.`;
      if (mod?.field === "add_lottery") return `Se agregó ${mod.value}.`;
      return "Modificando jugada.";
    }
    case "HELP":
      return "Puedes decir: jugar, balance, tickets, recargar, resultados o confirma.";
    default:
      return "No entendí ese comando. Puedes decir: jugar, balance, tickets, recargar o resultados.";
  }
}

export function parseVoiceCommand(text: string): VoiceCommandResult {
  const transcript = text.trim();
  const normalizedText = normalizeVoiceText(transcript);
  const intent = detectIntent(normalizedText);

  let entities: VoiceEntities = {};
  let confidence = 0.5;

  switch (intent) {
    case "CREATE_PLAY": {
      entities = extractCreatePlayEntities(normalizedText);
      confidence = 0.85;
      if (entities.playType && entities.numbers?.length && entities.amount && entities.lotteries?.length) {
        confidence = 0.95;
      } else if (entities.numbers?.length || entities.amount) {
        confidence = 0.8;
      }
      break;
    }
    case "MODIFY_DRAFT_PLAY": {
      entities = { modification: extractModification(normalizedText) };
      confidence = entities.modification ? 0.9 : 0.6;
      break;
    }
    case "CONFIRM_PLAY":
    case "CANCEL_CURRENT_DRAFT":
      confidence = 0.98;
      break;
    case "GET_BALANCE":
    case "LIST_TICKETS":
    case "SHOW_PLAYER_QR":
    case "OPEN_RECHARGE":
    case "REPEAT_LAST_PLAY":
      confidence = 0.95;
      break;
    case "GET_LOTTERY_RESULT": {
      const { lotteries } = resolveLotteries(normalizedText);
      entities = { lotteries };
      confidence = lotteries.length ? 0.92 : 0.7;
      break;
    }
    case "CHECK_TICKET":
    case "CHECK_WINNING_TICKETS":
      confidence = 0.9;
      break;
    case "HELP":
      confidence = 0.99;
      break;
    case "UNKNOWN":
      confidence = 0.2;
      break;
    default:
      confidence = 0.75;
  }

  return finalizeVoiceCommand({
    intent,
    confidence,
    transcript,
    normalizedText,
    entities,
    backendAction: BACKEND_ACTIONS[intent],
    userMessage: buildUserMessage(intent, entities, []),
  });
}
