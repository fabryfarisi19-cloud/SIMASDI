"use client";

import Image from "next/image";
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
  const [bukaMenu, setBukaMenu] = useState(false);

  const logout = () => {
    localStorage.removeItem("login");
    router.push("/login");
  };

  return (
    <>
      {/* Header khusus HP */}
      <header className="header-mobile">
  <Image
    src="/logosimasdi2.png"
    alt="SIMASDI"
    width={54}
    height={54}
    priority
    className="object-contain"
  />

  <button
    onClick={() => setBukaMenu(true)}
    className="tombol-hamburger"
    aria-label="Buka Menu"
  >
    <Menu size={30} />
  </button>
</header>

      {/* Latar gelap ketika menu terbuka */}
      {bukaMenu && (
        <div
          className="overlay-mobile"
          onClick={() => setBukaMenu(false)}
        />
      )}

      <aside className={`sidebar ${bukaMenu ? "buka" : ""}`}>
        <div className="sidebar-judul">
  <div className="sidebar-brand">
    <Image
      src="/logosimasdi1.png"
      alt="SIMASDI"
      width={250}
      height={250}
      priority
    />

   
  </div>

  <button
    onClick={() => setBukaMenu(false)}
    className="tombol-tutup"
    aria-label="Tutup menu"
  >
    <X size={26} />
  </button>
</div>

        <nav className="sidebar-menu">
          {menu.map((item) => {
            const Icon = item.icon;
            const aktif =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setBukaMenu(false)}
                className={`menu-link ${aktif ? "aktif" : ""}`}
              >
                <Icon size={19} />
                <span>{item.nama}</span>
              </Link>
            );
          })}
        </nav>

        <button onClick={logout} className="tombol-logout">
          <LogOut size={19} />
          Logout
        </button>
      </aside>

      <style jsx global>{`
        .header-mobile{
  height:70px;
  background:#0f2c73;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 18px;
}

        .sidebar {
          width: 258px;
          min-height: 100vh;
          background: #1e293b;
          color: white;
          padding: 26px 16px;
          box-sizing: border-box;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 80;
          display: flex;
          flex-direction: column;
        }

        .sidebar-judul {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 10px 22px;
          margin-bottom: 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 25px;
        }

        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .menu-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 14px;
          border-radius: 10px;
          color: white;
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
        }

        .menu-link.aktif {
          background: #2563eb;
          font-weight: 800;
        }

        .tombol-logout {
          margin-top: auto;
          width: 100%;
          border: none;
          border-radius: 10px;
          padding: 14px;
          background: #ef2525;
          color: white;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .tombol-hamburger,
        .tombol-tutup {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .tombol-tutup {
          display: none;
        }

        .overlay-mobile {
          display: none;
        }
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-text {
  display: flex;
  flex-direction: column;
}

.sidebar-text h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

.sidebar-text p {
  margin-top: 4px;
  font-size: 10px;
  color: #cbd5e1;
  line-height: 1.3;
}
  .header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-brand span {
  color: white;
  font-size: 22px;
  font-weight: 700;
}
        @media (max-width: 768px) {
          .header-mobile {
            height: 62px;
           background: linear-gradient(180deg, #061A48 0%, #0B2E78 100%);
            color: white;
            padding: 0 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 70;
            font-size: 20px;
          }

          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            height: 100vh;
            top: 0;
          }

          .sidebar.buka {
            transform: translateX(0);
          }

          .tombol-tutup {
            display: flex;
          }

          .overlay-mobile {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.55);
            z-index: 75;
          }
        }
      `}</style>
    </>
  );
}
