"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Tv,
  FileText,
  Settings,
  Home,
} from "lucide-react";

const menus = [
  {
    title: "Dashboard",
    href: "/siantar/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Panel Petugas",
    href: "/siantar/petugas",
    icon: Users,
  },
  {
    title: "Display TV",
    href: "/siantar/display",
    icon: Tv,
  },
  {
    title: "Laporan",
    href: "/siantar/laporan",
    icon: FileText,
  },
  {
    title: "Pengaturan",
    href: "/siantar/setting",
    icon: Settings,
  },
];

export default function SidebarSIAP() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 w-72 h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 text-white shadow-2xl flex flex-col">

      {/* Header */}
      <div className="p-6 border-b border-blue-700">
        <div className="flex items-center gap-3">
          <Image
            src="/logoimipas.png"
            alt="Logo"
            width={70}
            height={70}
          />

          <div>
            <h2 className="text-2xl font-bold">
              SIAP
            </h2>

            <p className="text-blue-200 text-sm leading-5">
              Sistem Informasi Antrean Pelayanan
            </p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto px-5 py-6">

        <p className="text-xs uppercase tracking-widest text-blue-300 mb-4">
          Menu Utama
        </p>

        <nav className="space-y-2">
          {menus.map((menu) => {
            const Icon = menu.icon;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                  pathname === menu.href
                    ? "bg-white text-blue-900 font-bold shadow-lg"
                    : "hover:bg-blue-700"
                }`}
              >
                <Icon size={22} />
                {menu.title}
              </Link>
            );
          })}
        </nav>

        <div className="mt-10 border-t border-blue-700 pt-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-blue-700 transition"
          >
            <Home size={22} />
            Dashboard SIMASDI
          </Link>
        </div>

      </div>

      {/* Footer */}
      <div className="border-t border-blue-700 p-5 text-center text-xs text-blue-300">
        SIAP v1.0
        <br />
        © 2026 Bapas Kelas I Jakarta Barat
      </div>

    </aside>
  );
}