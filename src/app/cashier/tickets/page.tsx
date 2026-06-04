import { getCashierTickets } from "@/actions/cashier";
import { Card, PageHeader, EmptyState, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

export default async function CashierTicketsPage() {
  const orders = await getCashierTickets();

  return (
    <div>
      <PageHeader title="Tickets Ejecutados" />

      {orders.length === 0 ? (
        <EmptyState message="No has ejecutado tickets en este turno" />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{order.ticket?.ticketNumber ?? order.orderNumber}</p>
                  <p className="text-sm text-gray-500">{order.player.phone}</p>
                  <p className="text-xs text-gray-400">
                    {order.executedAt && new Date(order.executedAt).toLocaleString("es-DO")}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="success">EJECUTADO</Badge>
                  <p className="font-bold mt-1">{formatCurrency(Number(order.totalAmount))}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
