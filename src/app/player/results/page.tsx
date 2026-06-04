import { getResults } from "@/actions/player";
import { Card, PageHeader, EmptyState, Badge } from "@/components/ui";

export default async function PlayerResultsPage() {
  const results = await getResults();

  return (
    <div>
      <PageHeader title="Resultados" subtitle="Últimos sorteos" />

      {results.length === 0 ? (
        <EmptyState message="No hay resultados disponibles" />
      ) : (
        <div className="space-y-3">
          {results.map((r) => (
            <Card key={r.id}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{r.lottery.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(r.drawDate).toLocaleDateString("es-DO")}
                  </p>
                </div>
                <Badge variant={r.status === "VERIFIED" ? "success" : "warning"}>
                  {r.status}
                </Badge>
              </div>
              <div className="flex gap-3 mt-3">
                <span className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  {r.number1}
                </span>
                {r.number2 && (
                  <span className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
                    {r.number2}
                  </span>
                )}
                {r.number3 && (
                  <span className="w-12 h-12 rounded-2xl bg-blue-400 text-white flex items-center justify-center font-bold text-lg">
                    {r.number3}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
