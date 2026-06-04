"use client";

import { useState, useTransition, useEffect } from "react";
import { closeShift, getCashierActivity } from "@/actions/cashier";
import { Button, Card, PageHeader, StatCard } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Wallet, Trophy } from "lucide-react";

export default function CashierShiftPage() {
  const [activity, setActivity] = useState<Awaited<ReturnType<typeof getCashierActivity>> | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getCashierActivity().then(setActivity);
  }, []);

  const handleClose = () => {
    startTransition(async () => {
      const result = await closeShift();
      if (result.success) {
        setMessage("Turno cerrado exitosamente");
        getCashierActivity().then(setActivity);
      }
    });
  };

  if (!activity) return <div className="text-center py-8 text-gray-400">Cargando...</div>;

  const { shift } = activity;

  return (
    <div>
      <PageHeader title="Turno Actual" />

      {message && (
        <div className="p-4 rounded-2xl bg-green-50 text-green-700 mb-4">{message}</div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Ventas"
          value={formatCurrency(Number(shift?.totalSales ?? 0))}
          icon={<DollarSign size={20} />}
        />
        <StatCard
          label="Recargas"
          value={formatCurrency(Number(shift?.totalRecharges ?? 0))}
          icon={<Wallet size={20} />}
          color="green"
        />
        <StatCard
          label="Premios pagados"
          value={formatCurrency(Number(shift?.totalPrizesPaid ?? 0))}
          icon={<Trophy size={20} />}
          color="yellow"
        />
      </div>

      <Card className="mb-6">
        <p className="text-sm text-gray-500">Estado del turno</p>
        <p className="font-bold text-lg">{shift?.status ?? "Sin turno"}</p>
        {shift?.openedAt && (
          <p className="text-sm text-gray-400 mt-1">
            Abierto: {new Date(shift.openedAt).toLocaleString("es-DO")}
          </p>
        )}
      </Card>

      {shift?.status === "OPEN" && (
        <Button variant="danger" size="lg" onClick={handleClose} disabled={isPending} className="w-full">
          {isPending ? "Cerrando..." : "Cerrar turno"}
        </Button>
      )}
    </div>
  );
}
