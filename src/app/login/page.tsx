"use client";

import { useState } from "react";
import { login } from "@/actions/auth";
import { Button, Card, Input } from "@/components/ui";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      const result = await login(formData);
      if (result?.error) setError(result.error);
    } catch {
      // redirect throws
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600">KolMazal</h1>
          <p className="text-gray-500 mt-2">Voz de la Suerte</p>
        </div>

        <Card>
          <h2 className="text-xl font-semibold mb-6 text-center">Iniciar sesión</h2>
          <form action={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <Input
                name="phone"
                type="tel"
                placeholder="8290000000"
                maxLength={10}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIN
              </label>
              <Input
                name="pin"
                type="password"
                placeholder="••••"
                maxLength={4}
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-red-50 text-red-700 text-sm">{error}</div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-2">Usuarios de prueba</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-center text-gray-500">
              <div className="p-2 bg-gray-50 rounded-xl">
                <p className="font-medium">Jugador</p>
                <p>8290000000</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-xl">
                <p className="font-medium">Cajero</p>
                <p>8291111111</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-xl">
                <p className="font-medium">Admin</p>
                <p>8292222222</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">PIN: 1234</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
