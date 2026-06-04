import { getReports } from "@/actions/admin";
import { Card, PageHeader, StatCard } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Ticket } from "lucide-react";

export default async function AdminReportsPage() {
  const reports = await getReports();

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Resumen operativo" />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4">Ventas de hoy por estado</h3>
          <div className="space-y-3">
            {reports.dailyTickets.map((t) => (
              <div key={t.status} className="flex justify-between text-sm">
                <span>{t.status}</span>
                <span className="font-medium">
                  {t._count} tickets — {formatCurrency(Number(t._sum.totalAmount ?? 0))}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <StatCard
            label="Ventas semana"
            value={formatCurrency(Number(reports.weeklyTickets._sum.totalAmount ?? 0))}
            icon={<DollarSign size={20} />}
          />
          <StatCard
            label="Tickets semana"
            value={reports.weeklyTickets._count}
            icon={<Ticket size={20} />}
            color="blue"
          />
          <StatCard
            label="Recargas hoy"
            value={formatCurrency(Number(reports.dailyRecharges._sum.amount ?? 0))}
            icon={<DollarSign size={20} />}
            color="green"
          />
        </div>
      </div>
    </div>
  );
}
