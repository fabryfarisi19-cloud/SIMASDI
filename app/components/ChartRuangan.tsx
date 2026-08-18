"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { supabase } from "@/lib/supabase";

export default function ChartRuangan() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: barang, error } = await supabase
      .from("barang")
      .select("ruangan, jumlah");

    if (error) {
      console.error("ERROR GRAFIK RUANGAN:", error.message);
      setLoading(false);
      return;
    }

    const ruanganMap: Record<string, number> = {};

    (barang || []).forEach((item) => {
      const ruangan =
        String(item.ruangan || "Belum Ditentukan").trim();

      const jumlah = Number(item.jumlah || 0);

      if (!ruanganMap[ruangan]) {
        ruanganMap[ruangan] = 0;
      }

      ruanganMap[ruangan] += jumlah;
    });

    const hasil = Object.entries(ruanganMap)
      .map(([nama, jumlah]) => ({
        nama,
        jumlah,
      }))
      .sort((a, b) => b.jumlah - a.jumlah);

    setData(hasil);
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 h-[420px]">

      <h2 className="text-xl font-bold mb-6">
        BMN per Ruangan
      </h2>

      {loading ? (
        <div className="h-[330px] flex items-center justify-center text-slate-500">
          Memuat grafik...
        </div>
      ) : data.length === 0 ? (
        <div className="h-[330px] flex items-center justify-center text-slate-500">
          Belum ada data ruangan.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 20,
            }}
          >
            <XAxis
              dataKey="nama"
              interval={0}
              angle={-15}
              textAnchor="end"
              height={60}
            />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="jumlah"
              fill="#2563eb"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

    </div>
  );
}