import { getCashiers } from "@/actions/admin";
import { PageHeader, Badge } from "@/components/ui";
import { formatPhone } from "@/lib/utils";

export default async function AdminCashiersPage() {
  const cashiers = await getCashiers();

  return (
    <div>
      <PageHeader title="Cajeros" subtitle={`${cashiers.length} registrados`} />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">Teléfono</th>
              <th className="text-left p-4 font-medium text-gray-600">Estación</th>
              <th className="text-left p-4 font-medium text-gray-600">Turno</th>
              <th className="text-left p-4 font-medium text-gray-600">Estado</th>
            </tr>
          </thead>
          <tbody>
            {cashiers.map((c) => (
              <tr key={c.id} className="border-t border-gray-50">
                <td className="p-4 font-medium">{formatPhone(c.phone)}</td>
                <td className="p-4">{c.cashierProfile?.stationId ?? "—"}</td>
                <td className="p-4">
                  {c.cashierShifts[0] ? (
                    <Badge variant="success">Abierto</Badge>
                  ) : (
                    <Badge variant="default">Cerrado</Badge>
                  )}
                </td>
                <td className="p-4">
                  <Badge variant={c.isActive ? "success" : "danger"}>
                    {c.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
