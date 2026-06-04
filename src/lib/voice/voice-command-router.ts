"use server";

import {
  cancelPlayDraft,
  confirmPlay,
  getPlayerQr,
  getPrizes,
  getTickets,
  repeatLastPlay,
} from "@/actions/player";
import { getPlayerBalance } from "@/lib/wallet/service";
import { prisma } from "@/lib/db";
import { getOpenLotteries, getNextClosingLottery } from "@/lib/lottery/service";
import { expandPlayItems, type ParsedPlay } from "@/lib/parser/play-parser";
import { createAuditLog } from "@/lib/auth";
import type { VoiceCommandResult, VoiceEntities } from "./voice-types";
import type { PlayTypeKey } from "@/lib/lottery/constants";

export type VoiceRouteResponse = {
  success: boolean;
  message: string;
  data?: unknown;
  requiresConfirmation?: boolean;
  redirectTo?: string;
};

async function createPlayDraft(userId: string, entities: VoiceEntities): Promise<VoiceRouteResponse> {
  const parsed: ParsedPlay = {
    intent: "CREATE_PLAY",
    type: entities.playType as PlayTypeKey,
    numbers: entities.numbers,
    amount: entities.amount,
    lotteries: entities.lotteries,
    rawText: "voice command",
  };

  await prisma.playDraft.upsert({
    where: { userId },
    create: { userId, draftJson: JSON.stringify(parsed) },
    update: { draftJson: JSON.stringify(parsed) },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    await createAuditLog({
      actorId: userId,
      actorRole: user.role,
      action: "CREATE_PLAY_DRAFT",
      entityType: "PlayDraft",
      entityId: userId,
      newValue: parsed,
    });
  }

  const items = expandPlayItems(parsed);
  const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);

  return {
    success: true,
    message: `Borrador creado por RD$${totalAmount}. Di "confirma" para ejecutar.`,
    data: { items, totalAmount, parsed },
    requiresConfirmation: true,
  };
}

async function modifyCurrentDraft(
  userId: string,
  modification?: VoiceEntities["modification"]
): Promise<VoiceRouteResponse> {
  const draft = await prisma.playDraft.findUnique({ where: { userId } });
  if (!draft) {
    return { success: false, message: "No hay jugada en borrador para modificar." };
  }

  const parsed: ParsedPlay = JSON.parse(draft.draftJson);
  if (!modification) {
    return { success: false, message: "No detecté qué modificar." };
  }

  switch (modification.field) {
    case "amount":
      parsed.amount = Number(modification.value);
      break;
    case "number":
      if (parsed.numbers) parsed.numbers[0] = String(modification.value);
      break;
    case "remove_lottery":
      parsed.lotteries = parsed.lotteries?.filter((l) => l !== modification.value);
      break;
    case "add_lottery":
      parsed.lotteries = [...(parsed.lotteries ?? []), String(modification.value)];
      break;
    case "lottery":
      parsed.lotteries = [String(modification.value)];
      break;
  }

  await prisma.playDraft.update({
    where: { userId },
    data: { draftJson: JSON.stringify(parsed) },
  });

  const items = expandPlayItems(parsed);
  return {
    success: true,
    message: "Borrador actualizado.",
    data: { items, totalAmount: items.reduce((s, i) => s + i.amount, 0) },
    requiresConfirmation: true,
  };
}

async function getLotteryResult(lotteryName?: string): Promise<VoiceRouteResponse> {
  const results = await prisma.lotteryResult.findMany({
    orderBy: { drawDate: "desc" },
    take: 10,
    include: { lottery: true },
  });

  const filtered = lotteryName
    ? results.filter((r) => r.lottery.name.toLowerCase().includes(lotteryName.toLowerCase()))
    : results;

  if (!filtered.length) {
    return { success: false, message: "No hay resultados disponibles para esa lotería." };
  }

  const latest = filtered[0];
  return {
    success: true,
    message: `${latest.lottery.name}: ${latest.number1}-${latest.number2 ?? ""}-${latest.number3 ?? ""}`,
    data: latest,
  };
}

async function checkWinningTickets(userId: string): Promise<VoiceRouteResponse> {
  const tickets = await prisma.ticket.findMany({
    where: { playerId: userId, status: "WON" },
    take: 5,
    orderBy: { updatedAt: "desc" },
  });

  if (!tickets.length) {
    return { success: true, message: "No tienes tickets ganadores pendientes." };
  }

  return {
    success: true,
    message: `Tienes ${tickets.length} ticket(s) ganador(es).`,
    data: tickets,
    redirectTo: "/player/prizes",
  };
}

