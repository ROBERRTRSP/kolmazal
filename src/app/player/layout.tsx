import { requireAuth } from "@/lib/auth";
import { PlayerHeader, PlayerNav } from "@/components/player/PlayerLayout";

export default async function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth(["PLAYER"]);

  return (
    <div className="min-h-screen pb-20">
      <PlayerHeader balance={user.balance ?? 0} />
      <main className="max-w-lg mx-auto px-4 py-4">{children}</main>
      <PlayerNav />
    </div>
  );
}
