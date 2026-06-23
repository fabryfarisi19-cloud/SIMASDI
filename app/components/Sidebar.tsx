"use client";

import { useState } from "react";
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
  Menu,
  X,
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
  const [menuBuka, setMenuBuka] = useState(false);

  const logout = () => {
    localStorage.removeItem("login");
    router.push("/login");
  };

  return (
    <>
      {/* HEADER KHUSUS HP */}
      <header
        className="mobile-header"
        style={{
          display: "none",
          height: "64px",
          padding: "0 16px",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#1e293b",
          color: "white",
          position: "sticky",
          top: 0,
          zIndex: 60,
        }}
      >
        <div style={{ fontWeight: "800", fontSize: "20px" }}>SIMASDI</div>

        <button
          onClick={() => setMenuBuka(true)}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            display: "flex",
            padding: "8px",
            cursor: "pointer",
          }}
          aria-label="Buka menu"
        >
          <Menu size={28} />
        </button>
      </header>

      {/* LAPISAN GELAP SAAT MENU HP TERBUKA */}
      {menuBuka && (
        <div
          onClick={() => setMenuBuka(false)}
          className="mobile-overlay"
          style={{
            display: "none",
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            zIndex: 70,
          }}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`sidebar ${menuBuka ? "sidebar-open" : ""}`}
        style={{
          width: "258px",
          minHeight: "100vh",
          padding: "26px 16px",
          background: "#1e293b",
          color: "white",
          boxSizing: "border-box",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 80,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 10px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.2)",
            marginBottom: "18px",
          }}
        >
          <div style={{ fontSize: "25px", fontWeight: "800" }}>SIMASDI</div>

          <button
            onClick={() => setMenuBuka(false)}
            className="close-mobile-menu"
            style={{
              display: "none",
              background: "transparent",
              border: "none",
              color: "white",
              cursor: "pointer",
              padding: "4px",
            }}
            aria-label="Tutup menu"
          >
            <X size={26} />
          </button>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          {menu.map((item) => {
            const Icon = item.icon;
            const aktif =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuBuka(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "13px 14px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: "white",
                  fontWeight: aktif ? "800" : "600",
                  background: aktif ? "#2563eb" : "transparent",
                  fontSize: "15px",
                }}
              >
                <Icon size={20} />
                {item.nama}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          style={{
            marginTop: "auto",
            width: "100%",
            border: "none",
            borderRadius: "10px",
            padding: "14px",
            background: "#ef2525",
            color: "white",
            fontWeight: "800",
            fontSize: "15px",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <LogOut size={19} />
          Logout
        </button>
      </aside>

      <style jsx global>{`
        @media (max-width: 768px) {
          .mobile-header {
            display: flex !important;
          }

          .mobile-overlay {
            display: block !important;
          }

          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            top: 0 !important;
            height: 100vh;
          }

          .sidebar.sidebar-open {
            transform: translateX(0);
          }

          .close-mobile-menu {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
              }
