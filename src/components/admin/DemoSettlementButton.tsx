"use client";

import { useTransition } from "react";
import { runDemoResultsSettlement } from "@/actions/admin";
import { Button } from "@/components/ui";

export function DemoSettlementButton() {
  const [isPending, startTransition] = useTransition();

  const handleRun = () => {
    startTransition(async () => {
      const result = await runDemoResultsSettlement();
      if (result.success) {
        alert(`Verificados: ${result.verified}, Premios liquidados: ${result.settled}`);
        window.location.reload();
      }
    });
  };

  return (
    <Button onClick={handleRun} disabled={isPending} variant="success" size="sm">
      {isPending ? "Procesando..." : "Verificar resultados demo"}
    </Button>
  );
}
