import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";
import { randomBytes } from "crypto";

const SESSION_COOKIE = "kolmazal_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export type AuthUser = {
  id: string;
  phone: string;
  role: Role;
  balance?: number;
  name?: string;
};

export async function hashPin(pin: string) {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string) {
  return bcrypt.compare(pin, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const headerStore = await headers();

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      ipAddress: headerStore.get("x-forwarded-for") ?? headerStore.get("x-real-ip") ?? undefined,
      userAgent: headerStore.get("user-agent") ?? undefined,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          playerProfile: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  const user = session.user;
  return {
    id: user.id,
    phone: user.phone,
    role: user.role,
    balance: user.playerProfile ? Number(user.playerProfile.balance) : undefined,
  };
}

export async function requireAuth(allowedRoles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect(getRoleHomePath(user.role));
  }
  return user;
}

export function getRoleHomePath(role: Role) {
  switch (role) {
    case "PLAYER":
      return "/player";
    case "CASHIER":
      return "/cashier";
    case "ADMIN":
    case "SUPER_ADMIN":
      return "/admin/dashboard";
    default:
      return "/login";
  }
}

export async function createAuditLog(params: {
  actorId?: string;
  actorRole?: Role;
  action: import("@prisma/client").AuditAction;
  entityType?: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  const headerStore = await headers();
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValue: params.oldValue ? JSON.stringify(params.oldValue) : undefined,
      newValue: params.newValue ? JSON.stringify(params.newValue) : undefined,
      ipAddress: headerStore.get("x-forwarded-for") ?? undefined,
      userAgent: headerStore.get("user-agent") ?? undefined,
    },
  });
}
