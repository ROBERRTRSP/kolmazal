import { getPlayers } from "@/actions/admin";
import { PageHeader, Badge } from "@/components/ui";
import { formatCurrency, formatPhone } from "@/lib/utils";

export default async function AdminPlayersPage() {
  const players = await getPlayers();

  return (
    <div>
      <PageHeader title="Jugadores" subtitle={`${players.length} registrados`} />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">Teléfono</th>
              <th className="text-left p-4 font-medium text-gray-600">Balance</th>
              <th className="text-left p-4 font-medium text-gray-600">Estado</th>
              <th className="text-left p-4 font-medium text-gray-600">Registro</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="border-t border-gray-50">
                <td className="p-4 font-medium">{formatPhone(p.phone)}</td>
                <td className="p-4">{formatCurrency(Number(p.playerProfile?.balance ?? 0))}</td>
                <td className="p-4">
                  <Badge variant={p.isActive ? "success" : "danger"}>
                    {p.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="p-4 text-gray-500">
                  {new Date(p.createdAt).toLocaleDateString("es-DO")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
