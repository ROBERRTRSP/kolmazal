import { getTicketDetail } from "@/actions/player";
import { Card, Badge, PageHeader } from "@/components/ui";
import { QrDisplay } from "@/components/shared/QrDisplay";
import { formatCurrency } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getTicketDetail(id);
  if (!ticket) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div>
      <PageHeader title="Detalle del Ticket" />

      <Card className="mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-500">Número</p>
            <p className="font-bold text-lg">{ticket.ticketNumber}</p>
          </div>
          <Badge
            variant={
              ticket.status === "WON" ? "success" : ticket.status === "LOST" ? "danger" : "info"
            }
          >
            {ticket.status}
          </Badge>
        </div>
        <p className="text-sm text-gray-500">
          Código: <span className="font-mono font-bold">{ticket.verificationCode}</span>
        </p>
        <p className="text-2xl font-bold text-blue-600 mt-2">
          {formatCurrency(Number(ticket.totalAmount))}
        </p>
      </Card>

      <div className="space-y-3 mb-6">
        {ticket.items.map((item) => (
          <Card key={item.id}>
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{item.lottery.name}</p>
                <p className="text-sm text-gray-500">
                  {item.playType}: {item.number1}
                  {item.number2 ? `-${item.number2}` : ""}
                  {item.number3 ? `-${item.number3}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatCurrency(Number(item.amount))}</p>
                <p className="text-xs text-green-600">
                  Premio: {formatCurrency(Number(item.possibleWin))}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <QrDisplay value={`${appUrl}/verify/${ticket.qrToken}`} label="QR del ticket" />
    </div>
  );
}
