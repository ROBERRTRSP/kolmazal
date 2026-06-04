"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Send } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { processVoiceCommand } from "@/actions/voice";
import type { VoiceCommandResult } from "@/lib/voice/voice-types";

type PlayPanelProps = {
  onConfirmed?: () => void;
};

type DraftState = {
  items: Array<{ lottery: string; playType: string; number1: string; amount: number }>;
  totalAmount: number;
  message?: string;
};

export function PlayPanel({ onConfirmed }: PlayPanelProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [voiceReply, setVoiceReply] = useState("");
  const [lastCommand, setLastCommand] = useState<VoiceCommandResult | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleVoiceResult = (result: Awaited<ReturnType<typeof processVoiceCommand>>) => {
    setLastCommand(result.command);
    setVoiceReply(result.message);

    if (result.redirectTo) {
      router.push(result.redirectTo);
      return;
    }

    if (result.needsMoreInfo) {
      setDraft(null);
      return;
    }

    if (result.data && "items" in (result.data as object)) {
      const data = result.data as {
        items: DraftState["items"];
        totalAmount: number;
      };
      setDraft({
        items: data.items,
        totalAmount: data.totalAmount,
        message: result.message,
      });
      return;
    }

    if (result.requiresConfirmation && result.data) {
      const data = result.data as {
        items?: DraftState["items"];
        totalAmount?: number;
      };
      if (data.items) {
        setDraft({
          items: data.items,
          totalAmount: data.totalAmount ?? 0,
          message: result.message,
        });
      }
      return;
    }

    if (result.success && !result.requiresConfirmation) {
      setDraft(null);
      onConfirmed?.();
      router.refresh();
    }
  };

  const handleSubmit = (input: string) => {
    if (!input.trim()) return;
    setError("");
    setVoiceReply("");
    startTransition(async () => {
      try {
        const result = await processVoiceCommand(input);
        if (!result.success && !result.needsMoreInfo) {
          setError(result.message);
          setDraft(null);
          return;
        }
        handleVoiceResult(result);
      } catch {
        setError("Error al procesar el comando");
      }
    });
  };

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await processVoiceCommand("confirma");
      if (!result.success) {
        setError(result.message);
        return;
      }
      setDraft(null);
      setText("");
      setVoiceReply(result.message);
      onConfirmed?.();
      router.refresh();
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      const result = await processVoiceCommand("cancela");
      setDraft(null);
      setText("");
      setVoiceReply(result.message);
    });
  };

  const startVoice = () => {
    const win = window as typeof window & {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onstart: (() => void) | null;
        onend: (() => void) | null;
        onerror: (() => void) | null;
        onresult: ((event: {
          results: { [index: number]: { [index: number]: { transcript: string } } };
        }) => void) | null;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onstart: (() => void) | null;
        onend: (() => void) | null;
        onerror: (() => void) | null;
        onresult: ((event: {
          results: { [index: number]: { [index: number]: { transcript: string } } };
        }) => void) | null;
        start: () => void;
      };
    };

    const SpeechRecognitionCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setError("Tu navegador no soporta reconocimiento de voz");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "es-DO";
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setError("Error de micrófono");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
      handleSubmit(transcript);
    };

    recognition.start();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <button
          onClick={startVoice}
          disabled={isPending}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
            listening
              ? "bg-red-500 animate-pulse text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {listening ? <MicOff size={36} /> : <Mic size={36} />}
        </button>
      </div>
      <p className="text-center text-sm text-gray-500">
        {listening ? "Escuchando..." : "ChatVoz — habla o escribe tu comando"}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(text);
        }}
        className="flex gap-2"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Ej: "Juega 100 al 23 en Nacional"'
        />
        <Button type="submit" disabled={isPending}>
          <Send size={18} />
        </Button>
      </form>

      {voiceReply && !error && (
        <div className="p-3 rounded-2xl bg-blue-50 text-blue-800 text-sm">{voiceReply}</div>
      )}

      {lastCommand && process.env.NODE_ENV === "development" && (
        <details className="text-xs text-gray-400">
          <summary className="cursor-pointer">Debug ChatVoz</summary>
          <pre className="mt-1 overflow-auto">{JSON.stringify(lastCommand, null, 2)}</pre>
        </details>
      )}

      {error && (
        <div className="p-3 rounded-2xl bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {draft && (
        <Card className="border-blue-200 bg-blue-50/50">
          <h3 className="font-semibold text-gray-900 mb-3">Confirmar jugada</h3>
          <div className="space-y-2 mb-4">
            {draft.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>
                  {item.playType} {item.number1} - {item.lottery}
                </span>
                <span className="font-medium">${item.amount}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-lg mb-4">
            <span>Total</span>
            <span className="text-blue-600">${draft.totalAmount}</span>
          </div>
          {draft.message && (
            <p className="text-sm text-gray-600 mb-3">{draft.message}</p>
          )}
          <div className="flex gap-2">
            <Button onClick={handleConfirm} disabled={isPending} className="flex-1">
              Confirmar
            </Button>
            <Button variant="secondary" onClick={handleCancel} disabled={isPending} className="flex-1">
              Cancelar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
