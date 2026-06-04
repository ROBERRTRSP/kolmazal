import { getPendingOrders } from "@/actions/cashier";
import { Card, PageHeader, Badge, EmptyState } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function CashierOrdersPage() {
  const orders = await getPendingOrders();

  return (
    <div>
      <PageHeader title="Órdenes Pendientes" subtitle={`${orders.length} activas`} />

      {orders.length === 0 ? (
        <EmptyState message="No hay órdenes pendientes" />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">{order.player.phone}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Expira: {new Date(order.expiresAt).toLocaleString("es-DO")}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="warning">PENDIENTE</Badge>
                  <p className="font-bold text-lg mt-1">
                    {formatCurrency(Number(order.totalAmount))}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                {order.items.map((item) => (
                  <p key={item.id} className="text-sm text-gray-600">
                    {item.playType} {item.number1} - {item.lottery.name} (
                    {formatCurrency(Number(item.amount))})
                  </p>
                ))}
              </div>
              <Link
                href={`/cashier/scan?token=${order.paymentToken}`}
                className="text-blue-600 text-sm mt-3 inline-block"
              >
                Procesar →
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
