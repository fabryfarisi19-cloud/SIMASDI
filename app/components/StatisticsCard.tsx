import { ReactNode } from "react";

type Props = {
  title: string;
  value: number | string;
  color?: string;
  icon?: ReactNode;
};

export default function StatisticsCard({
  title,
  value,
  color = "bg-blue-600",
  icon,
}: Props) {
return (
  <div
    className={`${color} rounded-2xl shadow-lg p-6 text-white hover:scale-105 transition-all duration-300 relative overflow-hidden`}
  >
    {/* Icon di pojok kanan atas */}
    <div className="absolute top-5 right-5 text-4xl opacity-20">
      {icon}
    </div>

    {/* Judul */}
    <p className="text-sm opacity-90">
      {title}
    </p>

    {/* Angka */}
  <h2 className="text-6xl font-extrabold tracking-tight leading-none mt-4">
  {value}
</h2>
  </div>
);
}