"use client";

import { useState, useTransition } from "react";
import { claimRechargeQr } from "@/actions/player";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { QrDisplay } from "@/components/shared/QrDisplay";
import { Scan } from "lucide-react";

export default function PlayerRechargePage() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleClaim = () => {
    if (!token.trim()) return;
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await claimRechargeQr(token.trim());
      if (result.success) {
        setMessage(`¡Recarga exitosa! +$${result.amount}`);
        setToken("");
      } else {
        setError(result.error ?? "Error al reclamar");
      }
    });
  };

  return (
    <div>
      <PageHeader title="Recargar" subtitle="Escanea un QR de recarga del cajero" />

      <Card className="text-center mb-6">
        <Scan size={48} className="mx-auto text-blue-600 mb-3" />
        <p className="text-gray-600 text-sm mb-4">
          Pide al cajero un QR de recarga e ingresa el token o escanea el código
        </p>
        <Input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Pega el token del QR aquí"
          className="mb-3"
        />
        <Button onClick={handleClaim} disabled={isPending} className="w-full">
          {isPending ? "Procesando..." : "Reclamar recarga"}
        </Button>
      </Card>

      {message && (
        <div className="p-4 rounded-2xl bg-green-50 text-green-700 text-center mb-4">{message}</div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-center mb-4">{error}</div>
      )}

      {token && (
        <QrDisplay value={token} label="Vista previa QR" size={150} />
      )}
    </div>
  );
}
