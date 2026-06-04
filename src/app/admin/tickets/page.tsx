import { getAdminTickets } from "@/actions/admin";
import { PageHeader, Badge } from "@/components/ui";
import { formatCurrency, formatPhone } from "@/lib/utils";

export default async function AdminTicketsPage() {
  const tickets = await getAdminTickets();

  return (
    <div>
      <PageHeader title="Tickets" subtitle={`${tickets.length} recientes`} />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">Ticket</th>
              <th className="text-left p-4 font-medium text-gray-600">Jugador</th>
              <th className="text-left p-4 font-medium text-gray-600">Monto</th>
              <th className="text-left p-4 font-medium text-gray-600">Estado</th>
              <th className="text-left p-4 font-medium text-gray-600">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-t border-gray-50">
                <td className="p-4 font-mono text-xs">{t.ticketNumber}</td>
                <td className="p-4">{formatPhone(t.player.phone)}</td>
                <td className="p-4 font-medium">{formatCurrency(Number(t.totalAmount))}</td>
                <td className="p-4">
                  <Badge
                    variant={
                      t.status === "WON" ? "success" : t.status === "LOST" ? "danger" : "info"
                    }
                  >
                    {t.status}
                  </Badge>
                </td>
                <td className="p-4 text-gray-500">
                  {new Date(t.createdAt).toLocaleString("es-DO")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
