"use client";

import { useState, useTransition } from "react";
import { Mic, MicOff, Send } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { parsePlay, confirmPlay, cancelPlayDraft } from "@/actions/player";

type PlayPanelProps = {
  onConfirmed?: () => void;
};

export function PlayPanel({ onConfirmed }: PlayPanelProps) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [draft, setDraft] = useState<{
    items: Array<{ lottery: string; playType: string; number1: string; amount: number }>;
    totalAmount: number;
    message?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleParse = (input: string) => {
    if (!input.trim()) return;
    setError("");
    startTransition(async () => {
      const result = await parsePlay(input);
      if (!result.success) {
        setError(result.error ?? "No se pudo interpretar");
        setDraft(null);
        return;
      }
      if (result.needsConfirmation && result.items) {
        setDraft({
          items: result.items,
          totalAmount: result.totalAmount ?? 0,
          message: result.message,
        });
      } else if (result.parsed?.intent === "CONFIRM") {
        handleConfirm();
      } else if (result.parsed?.intent === "CANCEL") {
        handleCancel();
      }
    });
  };

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await confirmPlay();
      if (!result.success) {
        setError(result.error ?? "Error al confirmar");
        return;
      }
      setDraft(null);
      setText("");
      onConfirmed?.();
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      await cancelPlayDraft();
      setDraft(null);
      setText("");
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
        onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onstart: (() => void) | null;
        onend: (() => void) | null;
        onerror: (() => void) | null;
        onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
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
      handleParse(transcript);
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
        {listening ? "Escuchando..." : "Toca para hablar o escribe abajo"}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleParse(text);
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
