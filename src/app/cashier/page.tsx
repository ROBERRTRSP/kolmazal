import { getCashierDashboard } from "@/actions/cashier";
import { Card, StatCard, PageHeader, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Scan, Wallet, DollarSign, Ticket } from "lucide-react";

export default async function CashierHomePage() {
  const { shift, pendingOrders } = await getCashierDashboard();

  return (
    <div>
      <PageHeader title="Panel Cajero" subtitle="Turno activo" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Ventas del turno"
          value={formatCurrency(Number(shift.totalSales))}
          icon={<DollarSign size={20} />}
          color="blue"
        />
        <StatCard
          label="Recargas"
          value={formatCurrency(Number(shift.totalRecharges))}
          icon={<Wallet size={20} />}
          color="green"
        />
        <StatCard
          label="Tickets ejecutados"
          value={shift.ordersExecuted}
          icon={<Ticket size={20} />}
          color="yellow"
        />
        <StatCard
          label="Órdenes pendientes"
          value={pendingOrders.length}
          icon={<Scan size={20} />}
          color="red"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Link href="/cashier/scan">
          <Card className="text-center py-12 hover:shadow-lg transition-shadow cursor-pointer border-blue-200 bg-blue-50/50">
            <Scan size={48} className="mx-auto text-blue-600 mb-3" />
            <h3 className="text-xl font-bold text-blue-600">Escanear QR</h3>
            <p className="text-gray-500 text-sm mt-1">Jugador, orden o recarga</p>
          </Card>
        </Link>

        <Link href="/cashier/recharge">
          <Card className="text-center py-12 hover:shadow-lg transition-shadow cursor-pointer">
            <Wallet size={48} className="mx-auto text-green-600 mb-3" />
            <h3 className="text-xl font-bold">Generar Recarga</h3>
            <p className="text-gray-500 text-sm mt-1">Crear QR de recarga</p>
          </Card>
        </Link>
      </div>

      <div className="mt-8">
        <h3 className="font-semibold mb-4">Órdenes pendientes recientes</h3>
        {pendingOrders.length === 0 ? (
          <Card className="text-center text-gray-400 py-8">Sin órdenes pendientes</Card>
        ) : (
          <div className="space-y-3">
            {pendingOrders.slice(0, 5).map((order) => (
              <Card key={order.id}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{order.player.phone}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="warning">PENDIENTE</Badge>
                    <p className="font-bold mt-1">{formatCurrency(Number(order.totalAmount))}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
