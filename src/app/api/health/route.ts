import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDatabaseErrorMessage, isDatabaseConfigured } from "@/lib/db-errors";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { status: "error", app: "KolMazal", db: "DATABASE_URL missing or invalid" },
      { status: 503 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    return NextResponse.json({
      status: "ok",
      app: "KolMazal",
      db: "connected",
      users: userCount,
      seeded: userCount > 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        app: "KolMazal",
        db: getDatabaseErrorMessage(error),
      },
      { status: 503 }
    );
  }
}
