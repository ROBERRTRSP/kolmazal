import Link from "next/link";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Ticket,
  BarChart3,
  Trophy,
  FileText,
  Settings,
  Shield,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/players", icon: Users, label: "Jugadores" },
  { href: "/admin/cashiers", icon: UserCheck, label: "Cajeros" },
  { href: "/admin/tickets", icon: Ticket, label: "Tickets" },
  { href: "/admin/results", icon: BarChart3, label: "Resultados" },
  { href: "/admin/prizes", icon: Trophy, label: "Premios" },
  { href: "/admin/reports", icon: FileText, label: "Reportes" },
  { href: "/admin/settings", icon: Settings, label: "Configuración" },
  { href: "/admin/audit", icon: Shield, label: "Auditoría" },
];

export function AdminSidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-blue-600">KolMazal</h1>
        <p className="text-xs text-gray-400">Panel Admin</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm"
          >
            <Icon size={18} />
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
