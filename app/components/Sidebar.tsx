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
import { signOut } from "next-auth/react";
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

const logout = async () => {
  // Hapus semua data login lokal
  localStorage.removeItem("login");
  localStorage.removeItem("user");
  localStorage.removeItem("nama");
  localStorage.removeItem("role");
  localStorage.removeItem("username");

  // Hapus session Google (NextAuth)
  await signOut({
    redirect: false,
  });

  // Arahkan ke login
  router.replace("/login");
};
  return (
    <>
      {/* Header khusus HP */}
    <header className={`header-mobile ${bukaMenu ? "hidden" : ""}`}>

  <div className="header-brand">

    <Image
      src="/logosimasdi2.png"
      alt="SIMASDI"
      width={120}
      height={35}
    />

  </div>

  <button
    onClick={() => setBukaMenu(true)}
    className="tombol-hamburger"
    aria-label="Buka Menu"
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

     <aside
  className={`sidebar ${bukaMenu ? "buka" : ""}`}
  onClick={(e) => e.stopPropagation()}
>
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
  display:none;
  position:fixed;
  top:0;
  left:0;
  right:0;
  height:64px;

  background:linear-gradient(
    90deg,
    #0B2E78,
    #2563EB
  );

  padding:0 16px;

  align-items:center;
  justify-content:space-between;

  z-index:9999;

  box-shadow:0 3px 15px rgba(0,0,0,.18);
}
  .header-mobile.hidden{
  display:none !important;
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
  width:230px;
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
z-index:9999;
  display:flex;
  flex-direction:column;

  overflow-y:auto;
overflow-x:hidden;
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
 position:relative;
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:14px 16px 12px;
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
  padding-right:4px;
  padding-bottom:20px;
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
}
  .menu-link:active{
  transform:scale(.97);
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
  flex-shrink:0;
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

       .tombol-tutup{
  display:none;
  position:absolute;
  top:16px;
  right:16px;
  width:42px;
  height:42px;
  border-radius:50%;
  background:rgba(255,255,255,.12);
  color:white;
  z-index:10;
  align-items:center;
  justify-content:center;
}
.sidebar-brand{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  width:100%;
}

.sidebar-logo{
  width:120px;
  height:auto;
  margin:8px auto 4px;
  display:block;
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
.header-brand{
  display:flex;
  align-items:center;
  justify-content:flex-start;
  flex:1;
}

        @media (max-width: 768px) {
.header-mobile{
  display:flex;

  position:fixed;

  top:0;
  left:0;
  right:0;

  z-index:9990;
}

          .sidebar {
  transform: translateX(-100%);
  transition: transform .35s cubic-bezier(.22,.61,.36,1);
  will-change: transform;
}

          .sidebar.buka {
            transform: translateX(0);
            box-shadow:0 0 40px rgba(0,0,0,.35);
          }

          .tombol-tutup {
            display: flex;
          }

          .overlay-mobile{
  display:block;
  position:fixed;
  inset:0;
  background:rgba(15,23,42,.45);
  backdrop-filter:blur(3px);
  -webkit-backdrop-filter:blur(3px);
  z-index:9998;
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

      `}</style>
    </>
  );
}
