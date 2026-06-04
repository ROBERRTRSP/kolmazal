import { getAuditLogs } from "@/actions/admin";
import { PageHeader, Badge } from "@/components/ui";
import { formatPhone } from "@/lib/utils";

export default async function AdminAuditPage() {
  const logs = await getAuditLogs();

  return (
    <div>
      <PageHeader title="Auditoría" subtitle={`${logs.length} eventos recientes`} />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">Fecha</th>
              <th className="text-left p-4 font-medium text-gray-600">Actor</th>
              <th className="text-left p-4 font-medium text-gray-600">Acción</th>
              <th className="text-left p-4 font-medium text-gray-600">Entidad</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-gray-50">
                <td className="p-4 text-gray-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString("es-DO")}
                </td>
                <td className="p-4">
                  {log.actor ? formatPhone(log.actor.phone) : "—"}
                  {log.actorRole && (
                    <Badge variant="default" className="ml-2">
                      {log.actorRole}
                    </Badge>
                  )}
                </td>
                <td className="p-4 font-medium">{log.action}</td>
                <td className="p-4 text-gray-500">
                  {log.entityType} {log.entityId?.slice(0, 8)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
