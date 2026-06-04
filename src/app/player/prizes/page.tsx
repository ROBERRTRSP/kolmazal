import { getPrizes } from "@/actions/player";
import { Card, PageHeader, EmptyState, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function PlayerPrizesPage() {
  const prizes = await getPrizes();

  return (
    <div>
      <PageHeader title="Mis Premios" />

      {prizes.length === 0 ? (
        <EmptyState message="Aún no tienes premios" />
      ) : (
        <div className="space-y-3">
          {prizes.map((ticket) => {
            const winAmount = ticket.items.reduce(
              (sum, i) => sum + Number(i.winAmount ?? 0),
              0
            );
            return (
              <Link key={ticket.id} href={`/player/tickets/${ticket.id}`}>
                <Card className="border-green-200 bg-green-50/30">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold text-green-800">{ticket.ticketNumber}</p>
                      <p className="text-sm text-gray-600">
                        {ticket.items.map((i) => i.lottery.name).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="success">GANADOR</Badge>
                      <p className="font-bold text-green-700 text-lg mt-1">
                        {formatCurrency(winAmount)}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
