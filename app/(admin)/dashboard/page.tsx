"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [suratMasuk, setSuratMasuk] = useState(0);
  const [suratKeluar, setSuratKeluar] = useState(0);
  const [arsipDigital, setArsipDigital] = useState(0);
  const [disposisi, setDisposisi] = useState(0);
  const [pengguna, setPengguna] = useState(0);
const [agendaHariIni, setAgendaHariIni] = useState<any[]>([]);
  
  useEffect(() => {
  const loadData = async () => {
    const { data: sm } = await supabase
      .from("surat_masuk")
      .select("no_agenda");

    const { data: sk } = await supabase
      .from("surat_keluar")
      .select("no_agenda");

    const { data: disposisiData } = await supabase
      .from("disposisi")
      .select("id");

    const { data: arsip } = await supabase
      .from("arsip_digital")
      .select("id");

    const { data: user } = await supabase
      .from("pengguna")
      .select("id");

    const hariIni = new Date().toISOString().split("T")[0];

    const { data: agenda } = await supabase
      .from("agenda")
      .select("*")
      .eq("tanggal", hariIni);

    setSuratMasuk(sm?.length || 0);
    setSuratKeluar(sk?.length || 0);
    setDisposisi(disposisiData?.length || 0);
    setArsipDigital(arsip?.length || 0);
    setPengguna(user?.length || 0);
    setAgendaHariIni(agenda || []);
  };

  loadData();
}, []);
const [waktu, setWaktu] = useState("");

useEffect(() => {
  const timer = setInterval(() => {
    const sekarang = new Date();

    setWaktu(
      sekarang.toLocaleString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
  }, 1000);

  return () => clearInterval(timer);
}, []);
  return (
    <div className="p-6">
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-6 rounded-xl shadow mb-6">
  <h1 className="text-3xl font-bold">
    SIMASDI
  </h1>

  <p className="mt-2 text-lg">
    Sistem Informasi Manajemen Surat dan Disposisi
  </p>

  <p className="text-sm mt-1">
    Balai Pemasyarakatan Kelas I Jakarta Barat
  </p>
</div>
      <div className="bg-blue-600 text-white p-3 rounded mb-4">
  🕒 {waktu}
</div>

<div className="bg-green-700 text-white p-2 rounded mb-6 overflow-hidden">
  <div className="running-text">
    📢 SIMASDI mendukung digitalisasi tata kelola surat masuk non-SRIKANDI, disposisi elektronik, arsip digital, serta peningkatan efisiensi administrasi di Bapas Kelas I Jakarta Barat.
  </div>
</div>
<div className="bg-white p-4 rounded-xl shadow mb-6">
  <h2 className="text-xl font-bold mb-3">
    📅 Agenda Hari Ini
  </h2>

  {agendaHariIni.length === 0 ? (
  <p>Tidak ada agenda hari ini</p>
) : (
  agendaHariIni.map((item) => (
    <div
      key={item.id}
      className="border-b py-2"
    >
      {item.keterangan}
    </div>
  ))
)}
      
</div>
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <Link href="/surat-masuk">
          <div className="bg-blue-500 text-white p-5 rounded-xl shadow cursor-pointer hover:scale-105 transition">
            <h2 className="text-lg">Surat Masuk</h2>
            <p className="text-3xl font-bold">{suratMasuk}</p>
          </div>
        </Link>

        <Link href="/surat-keluar">
          <div className="bg-green-500 text-white p-5 rounded-xl shadow cursor-pointer hover:scale-105 transition">
            <h2 className="text-lg">Surat Keluar</h2>
            <p className="text-3xl font-bold">{suratKeluar}</p>
          </div>
        </Link>

        <Link href="/disposisi">
          <div className="bg-yellow-500 text-white p-5 rounded-xl shadow cursor-pointer hover:scale-105 transition">
            <h2 className="text-lg">Disposisi</h2>
            <p className="text-3xl font-bold">{disposisi}</p>
          </div>
        </Link>

        <Link href="/arsip">
          <div className="bg-orange-500 text-white p-5 rounded-xl shadow cursor-pointer hover:scale-105 transition">
            <h2 className="text-lg">Arsip Digital</h2>
            <p className="text-3xl font-bold">{arsipDigital}</p>
          </div>
        </Link>

        <Link href="/pengguna">
          <div className="bg-purple-500 text-white p-5 rounded-xl shadow cursor-pointer hover:scale-105 transition">
            <h2 className="text-lg">Pengguna</h2>
            <p className="text-3xl font-bold">{pengguna}</p>
          </div>
        </Link>
        
      </div>
    </div>
  );
}