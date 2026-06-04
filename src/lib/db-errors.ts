import { Prisma } from "@prisma/client";

export function getDatabaseErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    if (error.message.includes("DATABASE_URL")) {
      return "DATABASE_URL no está configurada en Vercel.";
    }
    return "No se pudo conectar a Neon. Usa la URL pooled (con -pooler) y sslmode=require.";
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P1000":
        return "Usuario o contraseña incorrectos en DATABASE_URL.";
      case "P1001":
        return "No se alcanza el servidor Neon. Revisa la URL y que el proyecto esté activo.";
      case "P1017":
        return "Neon cerró la conexión. Usa la URL pooled de Neon (termina en -pooler).";
      case "P2021":
        return "Tablas no creadas. Ejecuta: npm run db:push && npm run db:seed";
      default:
        return `Error de base de datos (${error.code}). Revisa DATABASE_URL en Vercel.`;
    }
  }

  return "Error de base de datos. Verifica DATABASE_URL en Vercel.";
}

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  return Boolean(url && url.startsWith("postgresql"));
}
