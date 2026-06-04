"use client";

import { useState, useTransition } from "react";
import { createRechargeQr, printRechargeQr } from "@/actions/cashier";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { QrDisplay } from "@/components/shared/QrDisplay";
import { formatCurrency } from "@/lib/utils";

export default function CashierRechargePage() {
  const [amount, setAmount] = useState("");
  const [createdCode, setCreatedCode] = useState<{
    id: string;
    code: string;
    token: string;
    amount: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError("Monto inválido");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await createRechargeQr(num);
      if (result.success && result.code) {
        setCreatedCode({
          id: result.code.id,
          code: result.code.code,
          token: result.code.token,
          amount: Number(result.code.amount),
        });
      } else {
        setError(result.error ?? "Error al crear QR");
      }
    });
  };

  const handlePrint = () => {
    if (!createdCode) return;
    startTransition(async () => {
      await printRechargeQr(createdCode.id);
      window.print();
    });
  };

  const quickAmounts = [100, 200, 500, 1000, 2000];

  return (
    <div>
      <PageHeader title="Generar Recarga" />

      <Card className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="500"
          min={1}
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {quickAmounts.map((a) => (
            <Button key={a} variant="secondary" size="sm" onClick={() => setAmount(String(a))}>
              ${a}
            </Button>
          ))}
        </div>
        <Button onClick={handleCreate} disabled={isPending} className="w-full mt-4" size="lg">
          {isPending ? "Generando..." : "Generar QR de recarga"}
        </Button>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </Card>

      {createdCode && (
        <Card className="text-center">
          <p className="font-bold text-lg mb-1">{createdCode.code}</p>
          <p className="text-3xl font-bold text-green-600 mb-4">
            {formatCurrency(createdCode.amount)}
          </p>
          <QrDisplay value={createdCode.token} label="QR de recarga" size={200} />
          <Button onClick={handlePrint} variant="secondary" className="mt-4 w-full">
            Imprimir QR
          </Button>
        </Card>
      )}
    </div>
  );
}
