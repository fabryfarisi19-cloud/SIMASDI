"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Send,
  FileText,
  Archive,
  Users,
  CalendarDays,
  LogOut,
} from "lucide-react";

const menu = [
  { nama: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { nama: "Surat Masuk", href: "/surat-masuk", icon: Inbox },
  { nama: "Surat Keluar", href: "/surat-keluar", icon: Send },
  { nama: "Disposisi", href: "/disposisi", icon: FileText },
  { nama: "Arsip Digital", href: "/arsip", icon: Archive },
  { nama: "Pengguna", href: "/pengguna", icon: Users },
  { nama: "Agenda Kegiatan", href: "/agenda", icon: CalendarDays },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("login");
    router.push("/login");
  };

  return (
   <aside
  style={{
    width: "260px",
    height: "100vh",
    background: "#1e293b",
    padding: "24px 16px",
    color: "white",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 100,
    boxSizing: "border-box",
  }}
>
      <div
        style={{
          fontSize: "24px",
          fontWeight: "800",
          letterSpacing: "1px",
          padding: "8px 12px 22px",
          borderBottom: "1px solid #64748b",
          marginBottom: "20px",
        }}
      >
        SIMASDI
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {menu.map((item) => {
          const Icon = item.icon;
          const aktif = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "10px",
                textDecoration: "none",
                color: aktif ? "#ffffff" : "#cbd5e1",
                background: aktif ? "#2563eb" : "transparent",
                fontWeight: aktif ? "700" : "500",
                fontSize: "15px",
                transition: "0.2s",
              }}
            >
              <Icon size={19} />
              {item.nama}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        style={{
          marginTop: "28px",
          width: "100%",
          border: "none",
          borderRadius: "10px",
          padding: "12px",
          background: "#dc2626",
          color: "white",
          fontWeight: "700",
          fontSize: "15px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <LogOut size={18} />
        Logout
      </button>

      <div
        style={{
          position: "absolute",
          bottom: "22px",
          left: "22px",
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          background: "#020617",
          border: "1px solid #475569",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "13px",
        }}
      >
        N
      </div>
    </aside>
  );
}