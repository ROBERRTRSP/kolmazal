import {
  DEFAULT_ODDS,
  isValidPlayNumber,
  normalizeLotteryName,
  resolveLotteriesFromText,
  type PlayTypeKey,
} from "@/lib/lottery/constants";

export type PlayIntent =
  | "CREATE_PLAY"
  | "CONFIRM"
  | "CANCEL"
  | "MODIFY"
  | "QUERY_BALANCE"
  | "QUERY_TICKETS"
  | "QUERY_PRIZES"
  | "QUERY_RESULTS"
  | "QUERY_OPEN_LOTTERIES"
  | "REPEAT_LAST"
  | "SHOW_QR"
  | "RECHARGE"
  | "UNKNOWN";

export type ParsedPlay = {
  intent: PlayIntent;
  type?: PlayTypeKey;
  numbers?: string[];
  amount?: number;
  lotteries?: string[];
  modifyField?: "amount" | "number" | "lottery_add" | "lottery_remove";
  modifyValue?: string | number;
  rawText: string;
  message?: string;
};

const WORD_TO_NUMBER: Record<string, number> = {
  cero: 0,
  uno: 1,
  un: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  dieciseis: 16,
  dieciséis: 16,
  diecisiete: 17,
  dieciocho: 18,
  diecinueve: 19,
  veinte: 20,
  veintiuno: 21,
  veintidos: 22,
  veintidós: 22,
  veintitres: 23,
  veintitrés: 23,
  veinticuatro: 24,
  veinticinco: 25,
  treinta: 30,
  cuarenta: 40,
  cincuenta: 50,
  sesenta: 60,
  setenta: 70,
  ochenta: 80,
  noventa: 90,
  cien: 100,
  ciento: 100,
  doscientos: 200,
  trescientos: 300,
  cuatrocientos: 400,
  quinientos: 500,
  seiscientos: 600,
  setecientos: 700,
  ochocientos: 800,
  novecientos: 900,
  mil: 1000,
};

const CONFIRM_PATTERNS = /^(si|sí|confirma|dale|procesa|ejecuta|ok|okay|listo)$/i;
const CANCEL_PATTERNS = /^(cancela|no la juegues|borra eso|olvidalo|olvídalo|no)$/i;

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAmountFromWords(normalized: string): number | undefined {
  const commandWordMatch = normalized.match(
    /(?:juega|ponme|tirame|dame|mete|echame)\s+(cien|ciento|mil|quinientos|doscientos|trescientos|cuatrocientos|seiscientos|setecientos|ochocientos|novecientos)\b/
  );
  if (commandWordMatch) {
    return WORD_TO_NUMBER[commandWordMatch[1]];
  }

  for (const [word, num] of Object.entries(WORD_TO_NUMBER)) {
    if (num < 100) continue;
    const wordPattern = new RegExp(`\\b${word}\\b`);
    if (wordPattern.test(normalized)) return num;
  }

  return undefined;
}

function extractAmount(text: string, playNumbers: string[]): number | undefined {
  const normalized = normalizeText(text);

  const porMatch = normalized.match(/(?:por|de)\s+(\d+)/);
  if (porMatch) return parseInt(porMatch[1], 10);

  const wordAmount = extractAmountFromWords(normalized);
  if (wordAmount) return wordAmount;

  const commandMatch = normalized.match(/(?:juega|ponme|tirame|dame|mete|echame)\s+(\d+)/);
  if (commandMatch) return parseInt(commandMatch[1], 10);

  const numbers = normalized.match(/\b(\d+)\b/g);
  if (numbers) {
    const playNumberSet = new Set(playNumbers.map((n) => String(parseInt(n, 10))));
    const candidates = numbers
      .map(Number)
      .filter((n) => n >= 5 && n <= 100000 && !playNumberSet.has(String(n)));
    if (candidates.length) return candidates[0];
  }

  return undefined;
}

function extractPlayNumbers(text: string, type: PlayTypeKey, amount?: number): string[] {
  const normalized = normalizeText(text);
  const numbers: string[] = [];

  const alMatches = [...normalized.matchAll(/\b(?:al|a)\s+(\d{1,2})\b/g)];
  for (const m of alMatches) {
    const num = m[1].padStart(2, "0");
    if (isValidPlayNumber(num) && !numbers.includes(num)) numbers.push(num);
  }

  const conMatches = [...normalized.matchAll(/\bcon\s+(\d{1,2})\b/g)];
  for (const m of conMatches) {
    const num = m[1].padStart(2, "0");
    if (isValidPlayNumber(num) && !numbers.includes(num)) numbers.push(num);
  }

  for (const [word, num] of Object.entries(WORD_TO_NUMBER)) {
    if (num > 99) continue;
    const afterAl = new RegExp(`\\b(?:al|a)\\s+${word}\\b`);
    if (afterAl.test(normalized)) {
      const formatted = num.toString().padStart(2, "0");
      if (!numbers.includes(formatted)) numbers.push(formatted);
    }
  }

  const digitMatches = normalized.match(/\b(\d{1,2})\b/g) ?? [];
  for (const d of digitMatches) {
    const intVal = parseInt(d, 10);
    if (amount && intVal === amount) continue;
    const num = d.padStart(2, "0");
    if (isValidPlayNumber(num) && !numbers.includes(num)) numbers.push(num);
  }

  const required = type === "QUINIELA" ? 1 : type === "PALE" ? 2 : 3;
  return numbers.slice(0, required);
}

function detectPlayType(text: string): PlayTypeKey {
  const normalized = normalizeText(text);
  if (/tripleta/.test(normalized)) return "TRIPLETA";
  if (/pale|pale/.test(normalized)) return "PALE";
  return "QUINIELA";
}

