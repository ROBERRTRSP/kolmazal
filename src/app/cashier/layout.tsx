import { requireAuth } from "@/lib/auth";
import { CashierSidebar } from "@/components/cashier/CashierLayout";

export default async function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth(["CASHIER"]);

  return (
    <div className="flex min-h-screen">
      <CashierSidebar />
      <main className="flex-1 p-6 bg-gray-50 overflow-auto">{children}</main>
    </div>
  );
}
