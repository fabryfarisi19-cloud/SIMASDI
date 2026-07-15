"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
  Menu,
  X,
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
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Header Mobile */}
      <header className="simstok-header">
        <div className="flex items-center gap-3">
          <Image
            src="/logosimasdi2.png"
            alt="SIMSTOK"
            width={130}
            height={40}
          />
        </div>

        <button
          onClick={() => setOpen(true)}
          className="text-white"
          aria-label="Buka Menu"
        >
          <Menu size={28} />
        </button>
      </header>

      {open && (
        <div
          className="simstok-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`simstok-sidebar ${open ? "open" : ""}`}>

        <div className="simstok-top">

          <button
            onClick={() => setOpen(false)}
            className="simstok-close"
            aria-label="Tutup"
          >
            <X size={24} />
          </button>

          <Image
            src="/logosimasdi1.png"
            alt="SIMSTOK"
            width={170}
            height={70}
          />

          <h2>SIMSTOK BMN</h2>

          <p>
            Sistem Informasi Manajemen
            <br />
            Barang Milik Negara
          </p>

        </div>
        {/* Menu */}
        <div className="simstok-menu">

          <nav>

            {menus.map((menu) => {
              const Icon = menu.icon;

              const aktif =
                pathname === menu.href ||
                (menu.href !== "/simstok/dashboard" &&
                  pathname.startsWith(menu.href));

              return (
                <Link
                  key={menu.href}
                  href={menu.href}
                  onClick={() => setOpen(false)}
                  className={`simstok-link ${aktif ? "active" : ""}`}
                >
                  <Icon size={20} />
                  <span>{menu.title}</span>
                </Link>
              );
            })}

          </nav>
        </div>

        {/* Footer */}
        <div className="simstok-footer">

          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="simstok-home"
          >
            <House size={20} />
            Dashboard SIMASDI
          </Link>

          <div className="simstok-version">
            SIMSTOK BMN v1.0.0
            <br />
            Bapas Kelas I Jakarta Barat
          </div>

        </div>

      </aside>
      <style jsx global>{`
/* ===========================
   HEADER MOBILE
=========================== */

.simstok-header{
  display:none;
  position:fixed;
  top:0;
  left:0;
  right:0;
  height:64px;
  padding:0 16px;
  background:linear-gradient(180deg,#061A48,#0B2E78);
  align-items:center;
  justify-content:space-between;
  z-index:9990;
  box-shadow:0 2px 12px rgba(0,0,0,.25);
}

/* ===========================
   OVERLAY
=========================== */

.simstok-overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.45);
  backdrop-filter:blur(2px);
  z-index:9998;
}

/* ===========================
   SIDEBAR
=========================== */

.simstok-sidebar{
  position:fixed;
  top:0;
  left:0;
  width:270px;
  height:100vh;

  background:linear-gradient(
    180deg,
    #061A48 0%,
    #0B2E78 60%,
    #103B9E 100%
  );

  color:white;

  display:flex;
  flex-direction:column;

  overflow:hidden;

  z-index:9999;

  transition:transform .35s cubic-bezier(.22,.61,.36,1);
}

.simstok-top{
  position:relative;
  text-align:center;
  padding:22px 18px 18px;
  border-bottom:1px solid rgba(255,255,255,.15);
}

.simstok-top img{
  display:block;
  margin:auto;
}

.simstok-top h2{
  margin-top:16px;
  font-size:24px;
  font-weight:800;
}

.simstok-top p{
  margin-top:8px;
  font-size:13px;
  color:#CBD5E1;
  line-height:1.5;
}

.simstok-close{
  display:none;
  position:absolute;
  top:16px;
  right:16px;

  width:42px;
  height:42px;

  border:none;
  border-radius:999px;

  background:rgba(255,255,255,.12);

  color:white;

  align-items:center;
  justify-content:center;

  cursor:pointer;
}
.simstok-menu{
  flex:1;
  overflow-y:auto;
  overflow-x:hidden;
  padding:18px 14px;
}

.simstok-menu nav{
  display:flex;
  flex-direction:column;
  gap:6px;
}

.simstok-link{
  display:flex;
  align-items:center;
  gap:12px;

  padding:13px 14px;

  border-radius:14px;

  color:white;
  text-decoration:none;

  font-size:15px;
  font-weight:600;

  transition:.25s;
}

.simstok-link:hover{
  background:rgba(255,255,255,.10);
  transform:translateX(6px);
}

.simstok-link.active{
  background:linear-gradient(90deg,#2563EB,#3B82F6);
  box-shadow:0 10px 25px rgba(37,99,235,.35);
  font-weight:800;
}

.simstok-footer{
  padding:16px;
  border-top:1px solid rgba(255,255,255,.15);
}

.simstok-home{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;

  background:#2563EB;

  color:white;
  text-decoration:none;

  border-radius:12px;
  padding:13px;

  font-weight:700;

  transition:.25s;
}

.simstok-home:hover{
  background:#1D4ED8;
}

.simstok-version{
  margin-top:14px;
  text-align:center;
  color:#CBD5E1;
  font-size:11px;
  line-height:1.6;
}

@media (max-width:768px){

  .simstok-header{
    display:flex;
  }

  .simstok-sidebar{
    transform:translateX(-100%);
  }

  .simstok-sidebar.open{
    transform:translateX(0);
  }

  .simstok-close{
    display:flex;
  }

}

@media (min-width:769px){

  .simstok-sidebar{
    transform:none !important;
  }

}
      `}</style>
    </>
  );
}
