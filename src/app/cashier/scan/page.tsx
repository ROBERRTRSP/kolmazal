"use client";

import { useState, useTransition } from "react";
import { scanQr, executePendingOrder } from "@/actions/cashier";
import { Button, Card, Input, PageHeader, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Scan } from "lucide-react";

export default function CashierScanPage() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof scanQr>> | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleScan = () => {
    if (!token.trim()) return;
    setError("");
    setMessage("");
    startTransition(async () => {
      const res = await scanQr(token.trim());
      setResult(res);
      if (res.type === "UNKNOWN") setError(res.error ?? "QR no reconocido");
    });
  };

  const handleExecute = (orderId: string) => {
    startTransition(async () => {
      const res = await executePendingOrder(orderId);
      if (res.success) {
        setMessage(`Ticket ${res.ticket?.ticketNumber} creado exitosamente`);
        setResult(null);
        setToken("");
      } else {
        setError(res.error ?? "Error al ejecutar");
      }
    });
  };

  return (
    <div>
      <PageHeader title="Escanear QR" />

      <Card className="mb-6">
        <div className="flex gap-3">
          <Input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Token del QR"
            className="flex-1"
          />
          <Button onClick={handleScan} disabled={isPending}>
            <Scan size={18} className="mr-1" /> Escanear
          </Button>
        </div>
      </Card>

      {message && <div className="p-4 rounded-2xl bg-green-50 text-green-700 mb-4">{message}</div>}
      {error && <div className="p-4 rounded-2xl bg-red-50 text-red-700 mb-4">{error}</div>}

      {result?.type === "PLAYER" && result.data && (
        <Card>
          <Badge variant="info">JUGADOR</Badge>
          <p className="font-bold text-lg mt-2">{result.data.phone}</p>
          <p className="text-gray-600">Balance: {formatCurrency(result.data.balance)}</p>
        </Card>
      )}

      {result?.type === "PENDING_ORDER" && result.data && (
        <Card>
          <Badge variant="warning">ORDEN PENDIENTE</Badge>
          <p className="font-bold text-lg mt-2">{result.data.orderNumber}</p>
          <p className="text-gray-600">Jugador: {result.data.player.phone}</p>
          <p className="text-2xl font-bold text-blue-600 my-3">
            {formatCurrency(Number(result.data.totalAmount))}
          </p>
          <div className="space-y-2 mb-4">
            {result.data.items.map((item) => (
              <div key={item.id} className="text-sm flex justify-between">
                <span>
                  {item.playType} {item.number1} - {item.lottery.name}
                </span>
                <span>{formatCurrency(Number(item.amount))}</span>
              </div>
            ))}
          </div>
          <Button
            variant="success"
            size="lg"
            className="w-full"
            onClick={() => handleExecute(result.data!.id)}
            disabled={isPending}
          >
            Cobrar y ejecutar
          </Button>
        </Card>
      )}

      {result?.type === "RECHARGE" && result.data && (
        <Card>
          <Badge variant="success">RECARGA</Badge>
          <p className="font-bold text-lg mt-2">{result.data.code}</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(Number(result.data.amount))}
          </p>
          <Badge variant={result.data.status === "PENDING" ? "warning" : "default"}>
            {result.data.status}
          </Badge>
        </Card>
      )}
    </div>
  );
}
