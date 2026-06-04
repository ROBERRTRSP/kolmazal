import { getWalletHistory } from "@/actions/player";
import { getCurrentUser } from "@/lib/auth";
import { Card, PageHeader, Badge } from "@/components/ui";
import { LogoutButton } from "@/components/player/PlayerLayout";
import { formatCurrency, formatPhone } from "@/lib/utils";

export default async function PlayerProfilePage() {
  const user = await getCurrentUser();
  const history = await getWalletHistory(user!.id, 20);

  return (
    <div>
      <PageHeader title="Mi Perfil" action={<LogoutButton />} />

      <Card className="mb-6">
        <p className="text-sm text-gray-500">Teléfono</p>
        <p className="font-bold text-lg">{formatPhone(user!.phone)}</p>
        <p className="text-sm text-gray-500 mt-3">Balance</p>
        <p className="font-bold text-2xl text-blue-600">
          {formatCurrency(user!.balance ?? 0)}
        </p>
      </Card>

      <h3 className="font-semibold mb-3">Historial de balance</h3>
      <div className="space-y-2">
        {history.map((tx) => (
          <Card key={tx.id} className="py-3">
            <div className="flex justify-between items-center">
              <div>
                <Badge variant={tx.type === "WIN" || tx.type === "DEPOSIT" ? "success" : "default"}>
                  {tx.type}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(tx.createdAt).toLocaleString("es-DO")}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`font-bold ${
                    ["WIN", "DEPOSIT", "REFUND"].includes(tx.type)
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {["WIN", "DEPOSIT", "REFUND"].includes(tx.type) ? "+" : "-"}
                  {formatCurrency(Number(tx.amount))}
                </p>
                <p className="text-xs text-gray-500">
                  Saldo: {formatCurrency(Number(tx.balanceAfter))}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
