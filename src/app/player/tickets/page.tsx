import { getTickets } from "@/actions/player";
import { Card, Badge, PageHeader, EmptyState } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function PlayerTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const tickets = await getTickets(params.status);

  const filters = [
    { label: "Todos", value: "ALL" },
    { label: "Activos", value: "ACTIVE" },
    { label: "Ganadores", value: "WON" },
    { label: "Perdidos", value: "LOST" },
  ];

  return (
    <div>
      <PageHeader title="Mis Tickets" subtitle={`${tickets.length} tickets`} />

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={`/player/tickets?status=${f.value}`}
            className={`px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap ${
              (params.status ?? "ALL") === f.value
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {tickets.length === 0 ? (
        <EmptyState message="No tienes tickets aún" />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/player/tickets/${ticket.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{ticket.ticketNumber}</p>
                    <p className="text-sm text-gray-500">
                      {ticket.items.map((i) => `${i.number1} ${i.lottery.name}`).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        ticket.status === "WON"
                          ? "success"
                          : ticket.status === "LOST"
                            ? "danger"
                            : "info"
                      }
                    >
                      {ticket.status}
                    </Badge>
                    <p className="font-bold mt-1">{formatCurrency(Number(ticket.totalAmount))}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
