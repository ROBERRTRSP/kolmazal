import { getPlayerDashboard } from "@/actions/player";
import { Card, Badge } from "@/components/ui";
import { PlayPanel } from "@/components/player/PlayPanel";
import { RepeatLastPlayButton } from "@/components/player/RepeatLastPlayButton";
import { QuickActions } from "@/components/player/PlayerLayout";
import { Clock, Trophy, Ticket } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default async function PlayerHomePage() {
  const data = await getPlayerDashboard();

  return (
    <div className="space-y-6">
      <Card className="text-center bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
        <p className="text-blue-100 text-sm">Tu balance</p>
        <p className="text-4xl font-bold mt-1">{formatCurrency(data.balance)}</p>
        {data.accumulatedPrizes > 0 && (
          <p className="text-blue-100 text-sm mt-2 flex items-center justify-center gap-1">
            <Trophy size={14} /> Premios: {formatCurrency(data.accumulatedPrizes)}
          </p>
        )}
      </Card>

      {data.nextClose && (
        <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
          <Clock size={16} />
          <span>
            Próximo cierre: <strong>{data.nextClose.name}</strong> a las{" "}
            {data.nextClose.closeTime}
          </span>
        </div>
      )}

      <PlayPanel />

      <RepeatLastPlayButton />

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Acciones rápidas</h2>
        <QuickActions />
      </div>

      {data.lastTicket && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Ticket size={18} className="text-blue-600" /> Último ticket
            </h3>
            <Badge
              variant={
                data.lastTicket.status === "WON"
                  ? "success"
                  : data.lastTicket.status === "LOST"
                    ? "danger"
                    : "info"
              }
            >
              {data.lastTicket.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{data.lastTicket.ticketNumber}</p>
          <p className="font-bold text-lg mt-1">
            {formatCurrency(Number(data.lastTicket.totalAmount))}
          </p>
          <Link
            href={`/player/tickets?id=${data.lastTicket.id}`}
            className="text-blue-600 text-sm mt-2 inline-block"
          >
            Ver detalle →
          </Link>
        </Card>
      )}
    </div>
  );
}
