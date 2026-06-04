const WORD_TO_DIGIT: Record<string, string> = {
  cero: "00",
  uno: "01",
  un: "01",
  una: "01",
  dos: "02",
  tres: "03",
  cuatro: "04",
  cinco: "05",
  seis: "06",
  siete: "07",
  ocho: "08",
  nueve: "09",
  diez: "10",
  once: "11",
  doce: "12",
  trece: "13",
  catorce: "14",
  quince: "15",
  dieciseis: "16",
  diecisiete: "17",
  dieciocho: "18",
  diecinueve: "19",
  veinte: "20",
  veintiuno: "21",
  veintidos: "22",
  veintitres: "23",
  veinticuatro: "24",
  veinticinco: "25",
  treinta: "30",
  cuarenta: "40",
  cincuenta: "50",
  sesenta: "60",
  setenta: "70",
  ochenta: "80",
  noventa: "90",
};

const WORD_TO_AMOUNT: Record<string, string> = {
  cien: "100",
  ciento: "100",
  doscientos: "200",
  trescientos: "300",
  cuatrocientos: "400",
  quinientos: "500",
  seiscientos: "600",
  setecientos: "700",
  ochocientos: "800",
  novecientos: "900",
  mil: "1000",
};

const DOMINICAN_REPLACEMENTS: [RegExp, string][] = [
  [/\btírame\b/g, "tirame"],
  [/\béchame\b/g, "echame"],
  [/\bméteme\b/g, "meteme"],
  [/\bpalé\b/g, "pale"],
  [/\bnasionar\b/g, "nacional"],
  [/\bta bien\b/g, "esta bien"],
];

export function normalizeVoiceText(text: string): string {
  let normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [pattern, replacement] of DOMINICAN_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }

  for (const [word, digit] of Object.entries(WORD_TO_DIGIT)) {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, "g"), digit);
  }

  for (const [word, amount] of Object.entries(WORD_TO_AMOUNT)) {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, "g"), amount);
  }

  return normalized.replace(/\s+/g, " ").trim();
}
