"use client";

import HeaderLaporan from "@/app/components/HeaderLaporan";
import StatisticsCard from "@/app/components/StatisticsCard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Clock3,
  BellRing,
  CheckCircle2,
} from "lucide-react";
export default function DashboardSIAP() {
const [data, setData] = useState({
  total: 0,
  menunggu: 0,
  dipanggil: 0,
  selesai: 0,
});
useEffect(() => {
  loadData();
}, []);
async function loadData() {
  const [total, menunggu, dipanggil, selesai] =
    await Promise.all([
      supabase
        .from("antrian")
        .select("*", { count: "exact", head: true }),

      supabase
        .from("antrian")
        .select("*", { count: "exact", head: true })
        .eq("status", "MENUNGGU"),

      supabase
        .from("antrian")
        .select("*", { count: "exact", head: true })
        .eq("status", "DIPANGGIL"),

      supabase
        .from("antrian")
        .select("*", { count: "exact", head: true })
        .eq("status", "SELESAI"),
    ]);

  setData({
    total: total.count ?? 0,
    menunggu: menunggu.count ?? 0,
    dipanggil: dipanggil.count ?? 0,
    selesai: selesai.count ?? 0,
  });
}    
  return (
    <main className="p-8">
      <HeaderLaporan title="Dashboard SIAP" />

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">

  <StatisticsCard
    title="Total Antrean"
    value={data.total}
    color="bg-blue-600"
    icon={<Users />}
  />

  <StatisticsCard
    title="Menunggu"
    value={data.menunggu}
    color="bg-yellow-500"
    icon={<Clock3 />}
  />

  <StatisticsCard
    title="Dipanggil"
    value={data.dipanggil}
    color="bg-green-600"
    icon={<BellRing />}
  />

  <StatisticsCard
    title="Selesai"
    value={data.selesai}
    color="bg-purple-600"
    icon={<CheckCircle2 />}
  />

</div>

<div className="mt-8 rounded-2xl bg-white shadow p-8">
  <h2 className="text-2xl font-bold">
    Selamat Datang di Dashboard SIAP
  </h2>

  <p className="mt-4 text-slate-600">
    Dashboard ini akan menampilkan statistik pelayanan,
    grafik antrean, dan informasi operasional SIAP.
  </p>
</div>
    </main>
  );
}