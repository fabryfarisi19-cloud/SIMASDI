"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function Sidebar() {
  const router = useRouter();
  const sessionResult = useSession();
const session = sessionResult?.data;
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
const [showCalendar, setShowCalendar] = useState(false);
const [catatan, setCatatan] = useState("");
  const handleLogout = async () => {
  localStorage.removeItem("login");
  await signOut({ callbackUrl: "/login" });
};
  return (
    <div
      style={{
        width: "250px",
        minHeight: "100vh",
        background: "#1e293b",
        color: "white",
        padding: "20px",
      }}
    >
      <h2>SIMASDI</h2>

{session?.user && (
  <div
    style={{
      marginTop: "15px",
      marginBottom: "15px",
      textAlign: "center",
    }}
  >
    <img
      src={session.user.image || ""}
      alt="Profile"
      style={{
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        margin: "auto",
      }}
    />

    <p style={{ marginTop: "10px", fontWeight: "bold" }}>
      {session.user.name}
    </p>

    <p
      style={{
        fontSize: "12px",
        color: "#cbd5e1",
        wordBreak: "break-all",
      }}
    >
      {session.user.email}
    </p>
  </div>
)}

<hr />

      <p><Link href="/dashboard">Dashboard</Link></p>
      <p><Link href="/surat-masuk">Surat Masuk</Link></p>
      <p><Link href="/surat-keluar">Surat Keluar</Link></p>
      <p><Link href="/disposisi">Disposisi</Link></p>
      <p><Link href="/arsip">Arsip</Link></p>
      <p><Link href="/pengguna">Pengguna</Link></p>
      <p><Link href="/agenda">Agenda Kegiatan</Link></p>
   

<button
  onClick={handleLogout}
  style={{
    marginTop: "10px",
    width: "50%",
    padding: "10px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  }}
>
  Logout
</button>
    </div>
  );
}