import { getAdminPrizes } from "@/actions/admin";
import { PageHeader, EmptyState } from "@/components/ui";
import { formatCurrency, formatPhone } from "@/lib/utils";

export default async function AdminPrizesPage() {
  const prizes = await getAdminPrizes();

  return (
    <div>
      <PageHeader title="Premios" subtitle="Liquidaciones realizadas" />

      {prizes.length === 0 ? (
        <EmptyState message="No hay premios liquidados" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-600">Ticket</th>
                <th className="text-left p-4 font-medium text-gray-600">Jugador</th>
                <th className="text-left p-4 font-medium text-gray-600">Lotería</th>
                <th className="text-left p-4 font-medium text-gray-600">Premio</th>
                <th className="text-left p-4 font-medium text-gray-600">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {prizes.map((p) => (
                <tr key={p.id} className="border-t border-gray-50">
                  <td className="p-4 font-mono text-xs">{p.ticket.ticketNumber}</td>
                  <td className="p-4">{formatPhone(p.ticket.player.phone)}</td>
                  <td className="p-4">{p.result.lottery.name}</td>
                  <td className="p-4 font-bold text-green-600">
                    {formatCurrency(Number(p.amount))}
                  </td>
                  <td className="p-4 text-gray-500">
                    {new Date(p.settledAt).toLocaleString("es-DO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
