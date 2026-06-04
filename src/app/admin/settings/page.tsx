import { getLotteriesAdmin, getSystemSettings } from "@/actions/admin";
import { Card, PageHeader } from "@/components/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const [lotteries, settings] = await Promise.all([getLotteriesAdmin(), getSystemSettings()]);

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <div>
      <PageHeader title="Configuración" />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4">Límites y pagos</h3>
          <SettingsForm
            defaults={{
              minBetAmount: settingsMap.MIN_BET_AMOUNT ?? "5",
              maxBetAmount: settingsMap.MAX_BET_AMOUNT ?? "5000",
              oddsQuiniela: settingsMap.ODDS_QUINIELA ?? "70",
              oddsPale: settingsMap.ODDS_PALE ?? "1000",
              oddsTripleta: settingsMap.ODDS_TRIPLETA ?? "20000",
            }}
          />
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Horarios de loterías</h3>
          <div className="space-y-3">
            {lotteries.map((l) => (
              <div key={l.id} className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="font-medium text-sm">{l.name}</span>
                <div className="text-sm text-gray-500">
                  Cierre: {l.closeTime} | Sorteo: {l.drawTime}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
