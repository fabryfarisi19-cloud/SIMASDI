"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const data = [
  { nama: "TU", jumlah: 120 },
  { nama: "PK", jumlah: 80 },
  { nama: "Ruang Sidang", jumlah: 45 },
  { nama: "Gudang", jumlah: 210 },
  { nama: "Lobi", jumlah: 30 },
];

export default function ChartRuangan() {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 h-[420px]">

      <h2 className="text-xl font-bold mb-6">
        BMN per Ruangan
      </h2>

      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data}>
          <XAxis dataKey="nama" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="jumlah" fill="#2563eb" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}