async function checkLastTicket(userId: string): Promise<VoiceRouteResponse> {
  const ticket = await prisma.ticket.findFirst({
    where: { playerId: userId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { lottery: true } } },
  });

  if (!ticket) {
    return { success: false, message: "No tienes tickets aún." };
  }

  const status =
    ticket.status === "WON" ? "ganaste" : ticket.status === "LOST" ? "perdiste" : ticket.status;

  return {
    success: true,
    message: `Tu último ticket ${ticket.ticketNumber} está ${status}.`,
    data: ticket,
    redirectTo: `/player/tickets/${ticket.id}`,
  };
}

export async function routeVoiceCommand(
  userId: string,
  command: VoiceCommandResult
): Promise<VoiceRouteResponse> {
  if (command.confidence < 0.75 && command.intent !== "HELP") {
    return { success: false, message: command.userMessage };
  }

  if (command.missingFields.length > 0) {
    return { success: false, message: command.userMessage };
  }

  switch (command.intent) {
    case "CREATE_PLAY":
      return createPlayDraft(userId, command.entities);

    case "CONFIRM_PLAY": {
      const result = await confirmPlay();
      if (!result.success) return { success: false, message: result.error ?? "Error al confirmar" };
      const confirmMessage =
        "type" in result && result.type === "PENDING_ORDER"
          ? "Orden pendiente creada. Muestra el QR al cajero."
          : "Ticket creado exitosamente.";
      return {
        success: true,
        message: confirmMessage,
        data: result,
      };
    }

    case "CANCEL_CURRENT_DRAFT":
      await cancelPlayDraft();
      return { success: true, message: "Jugada cancelada." };

    case "MODIFY_DRAFT_PLAY":
      return modifyCurrentDraft(userId, command.entities.modification);

    case "REPEAT_LAST_PLAY": {
      const result = await repeatLastPlay();
      if (!result.success) return { success: false, message: result.error ?? "Sin jugada anterior" };
      return {
        success: true,
        message: "Última jugada cargada. ¿Confirmas?",
        data: result,
        requiresConfirmation: true,
      };
    }

    case "GET_BALANCE": {
      const balance = await getPlayerBalance(userId);
      return { success: true, message: `Tu balance es RD$${balance.toLocaleString("es-DO")}.`, data: { balance } };
    }

    case "LIST_TICKETS": {
      const tickets = await getTickets();
      return {
        success: true,
        message: `Tienes ${tickets.length} tickets.`,
        data: tickets,
        redirectTo: "/player/tickets",
      };
    }

    case "CHECK_TICKET":
      return checkLastTicket(userId);

    case "CHECK_WINNING_TICKETS":
      return checkWinningTickets(userId);

    case "GET_PRIZES": {
      const prizes = await getPrizes();
      return {
        success: true,
        message: `Tienes ${prizes.length} premio(s).`,
        data: prizes,
        redirectTo: "/player/prizes",
      };
    }

    case "OPEN_RECHARGE":
      return { success: true, message: "Abre recarga para escanear QR.", redirectTo: "/player/recharge" };

    case "SCAN_RECHARGE_QR":
      return { success: true, message: "Escanea el QR de recarga.", redirectTo: "/player/recharge" };

    case "SHOW_PLAYER_QR": {
      const qr = await getPlayerQr();
      return {
        success: true,
        message: "Mostrando tu QR.",
        data: qr,
        redirectTo: "/player/qr",
      };
    }

    case "CREATE_PENDING_PAYMENT_QR":
      return {
        success: true,
        message: "Si no tienes saldo, confirma la jugada para generar QR de pago.",
        redirectTo: "/player",
      };

    case "GET_OPEN_LOTTERIES": {
      const open = await getOpenLotteries();
      const names = open.filter((l) => l.computedOpen).map((l) => l.name);
      return {
        success: true,
        message: names.length ? `Abiertas: ${names.join(", ")}` : "No hay loterías abiertas ahora.",
        data: open,
      };
    }

    case "GET_DRAW_SCHEDULE": {
      const next = await getNextClosingLottery();
      if (!next) return { success: true, message: "No hay cierres próximos registrados." };
      return {
        success: true,
        message: `Próximo cierre: ${next.name} a las ${next.closeTime}.`,
        data: next,
      };
    }

    case "GET_LOTTERY_RESULT":
      return getLotteryResult(command.entities.lotteries?.[0]);

    case "OPEN_PROFILE":
      return { success: true, message: "Abriendo perfil.", redirectTo: "/player/profile" };

    case "CREATE_SUPPORT_TICKET":
      return {
        success: true,
        message: "Contacta soporte desde tu perfil o WhatsApp del local.",
        redirectTo: "/player/profile",
      };

    case "HELP":
      return {
        success: true,
        message:
          "Comandos: jugar (ej. juega 100 al 23 en nacional), confirma, cancela, balance, tickets, resultados, mi qr, recargar.",
      };

    default:
      return {
        success: false,
        message:
          "No entendí ese comando. Puedes decir: jugar, balance, tickets, recargar o resultados.",
      };
  }
}
