"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Tv,
  FileText,
  Settings,
  Home,
  Menu,
  X,
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
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Header HP */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-blue-900 flex items-center justify-between px-4 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <Image
            src="/logoimipas.png"
            alt="Logo"
            width={42}
            height={42}
          />

          <span className="text-white font-bold text-lg">
            SIAP
          </span>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="text-white"
        >
          <Menu size={30} />
        </button>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0
          h-screen w-72
          bg-gradient-to-b
          from-blue-950
          via-blue-900
          to-blue-800
          text-white
          shadow-2xl
          flex flex-col
          z-50
          transition-transform
          duration-300

          ${open ? "translate-x-0" : "-translate-x-full"}

          md:translate-x-0
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-blue-700 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <Image
              src="/logoimipas.png"
              alt="Logo"
              width={60}
              height={60}
            />

            <div>
              <h2 className="text-2xl font-bold">
                SIAP
              </h2>

              <p className="text-blue-200 text-xs">
                Sistem Informasi Antrean Pelayanan
              </p>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="md:hidden"
          >
            <X />
          </button>

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
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                    pathname === menu.href
                      ? "bg-white text-blue-900 font-bold"
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
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-blue-700"
            >
              <Home size={22} />
              Dashboard SIMASDI
            </Link>
          </div>

        </div>

        <div className="border-t border-blue-700 p-5 text-center text-xs text-blue-300">
          SIAP v1.0
          <br />
          © 2026 Bapas Kelas I Jakarta Barat
        </div>

      </aside>
    </>
  );
}