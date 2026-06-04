export const LOTTERY_ALIASES: Record<string, string[]> = {
  "La Primera Día": ["primera dia", "primera día", "la primera dia", "la primera día", "primera de dia", "primera", "la primera"],
  "La Primera Noche": ["primera noche", "la primera noche", "primera de noche"],
  Nacional: ["nacional", "la nacional", "dominicana"],
  Loteka: ["loteka", "la loteka"],
  Leidsa: ["leidsa", "la leidsa"],
  "Quiniela Real": ["quiniela real", "real", "la real"],
  "Florida PM": ["florida", "florida pm", "fl pm"],
  "New York PM": ["new york", "new york pm", "ny pm", "nueva york"],
  "Anguila Noche": ["anguila", "anguila noche", "anguilla"],
};

export const NIGHT_LOTTERIES = [
  "La Primera Noche",
  "Nacional",
  "Loteka",
  "Leidsa",
  "Quiniela Real",
  "Florida PM",
  "New York PM",
  "Anguila Noche",
];

export const DAY_LOTTERIES = ["La Primera Día"];

export const DEFAULT_ODDS = {
  QUINIELA: 70,
  PALE: 1000,
  TRIPLETA: 20000,
} as const;

export type PlayTypeKey = keyof typeof DEFAULT_ODDS;

export function normalizeLotteryName(input: string): string | null {
  const lower = input.toLowerCase().trim();
  for (const [name, aliases] of Object.entries(LOTTERY_ALIASES)) {
    if (name.toLowerCase() === lower) return name;
    if (aliases.some((a) => lower.includes(a) || a.includes(lower))) return name;
  }
  return null;
}

export function resolveLotteriesFromText(text: string): string[] {
  const lower = text.toLowerCase();
  if (lower.includes("todas las de la noche") || lower.includes("todas de la noche")) {
    return [...NIGHT_LOTTERIES];
  }
  if (lower.includes("todas las de la mañana") || lower.includes("todas de la mañana")) {
    return [...DAY_LOTTERIES];
  }
  if (/\btodas\b/.test(lower)) {
    return [...NIGHT_LOTTERIES, ...DAY_LOTTERIES];
  }

  const found: string[] = [];
  for (const [name, aliases] of Object.entries(LOTTERY_ALIASES)) {
    const patterns = [name.toLowerCase(), ...aliases];
    if (patterns.some((p) => lower.includes(p))) {
      found.push(name);
    }
  }
  return [...new Set(found)];
}

export function isValidPlayNumber(num: string): boolean {
  return /^\d{2}$/.test(num) && parseInt(num, 10) >= 0 && parseInt(num, 10) <= 99;
}

export function parseTimeToMinutes(time: string): number {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function getDominicanNow(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Santo_Domingo" })
  );
}

export function isLotteryOpen(closeTime: string, drawTime: string): boolean {
  const now = getDominicanNow();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const closeMinutes = parseTimeToMinutes(closeTime);
  const drawMinutes = parseTimeToMinutes(drawTime);

  if (closeMinutes <= drawMinutes) {
    return currentMinutes >= 0 && currentMinutes < closeMinutes;
  }
  return currentMinutes < closeMinutes || currentMinutes >= drawMinutes;
}

export function calculatePossibleWin(amount: number, odds: number): number {
  return amount * odds;
}
