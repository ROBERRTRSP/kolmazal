"use client";

import { useState, useTransition } from "react";
import { updateLimits } from "@/actions/admin";
import { Button, Input } from "@/components/ui";

export function SettingsForm({
  defaults,
}: {
  defaults: {
    minBetAmount: string;
    maxBetAmount: string;
    oddsQuiniela: string;
    oddsPale: string;
    oddsTripleta: string;
  };
}) {
  const [form, setForm] = useState(defaults);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await updateLimits({
        minBetAmount: parseInt(form.minBetAmount),
        maxBetAmount: parseInt(form.maxBetAmount),
        oddsQuiniela: parseInt(form.oddsQuiniela),
        oddsPale: parseInt(form.oddsPale),
        oddsTripleta: parseInt(form.oddsTripleta),
      });
      setMessage("Configuración guardada");
    });
  };

  const fields = [
    { key: "minBetAmount", label: "Apuesta mínima" },
    { key: "maxBetAmount", label: "Apuesta máxima" },
    { key: "oddsQuiniela", label: "Pago Quiniela (x)" },
    { key: "oddsPale", label: "Pago Palé (x)" },
    { key: "oddsTripleta", label: "Pago Tripleta (x)" },
  ] as const;

  return (
    <div className="space-y-4">
      {fields.map(({ key, label }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <Input
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            type="number"
          />
        </div>
      ))}
      {message && <p className="text-green-600 text-sm">{message}</p>}
      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}
