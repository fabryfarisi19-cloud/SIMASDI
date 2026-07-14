"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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
import { Ticket } from "lucide-react";
import { Boxes } from "lucide-react";

const menu = [
  { nama: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { nama: "Surat Masuk", href: "/surat-masuk", icon: Inbox },
  { nama: "Surat Keluar", href: "/surat-keluar", icon: Send },
  { nama: "Disposisi", href: "/disposisi", icon: FileText },
  { nama: "Arsip Digital", href: "/arsip", icon: Archive },
{
  nama: "SIMSTOK BMN",
  href: "/simstok/dashboard",
  icon: Boxes,
},
  // Tambahkan ini
  { nama: "SIAP", href: "/siantar", icon: Ticket },

  { nama: "Pengguna", href: "/pengguna", icon: Users },
  { nama: "Agenda Kegiatan", href: "/agenda", icon: CalendarDays },

];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [bukaMenu, setBukaMenu] = useState(false); 
const [nama, setNama] = useState("Pengguna");
const [jabatan, setJabatan] = useState("");

useEffect(() => {
  const user = localStorage.getItem("user");
 console.log("USER =", user);
  if (user) {
    const u = JSON.parse(user);

    setNama(u.nama || "Pengguna");
    setJabatan(u.jabatan || "");
  }
}, []);

const logout = () => {
  localStorage.removeItem("login");
  localStorage.removeItem("user");
  router.push("/login");
};

  return (
    <>
      {/* Header khusus HP */}
    <header className="header-mobile">

  <div className="header-brand">

    <Image
      src="/logosimasdi2.png"
      alt="SIMASDI"
      width={155}
      height={45}
    />

  </div>

  <button
    onClick={() => setBukaMenu(true)}
    className="tombol-hamburger"
  >
    <Menu size={26}/>
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
    width={170}
    height={170}
    priority
    className="sidebar-logo"
  />

  <div className="sidebar-user">


    <h3>{nama}</h3>

    <p>{jabatan}</p>

    <span className="status-online">
      ● Online
    </span>

  </div>

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
 <div className="versi-app">
  SIMASDI v1.0.0
  <br />
  Bapas Kelas I Jakarta Barat
</div>
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
.versi-app{
  margin-top:12px;
  padding-top:12px;
  border-top:1px solid rgba(255,255,255,.10);

  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;

  text-align:center;

  color:#CBD5E1;

  font-size:10px;

  line-height:1.5;

  letter-spacing:.3px;
}
.sidebar{
  width:258px;
  height:100vh;

  background:linear-gradient(
    180deg,
    #061A48 0%,
    #0B2E78 60%,
    #103B9E 100%
  );

  position:fixed;
  left:0;
  top:0;

  display:flex;
  flex-direction:column;

  overflow:hidden;
}
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.30);
  border-radius: 999px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,.55);
}
 .sidebar-judul{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:0 10px 12px;
  margin-bottom:10px;
  border-bottom:1px solid rgba(255,255,255,.15);
}

.sidebar-menu{
  flex:1;
  display:flex;
  flex-direction:column;
  gap:3px;

  overflow-y:auto;
  overflow-x:hidden;

  min-height:0;
}
        .menu-link{
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
  .menu-link:hover{
background:rgba(255,255,255,.10);
transform:translateX(6px);
box-shadow:0 8px 20px rgba(0,0,0,.18);
}
  .menu-link svg{
  flex-shrink:0;
}

    .menu-link.aktif{
  background:linear-gradient(90deg,#2563EB,#3B82F6);
  color:white;
  font-weight:800;
  box-shadow:
    0 10px 25px rgba(37,99,235,.35);

  transform:translateX(6px);

}
  .menu-link{
position:relative;
overflow:hidden;
}

.menu-link.aktif::before{
transform:scaleY(1);
}
     .tombol-logout{
  margin-top:20px;

  width:100%;
  border:none;
  border-radius:12px;
  padding:14px;
  background:#dc2626;
  color:white;
  font-weight:700;
  cursor:pointer;

  display:flex;
  justify-content:center;
  align-items:center;
  gap:10px;
}
.tombol-logout:hover{
background:#B91C1C;
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
.sidebar-brand{
  display:flex;
  flex-direction:column;
  align-items:center;
  width:100%;
  margin-bottom:0;
}

.sidebar-logo{
  width:150px;
  height:auto;
  margin-bottom:6px;
}

.sidebar-user{
  width:100%;
  text-align:center;
  margin-top:4px;
  margin-bottom:12px;
}

.sidebar-user h3{
  margin:0;
  font-size:15px;
  font-weight:800;
  color:#fff;
  line-height:1.3;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.sidebar-user p{
  margin-top:6px;
  font-size:13px;
  color:#CBD5E1;
  text-transform:capitalize;
}

.sidebar-user span{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:6px;
  margin-top:10px;
  padding:6px 14px;
  background:#14532D;
  color:#86EFAC;
  border-radius:999px;
  font-size:12px;
  font-weight:700;
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

.status-online{
  display:inline-block;
  margin-top:10px;
  padding:6px 14px;
  border-radius:999px;
  background:#14532D;
  color:#86EFAC;
  font-size:12px;
  font-weight:700;
}

.sidebar-user{
  text-align:center;
  margin-top:12px;
}

.sidebar-user h3{
  font-size:16px;
  font-weight:800;
  color:white;
}

.sidebar-user p{
  color:#CBD5E1;
  font-size:13px;
  margin-top:4px;
}
      `}</style>
    </>
  );
}
