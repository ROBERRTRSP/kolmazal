export type VoiceIntent =
  | "CREATE_PLAY"
  | "MODIFY_DRAFT_PLAY"
  | "CONFIRM_PLAY"
  | "CANCEL_CURRENT_DRAFT"
  | "REPEAT_LAST_PLAY"
  | "GET_BALANCE"
  | "LIST_TICKETS"
  | "CHECK_TICKET"
  | "CHECK_WINNING_TICKETS"
  | "GET_PRIZES"
  | "OPEN_RECHARGE"
  | "SCAN_RECHARGE_QR"
  | "SHOW_PLAYER_QR"
  | "CREATE_PENDING_PAYMENT_QR"
  | "GET_OPEN_LOTTERIES"
  | "GET_DRAW_SCHEDULE"
  | "GET_LOTTERY_RESULT"
  | "OPEN_PROFILE"
  | "CREATE_SUPPORT_TICKET"
  | "HELP"
  | "UNKNOWN";

export type VoicePlayType = "QUINIELA" | "PALE" | "TRIPLETA";

export type LotteryGroup = "ALL" | "DAY" | "NIGHT";

export type VoiceEntities = {
  playType?: VoicePlayType;
  numbers?: string[];
  amount?: number;
  lotteries?: string[];
  lotteryGroup?: LotteryGroup;
  ticketNumber?: string;
  qrAction?: "SCAN" | "SHOW" | "CREATE";
  modification?: {
    field: "amount" | "number" | "lottery" | "remove_lottery" | "add_lottery";
    value: string | number | string[];
  };
};

export type VoiceCommandResult = {
  intent: VoiceIntent;
  confidence: number;
  transcript: string;
  normalizedText: string;
  entities: VoiceEntities;
  missingFields: string[];
  requiresConfirmation: boolean;
  backendAction: string;
  userMessage: string;
};