function detectIntent(text: string): PlayIntent {
  const normalized = normalizeText(text);

  if (CONFIRM_PATTERNS.test(normalized)) return "CONFIRM";
  if (CANCEL_PATTERNS.test(normalized)) return "CANCEL";

  if (/balance|cuanto tengo|cuanto balance/.test(normalized)) return "QUERY_BALANCE";
  if (/mis tickets|ver tickets|tickets/.test(normalized)) return "QUERY_TICKETS";
  if (/premios|tengo premios/.test(normalized)) return "QUERY_PRIZES";
  if (/que salio|resultado/.test(normalized)) return "QUERY_RESULTS";
  if (/loterias abiertas|abiertas/.test(normalized)) return "QUERY_OPEN_LOTTERIES";
  if (/repite|ultima jugada/.test(normalized)) return "REPEAT_LAST";
  if (/mi qr|muestra qr|mostrar qr/.test(normalized)) return "SHOW_QR";
  if (/recargar|recarga|quiero recargar/.test(normalized)) return "RECHARGE";

  if (/cambia el monto|cambiar monto|dejalo en|dejalo en/.test(normalized)) return "MODIFY";
  if (/cambia el numero|cambiar numero/.test(normalized)) return "MODIFY";
  if (/quita|agrega|agregar/.test(normalized)) return "MODIFY";

  if (/pale|tripleta|juega|ponme|tirame|dame|mete|echame/.test(normalized)) {
    return "CREATE_PLAY";
  }

  return "UNKNOWN";
}

export function parsePlayText(text: string): ParsedPlay {
  const rawText = text.trim();
  const intent = detectIntent(rawText);

  if (intent === "MODIFY") {
    const normalized = normalizeText(rawText);
    if (/monto|pesos|dejalo/.test(normalized)) {
      return {
        intent,
        modifyField: "amount",
        modifyValue: extractAmount(rawText, extractPlayNumbers(rawText, "QUINIELA")) ?? 0,
        rawText,
      };
    }
    if (/numero/.test(normalized)) {
      const nums = extractPlayNumbers(rawText, "QUINIELA");
      return {
        intent,
        modifyField: "number",
        modifyValue: nums[0] ?? "",
        rawText,
      };
    }
    if (/quita/.test(normalized)) {
      const lotteries = resolveLotteriesFromText(rawText);
      return {
        intent,
        modifyField: "lottery_remove",
        modifyValue: lotteries[0] ?? "",
        rawText,
      };
    }
    if (/agrega/.test(normalized)) {
      const lotteries = resolveLotteriesFromText(rawText);
      return {
        intent,
        modifyField: "lottery_add",
        modifyValue: lotteries[0] ?? "",
        rawText,
      };
    }
  }

  if (intent !== "CREATE_PLAY") {
    return { intent, rawText };
  }

  const type = detectPlayType(rawText);
  const preAmount = extractAmount(rawText, []);
  const numbers = extractPlayNumbers(rawText, type, preAmount);
  const amount = extractAmount(rawText, numbers);
  const lotteries = resolveLotteriesFromText(rawText);

  const requiredNumbers = type === "QUINIELA" ? 1 : type === "PALE" ? 2 : 3;

  if (numbers.length < requiredNumbers) {
    return {
      intent: "UNKNOWN",
      rawText,
      message: `Se necesitan ${requiredNumbers} número(s) para ${type}`,
    };
  }

  if (!amount || amount <= 0) {
    return {
      intent: "UNKNOWN",
      rawText,
      message: "Monto inválido o no especificado",
    };
  }

  if (!lotteries.length) {
    return {
      intent: "UNKNOWN",
      rawText,
      message: "Debe especificar al menos una lotería",
    };
  }

  return {
    intent: "CREATE_PLAY",
    type,
    numbers,
    amount,
    lotteries,
    rawText,
  };
}

export function validateParsedPlay(parsed: ParsedPlay): { valid: boolean; error?: string } {
  if (parsed.intent !== "CREATE_PLAY") return { valid: true };

  if (!parsed.type || !parsed.numbers || !parsed.amount || !parsed.lotteries?.length) {
    return { valid: false, error: "Jugada incompleta" };
  }

  const required = parsed.type === "QUINIELA" ? 1 : parsed.type === "PALE" ? 2 : 3;
  if (parsed.numbers.length < required) {
    return { valid: false, error: `Se requieren ${required} números` };
  }

  for (const num of parsed.numbers) {
    if (!isValidPlayNumber(num)) {
      return { valid: false, error: `Número inválido: ${num}` };
    }
  }

  if (parsed.amount <= 0) {
    return { valid: false, error: "El monto debe ser positivo" };
  }

  for (const lot of parsed.lotteries) {
    if (!normalizeLotteryName(lot)) {
      return { valid: false, error: `Lotería no reconocida: ${lot}` };
    }
  }

  return { valid: true };
}

export function getOddsForType(type: PlayTypeKey): number {
  return DEFAULT_ODDS[type];
}

export function expandPlayItems(parsed: ParsedPlay) {
  if (!parsed.type || !parsed.numbers || !parsed.amount || !parsed.lotteries) {
    return [];
  }

  const odds = getOddsForType(parsed.type);
  return parsed.lotteries.map((lottery) => ({
    lottery,
    playType: parsed.type!,
    number1: parsed.numbers![0],
    number2: parsed.type !== "QUINIELA" ? parsed.numbers![1] : undefined,
    number3: parsed.type === "TRIPLETA" ? parsed.numbers![2] : undefined,
    amount: parsed.amount!,
    odds,
    possibleWin: parsed.amount! * odds,
  }));
}
