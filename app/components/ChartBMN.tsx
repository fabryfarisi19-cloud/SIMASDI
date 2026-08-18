"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";

export default function ChartBMN() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: barang, error } = await supabase
      .from("barang")
      .select("jumlah, kondisi");

    if (error) {
      console.error("ERROR GRAFIK KONDISI BMN:", error.message);
      setLoading(false);
      return;
    }

    let baik = 0;
    let ringan = 0;
    let berat = 0;

    (barang || []).forEach((item) => {
      const jumlah = Number(item.jumlah || 0);
      const kondisi = String(item.kondisi || "")
        .trim()
        .toLowerCase();

      if (kondisi === "baik") {
        baik += jumlah;
      } else if (kondisi === "rusak ringan") {
        ringan += jumlah;
      } else if (kondisi === "rusak berat") {
        berat += jumlah;
      }
    });

    setData([
      { name: "Baik", value: baik },
      { name: "Rusak Ringan", value: ringan },
      { name: "Rusak Berat", value: berat },
    ]);

    setLoading(false);
  }

  const colors = [
    "#22c55e",
    "#f59e0b",
    "#ef4444",
  ];

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 h-[420px]">

      <h2 className="text-xl font-bold mb-6">
        Grafik Kondisi BMN
      </h2>

      {loading ? (
        <div className="h-[330px] flex items-center justify-center text-slate-500">
          Memuat grafik...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={120}
              paddingAngle={2}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={colors[index]}
                />
              ))}
            </Pie>

            <Tooltip />

          </PieChart>
        </ResponsiveContainer>
      )}

    </div>
  );
}