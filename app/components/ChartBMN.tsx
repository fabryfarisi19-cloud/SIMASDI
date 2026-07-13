"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Baik", value: 1180 },
  { name: "Rusak Ringan", value: 54 },
  { name: "Rusak Berat", value: 22 },
];

const colors = [
  "#22c55e",
  "#f59e0b",
  "#ef4444",
];

export default function ChartBMN() {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 h-[420px]">

      <h2 className="text-xl font-bold mb-6">
        Grafik Kondisi BMN
      </h2>

      <ResponsiveContainer width="100%" height="100%">

        <PieChart>

          <Pie
            data={data}
            dataKey="value"
            innerRadius={70}
            outerRadius={120}
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

    </div>
  );
}