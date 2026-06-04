import type { VoiceIntent } from "./voice-types";

export const PLAY_VERBS =
  /\b(juega|jugar|ponme|tirame|tírame|dame|meteme|méteme|mete|echame|échame|pon)\b/;

export const CONFIRM_PATTERNS =
  /^(si|sí|confirma|confirmar|dale|procesa|ejecuta|esta bien|está bien|ta bien|correcto|ok|okay|listo)$/;

export const CANCEL_PATTERNS =
  /^(no|cancela|cancelar|borra|borralo|bórralo|olvidalo|olvídalo|no la juegues|quita eso)$/;

export const BALANCE_PATTERNS =
  /\b(balance|saldo|cuanto tengo|cuánto tengo|cuanto balance|cuánto balance|dinero disponible)\b/;

export const TICKET_PATTERNS =
  /\b(tickets|mis tickets|ultimo ticket|último ticket|ticket ganador|ver ticket|ver mis tickets|muestrame mis tickets|muéstrame mis tickets)\b/;

export const WINNING_PATTERNS =
  /\b(gan[oó]|premios|tengo premios|ticket ganador|tickets ganadores|ganadores)\b/;

export const RESULT_PATTERNS =
  /\b(resultado|que salio|qué salió|salio|salió|numero ganador|número ganador)\b/;

export const QR_PATTERNS =
  /\b(qr|codigo|código|muestra mi qr|mostrar qr|escanear qr|crear qr|qr para cajero)\b/;

export const RECHARGE_PATTERNS = /\b(recargar|recarga|quiero recargar|abrir recarga)\b/;

export const REPEAT_PATTERNS = /\b(repite|repetir|ultima jugada|última jugada)\b/;

export const HELP_PATTERNS = /\b(ayuda|help|que puedo decir|qué puedo decir|comandos)\b/;

export const OPEN_LOTTERIES_PATTERNS =
  /\b(loterias abiertas|loterías abiertas|cuales estan abiertas|cuáles están abiertas|abiertas)\b/;

export const SCHEDULE_PATTERNS = /\b(horario|horarios|cierre|proximo cierre|próximo cierre)\b/;

export const PROFILE_PATTERNS = /\b(perfil|mi perfil|cuenta|mi cuenta)\b/;

export const SUPPORT_PATTERNS = /\b(soporte|ayuda tecnica|ayuda técnica|reportar problema)\b/;

export const MODIFY_PATTERNS =
  /\b(cambia|cambiar|ponlo en|quita|agrega|agregar|dejalo en|déjalo en)\b/;

export const PALE_PATTERNS = /\b(pale|palé)\b/;
export const TRIPLETA_PATTERNS = /\b(tripleta|triple)\b/;

export const LOTTERY_ALIAS_MAP: Record<string, string> = {
  nacional: "Nacional",
  "la nacional": "Nacional",
  nasionar: "Nacional",
  dominicana: "Nacional",
  primera: "La Primera Día",
  "la primera": "La Primera Día",
  "primera dia": "La Primera Día",
  "primera día": "La Primera Día",
  "primera noche": "La Primera Noche",
  loteka: "Loteka",
  "la loteka": "Loteka",
  leidsa: "Leidsa",
  real: "Quiniela Real",
  "quiniela real": "Quiniela Real",
  florida: "Florida PM",
  "florida pm": "Florida PM",
  "new york": "New York PM",
  "new york pm": "New York PM",
  "nueva york": "New York PM",
  anguila: "Anguila Noche",
  "anguila noche": "Anguila Noche",
};

export const BACKEND_ACTIONS: Record<VoiceIntent, string> = {
  CREATE_PLAY: "CREATE_PLAY_DRAFT",
  MODIFY_DRAFT_PLAY: "MODIFY_CURRENT_DRAFT",
  CONFIRM_PLAY: "CONFIRM_CURRENT_DRAFT",
  CANCEL_CURRENT_DRAFT: "CANCEL_CURRENT_DRAFT",
  REPEAT_LAST_PLAY: "REPEAT_LAST_PLAY",
  GET_BALANCE: "GET_PLAYER_BALANCE",
  LIST_TICKETS: "GET_PLAYER_TICKETS",
  CHECK_TICKET: "GET_TICKET_DETAIL",
  CHECK_WINNING_TICKETS: "CHECK_WINNING_TICKETS",
  GET_PRIZES: "GET_PLAYER_PRIZES",
  OPEN_RECHARGE: "OPEN_RECHARGE_FLOW",
  SCAN_RECHARGE_QR: "SCAN_RECHARGE_QR",
  SHOW_PLAYER_QR: "GET_PLAYER_QR",
  CREATE_PENDING_PAYMENT_QR: "CREATE_PENDING_PAYMENT_QR",
  GET_OPEN_LOTTERIES: "GET_OPEN_LOTTERIES",
  GET_DRAW_SCHEDULE: "GET_DRAW_SCHEDULE",
  GET_LOTTERY_RESULT: "GET_LOTTERY_RESULT",
  OPEN_PROFILE: "OPEN_PLAYER_PROFILE",
  CREATE_SUPPORT_TICKET: "CREATE_SUPPORT_TICKET",
  HELP: "SHOW_VOICE_HELP",
  UNKNOWN: "NONE",
};

export const CONFIDENCE_THRESHOLD = 0.75;
