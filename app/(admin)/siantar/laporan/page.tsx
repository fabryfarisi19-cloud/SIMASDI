"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LaporanPage() {
  const [data, setData] = useState({
    total: 0,
    menunggu: 0,
    dipanggil: 0,
    selesai: 0,
  });
const chartData = [
  {
    name: "Menunggu",
    jumlah: data.menunggu,
  },
  {
    name: "Dipanggil",
    jumlah: data.dipanggil,
  },
  {
    name: "Selesai",
    jumlah: data.selesai,
  },
];
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
<div className="mt-10 bg-white rounded-2xl shadow p-6">
  <h2 className="text-2xl font-bold mb-6">
    Grafik Statistik Pelayanan
  </h2>

  <div className="h-[400px]">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="name" />

        <YAxis />

        <Tooltip />

        <Bar
          dataKey="jumlah"
          radius={[8, 8, 0, 0]}
          fill="#2563eb"
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>
    setData({
      total: total.count ?? 0,
      menunggu: menunggu.count ?? 0,
      dipanggil: dipanggil.count ?? 0,
      selesai: selesai.count ?? 0,
    });
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-8">
        Laporan SIAP
      </h1>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-blue-600 text-white rounded-xl p-6">
          <h2>Total</h2>
          <p className="text-5xl font-bold">{data.total}</p>
        </div>

        <div className="bg-yellow-500 text-white rounded-xl p-6">
          <h2>Menunggu</h2>
          <p className="text-5xl font-bold">{data.menunggu}</p>
        </div>

        <div className="bg-green-600 text-white rounded-xl p-6">
          <h2>Dipanggil</h2>
          <p className="text-5xl font-bold">{data.dipanggil}</p>
        </div>

        <div className="bg-purple-600 text-white rounded-xl p-6">
          <h2>Selesai</h2>
          <p className="text-5xl font-bold">{data.selesai}</p>
        </div>
      </div>
    </main>
  );
}