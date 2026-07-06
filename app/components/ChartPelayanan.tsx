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

type Props = {
  menunggu: number;
  dipanggil: number;
  selesai: number;
};

export default function ChartPelayanan({
  menunggu,
  dipanggil,
  selesai,
}: Props) {
  const data = [
    {
      name: "Menunggu",
      jumlah: menunggu,
    },
    {
      name: "Dipanggil",
      jumlah: dipanggil,
    },
    {
      name: "Selesai",
      jumlah: selesai,
    },
  ];

  return (
    <div className="mt-10 bg-white rounded-2xl shadow p-6">
      <h2 className="text-2xl font-bold mb-6">
        Grafik Statistik Pelayanan
      </h2>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
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
  );
}