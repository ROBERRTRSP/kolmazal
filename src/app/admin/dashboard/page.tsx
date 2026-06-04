import { getAdminDashboard } from "@/actions/admin";
import { Card, StatCard, PageHeader, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { DemoSettlementButton } from "@/components/admin/DemoSettlementButton";
import {
  DollarSign,
  Ticket,
  Wallet,
  Trophy,
  Users,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboard();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Resumen del día"
        action={<DemoSettlementButton />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Ventas hoy"
          value={formatCurrency(data.salesToday)}
          icon={<DollarSign size={20} />}
        />
        <StatCard
          label="Tickets vendidos"
          value={data.ticketsSold}
          icon={<Ticket size={20} />}
          color="blue"
        />
        <StatCard
          label="Recargas"
          value={formatCurrency(data.rechargesToday)}
          icon={<Wallet size={20} />}
          color="green"
        />
        <StatCard
          label="Premios pagados"
          value={formatCurrency(data.prizesPaid)}
          icon={<Trophy size={20} />}
          color="yellow"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Jugadores activos" value={data.activePlayers} icon={<Users size={20} />} />
        <StatCard label="Cajeros activos" value={data.activeCashiers} icon={<UserCheck size={20} />} />
        <StatCard
          label="Órdenes pendientes"
          value={data.pendingOrders}
          icon={<AlertTriangle size={20} />}
          color="red"
        />
      </div>

      {data.alerts > 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle size={20} />
            <p className="font-medium">{data.alerts} resultado(s) en disputa</p>
          </div>
        </Card>
      )}

      <h3 className="font-semibold mb-4">Resultados recientes</h3>
      <div className="space-y-3">
        {data.recentResults.map((r) => (
          <Card key={r.id}>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{r.lottery.name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(r.drawDate).toLocaleDateString("es-DO")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold">
                  {r.number1}-{r.number2}-{r.number3}
                </span>
                <Badge variant={r.status === "VERIFIED" ? "success" : "warning"}>
                  {r.status}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
