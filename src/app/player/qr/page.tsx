import { getPlayerQr } from "@/actions/player";
import { PageHeader } from "@/components/ui";
import { QrDisplay } from "@/components/shared/QrDisplay";
import { formatPhone } from "@/lib/utils";

export default async function PlayerQrPage() {
  const qr = await getPlayerQr();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div>
      <PageHeader title="Mi QR" subtitle="Muestra este código al cajero" />

      <div className="flex flex-col items-center">
        <QrDisplay
          value={`${appUrl}/scan/player/${qr.token}`}
          label={formatPhone(qr.phone ?? "")}
          size={220}
        />
        <p className="text-sm text-gray-500 mt-4 text-center max-w-xs">
          El cajero puede escanear este QR para identificarte y procesar recargas o jugadas
          pendientes.
        </p>
      </div>
    </div>
  );
}
