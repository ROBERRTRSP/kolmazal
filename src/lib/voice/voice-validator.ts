import { CONFIDENCE_THRESHOLD } from "./voice-intents";
import type { VoiceCommandResult, VoiceEntities, VoiceIntent, VoicePlayType } from "./voice-types";

function requiredNumbers(playType?: VoicePlayType): number {
  if (playType === "PALE") return 2;
  if (playType === "TRIPLETA") return 3;
  return 1;
}

export function getMissingFields(intent: VoiceIntent, entities: VoiceEntities): string[] {
  if (intent !== "CREATE_PLAY") return [];

  const missing: string[] = [];
  const needed = requiredNumbers(entities.playType);

  if (!entities.amount || entities.amount <= 0) missing.push("amount");
  if (!entities.numbers?.length || entities.numbers.length < needed) missing.push("numbers");
  if (!entities.lotteries?.length && !entities.lotteryGroup) missing.push("lotteries");

  return missing;
}

export function requiresConfirmation(intent: VoiceIntent, missingFields: string[]): boolean {
  if (missingFields.length > 0) return false;
  return intent === "CREATE_PLAY" || intent === "REPEAT_LAST_PLAY";
}

type FinalizeInput = {
  intent: VoiceIntent;
  confidence: number;
  transcript: string;
  normalizedText: string;
  entities: VoiceEntities;
  backendAction: string;
  userMessage: string;
};

export function finalizeVoiceCommand(input: FinalizeInput): VoiceCommandResult {
  const missingFields = getMissingFields(input.intent, input.entities);
  let confidence = input.confidence;
  let userMessage = input.userMessage;
  let intent = input.intent;

  if (missingFields.length > 0) {
    confidence = Math.min(confidence, 0.85);
    if (missingFields.includes("amount")) userMessage = "¿Cuánto quieres jugar?";
    else if (missingFields.includes("numbers")) userMessage = "¿Qué número quieres jugar?";
    else if (missingFields.includes("lotteries")) userMessage = "¿En cuál lotería quieres jugar?";
  }

  if (confidence < CONFIDENCE_THRESHOLD && intent !== "UNKNOWN") {
    userMessage = "No estoy seguro. ¿Puedes repetirlo? " + userMessage;
    confidence = Math.min(confidence, CONFIDENCE_THRESHOLD - 0.01);
  }

  if (intent === "UNKNOWN" || (confidence < 0.4 && missingFields.length === 0)) {
    intent = "UNKNOWN";
    userMessage =
      "No entendí ese comando. Puedes decir: jugar, balance, tickets, recargar o resultados.";
    confidence = Math.min(confidence, 0.3);
  }

  return {
    intent,
    confidence,
    transcript: input.transcript,
    normalizedText: input.normalizedText,
    entities: input.entities,
    missingFields,
    requiresConfirmation: requiresConfirmation(intent, missingFields),
    backendAction: input.backendAction,
    userMessage,
  };
}

export function validateVoiceCommand(command: VoiceCommandResult): {
  valid: boolean;
  error?: string;
} {
  if (command.confidence < CONFIDENCE_THRESHOLD && command.intent !== "HELP") {
    return { valid: false, error: command.userMessage };
  }
  if (command.missingFields.length > 0) {
    return { valid: false, error: command.userMessage };
  }
  if (command.intent === "UNKNOWN") {
    return { valid: false, error: command.userMessage };
  }
  return { valid: true };
}
