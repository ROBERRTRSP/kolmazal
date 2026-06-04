"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  createAuditLog,
  createSession,
  destroySession,
  getCurrentUser,
  getRoleHomePath,
  verifyPin,
} from "@/lib/auth";
import { redirect } from "next/navigation";

const loginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Teléfono debe tener 10 dígitos"),
  pin: z.string().regex(/^\d{4}$/, "PIN debe tener 4 dígitos"),
});

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    phone: formData.get("phone")?.toString().replace(/\D/g, ""),
    pin: formData.get("pin")?.toString(),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { phone: parsed.data.phone },
    });

    if (!user || !user.isActive) {
      return {
        success: false,
        error: "Usuario no encontrado. ¿Corriste db:seed en la base de datos?",
      };
    }

    const valid = await verifyPin(parsed.data.pin, user.pinHash);
    if (!valid) {
      return { success: false, error: "PIN incorrecto" };
    }

    await createSession(user.id);
    await createAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
    });

    return { success: true, redirectTo: getRoleHomePath(user.role) };
  } catch {
    return {
      success: false,
      error: "Error de base de datos. Verifica DATABASE_URL en Vercel.",
    };
  }
}

export async function logout() {
  const user = await getCurrentUser();
  if (user) {
    await createAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: "LOGOUT",
      entityType: "User",
      entityId: user.id,
    });
  }
  await destroySession();
  redirect("/login");
}

export { getCurrentUser };
