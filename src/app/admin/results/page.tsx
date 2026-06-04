import { getAdminResults } from "@/actions/admin";
import { PageHeader, Badge } from "@/components/ui";

export default async function AdminResultsPage() {
  const results = await getAdminResults();

  return (
    <div>
      <PageHeader title="Resultados" subtitle="Automáticos y verificados" />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">Lotería</th>
              <th className="text-left p-4 font-medium text-gray-600">Fecha</th>
              <th className="text-left p-4 font-medium text-gray-600">Números</th>
              <th className="text-left p-4 font-medium text-gray-600">Estado</th>
              <th className="text-left p-4 font-medium text-gray-600">Fuente</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id} className="border-t border-gray-50">
                <td className="p-4 font-medium">{r.lottery.name}</td>
                <td className="p-4">{new Date(r.drawDate).toLocaleDateString("es-DO")}</td>
                <td className="p-4 font-mono font-bold">
                  {r.number1}-{r.number2}-{r.number3}
                </td>
                <td className="p-4">
                  <Badge
                    variant={
                      r.status === "VERIFIED" || r.status === "SETTLED"
                        ? "success"
                        : r.status === "DISPUTED"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {r.status}
                  </Badge>
                </td>
                <td className="p-4 text-gray-500">{r.source?.name ?? "Demo"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
