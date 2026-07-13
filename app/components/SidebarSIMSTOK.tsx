"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Boxes,
  PackagePlus,
  ArrowRightLeft,
  Building2,
  UserCog,
  Wrench,
  ClipboardCheck,
  QrCode,
  FileBarChart2,
  Settings,
  House,
} from "lucide-react";

const menus = [
  { title: "Dashboard", href: "/simstok/dashboard", icon: LayoutDashboard },
  { title: "Data BMN", href: "/simstok/data-bmn", icon: Boxes },
  { title: "Barang Masuk", href: "/simstok/barang-masuk", icon: PackagePlus },
  { title: "Mutasi Barang", href: "/simstok/mutasi", icon: ArrowRightLeft },
  { title: "Ruangan", href: "/simstok/ruangan", icon: Building2 },
  { title: "Penanggung Jawab", href: "/simstok/penanggung-jawab", icon: UserCog },
  { title: "Pemeliharaan", href: "/simstok/pemeliharaan", icon: Wrench },
  { title: "Stock Opname", href: "/simstok/stock-opname", icon: ClipboardCheck },
  { title: "QR Code BMN", href: "/simstok/qrcode", icon: QrCode },
  { title: "Laporan", href: "/simstok/laporan", icon: FileBarChart2 },
  { title: "Pengaturan", href: "/simstok/setting", icon: Settings },
];

export default function SidebarSIMSTOK() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 w-72 h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-blue-700 text-white shadow-2xl flex flex-col">

      {/* Header */}
      <div className="p-6 border-b border-blue-700">

        <Image
          src="/logosimasdi1.png"
          alt="SIMSTOK"
          width={180}
          height={60}
        />

        <h2 className="mt-4 text-2xl font-bold">
          SIMSTOK BMN
        </h2>

        <p className="text-sm text-blue-200">
          Sistem Informasi Manajemen
          <br />
          Barang Milik Negara
        </p>

      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto p-5">

        <nav className="space-y-2">

          {menus.map((menu) => {
            const Icon = menu.icon;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                  pathname === menu.href
                    ? "bg-white text-blue-900 font-bold"
                    : "hover:bg-blue-700"
                }`}
              >
                <Icon size={20} />
                {menu.title}
              </Link>
            );
          })}

        </nav>

      </div>

      {/* Footer */}
      <div className="border-t border-blue-700 p-5">

        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl bg-blue-700 px-4 py-3 hover:bg-blue-600"
        >
          <House size={20} />
          Dashboard SIMASDI
        </Link>

        <p className="mt-5 text-center text-xs text-blue-200">
          SIMSTOK BMN v1.0
          <br />
          Bapas Kelas I Jakarta Barat
        </p>

      </div>

    </aside>
  );
}