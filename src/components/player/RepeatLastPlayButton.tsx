"use client";

import { useTransition } from "react";
import { repeatLastPlay } from "@/actions/player";
import { Button } from "@/components/ui";
import { RotateCcw } from "lucide-react";

export function RepeatLastPlayButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      className="w-full"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await repeatLastPlay();
          window.location.reload();
        });
      }}
    >
      <RotateCcw size={16} className="mr-2" />
      {isPending ? "Cargando..." : "Repetir última jugada"}
    </Button>
  );
}
