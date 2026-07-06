"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboard } from "@/lib/siantar";
import {
  Monitor,
  Ticket,
  Users,
  BarChart3,
} from "lucide-react";
import StatisticsCard from "@/app/components/StatisticsCard";

export default function SiantarDashboard() {
  const [dashboard, setDashboard] = useState({
    total: 0,
    menunggu: 0,
    dipanggil: 0,
    selesai: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const data = await getDashboard();
    setDashboard(data);
  }

  return (
   <main className="p-4 md:p-8 space-y-6">
    <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
  SIAP
</h1>

     <p className="text-slate-500 text-sm md:text-base">
        Sistem Informasi Antrean Pelayanan
      </p>

     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticsCard
          title="Total Hari Ini"
          value={dashboard.total}
          color="bg-blue-700"
          icon={<Ticket />}
        />

        <StatisticsCard
          title="Menunggu"
          value={dashboard.menunggu}
          color="bg-yellow-500"
          icon={<Users />}
        />

        <StatisticsCard
          title="Dipanggil"
          value={dashboard.dipanggil}
          color="bg-green-600"
          icon={<Monitor />}
        />

        <StatisticsCard
          title="Selesai"
          value={dashboard.selesai}
          color="bg-purple-700"
          icon={<BarChart3 />}
        />
      </div>
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
        <Link
          href="/siantar/kiosk"
          
        className="rounded-2xl bg-white shadow p-6 hover:shadow-xl transition"
        >
         <h2 className="text-lg md:text-xl font-bold">🎫 Kiosk</h2>
         <p className="mt-2 text-sm text-slate-500">
  Ambil Nomor Antrian
</p>
        </Link>

      <Link
  href="/display"
  className="rounded-2xl bg-white shadow p-6 hover:shadow-xl transition"
>
 <h2 className="text-lg md:text-xl font-bold">
    📺 Display TV
  </h2>

  <p className="mt-2 text-slate-500">
    Tampilan Layar Antrian
  </p>
</Link>

        <Link
          href="/siantar/petugas"
        className="rounded-2xl bg-white shadow p-6 hover:shadow-xl transition"
        >
         <h2 className="text-lg md:text-xl font-bold">👨‍💼 Panel Petugas</h2>
         <p className="mt-2 text-sm text-slate-500">
  Pemanggilan Antrian
</p>
        </Link>
        <Link
          href="/siantar/laporan"
         className="rounded-2xl bg-white shadow p-6 hover:shadow-xl transition"
        >
         <h2 className="text-lg md:text-xl font-bold">📊 Laporan</h2>
         <p className="mt-2 text-sm text-slate-500">
  Statistik Pelayanan
</p>
        </Link>

        <Link
          href="/siantar/setting"
         className="rounded-2xl bg-white shadow p-6 hover:shadow-xl transition"
        >
          <h2 className="text-lg md:text-xl font-bold">⚙ Pengaturan</h2>
        <p className="mt-2 text-sm text-slate-500">
  Video, Running Text, Loket
</p>
        </Link>
      </div>
    </main>
  );
}