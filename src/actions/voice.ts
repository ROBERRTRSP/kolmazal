"use server";

import { requireAuth } from "@/lib/auth";
import { parseVoiceCommand, routeVoiceCommand } from "@/lib/voice";
import type { VoiceCommandResult } from "@/lib/voice/voice-types";
import { revalidatePath } from "next/cache";

export async function processVoiceCommand(text: string) {
  const user = await requireAuth(["PLAYER"]);
  const command = parseVoiceCommand(text);

  if (command.missingFields.length > 0) {
    return {
      success: false,
      command,
      message: command.userMessage,
      needsMoreInfo: true,
    };
  }

  if (command.intent === "UNKNOWN" || command.confidence < 0.75) {
    return {
      success: false,
      command,
      message: command.userMessage,
    };
  }

  const result = await routeVoiceCommand(user.id, command);

  if (result.success) {
    revalidatePath("/player");
  }

  return {
    success: result.success,
    command,
    message: result.message,
    data: result.data,
    requiresConfirmation: result.requiresConfirmation ?? command.requiresConfirmation,
    redirectTo: result.redirectTo,
  };
}

export async function interpretVoiceCommand(text: string): Promise<{
  command: VoiceCommandResult;
}> {
  await requireAuth(["PLAYER"]);
  return { command: parseVoiceCommand(text) };
}
