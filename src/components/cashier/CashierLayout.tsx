import Link from "next/link";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui";
import {
  LayoutDashboard,
  Scan,
  Wallet,
  ClipboardList,
  Ticket,
  Clock,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/cashier", icon: LayoutDashboard, label: "Inicio" },
  { href: "/cashier/scan", icon: Scan, label: "Escanear" },
  { href: "/cashier/orders", icon: ClipboardList, label: "Órdenes" },
  { href: "/cashier/recharge", icon: Wallet, label: "Recargas" },
  { href: "/cashier/tickets", icon: Ticket, label: "Tickets" },
  { href: "/cashier/shift", icon: Clock, label: "Turno" },
];

export function CashierSidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-blue-600">KolMazal</h1>
        <p className="text-xs text-gray-400">Panel Cajero</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </nav>

      <form action={logout}>
        <Button variant="ghost" type="submit" className="w-full justify-start">
          <LogOut size={18} className="mr-2" /> Salir
        </Button>
      </form>
    </aside>
  );
}
