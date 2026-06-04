import Link from "next/link";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui";
import {
  Ticket,
  Trophy,
  QrCode,
  Wallet,
  BarChart3,
  User,
  LogOut,
  Home,
} from "lucide-react";

const navItems = [
  { href: "/player", icon: Home, label: "Inicio" },
  { href: "/player/tickets", icon: Ticket, label: "Tickets" },
  { href: "/player/recharge", icon: Wallet, label: "Recargar" },
  { href: "/player/qr", icon: QrCode, label: "Mi QR" },
  { href: "/player/profile", icon: User, label: "Perfil" },
];

export function PlayerNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 z-50">
      <div className="max-w-lg mx-auto flex justify-around">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function PlayerHeader({ balance }: { balance: number }) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100 px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-blue-600">KolMazal</h1>
          <p className="text-xs text-gray-400">Voz de la Suerte</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Balance</p>
          <p className="text-lg font-bold text-gray-900">
            ${balance.toLocaleString("es-DO")}
          </p>
        </div>
      </div>
    </header>
  );
}

export function QuickActions() {
  const actions = [
    { href: "/player/recharge", label: "Recargar", icon: Wallet, color: "bg-blue-50 text-blue-600" },
    { href: "/player/tickets", label: "Tickets", icon: Ticket, color: "bg-purple-50 text-purple-600" },
    { href: "/player/prizes", label: "Premios", icon: Trophy, color: "bg-green-50 text-green-600" },
    { href: "/player/qr", label: "Mi QR", icon: QrCode, color: "bg-yellow-50 text-yellow-700" },
    { href: "/player/results", label: "Resultados", icon: BarChart3, color: "bg-gray-50 text-gray-600" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map(({ href, label, icon: Icon, color }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon size={20} />
          </div>
          <span className="text-xs font-medium text-gray-700">{label}</span>
        </Link>
      ))}
    </div>
  );
}

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button variant="ghost" size="sm" type="submit">
        <LogOut size={16} className="mr-1" /> Salir
      </Button>
    </form>
  );
}
