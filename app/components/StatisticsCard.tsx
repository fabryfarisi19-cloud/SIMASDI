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
      className={`${color} rounded-2xl shadow-lg p-6 text-white hover:scale-105 transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">
            {title}
          </p>

          <h2 className="text-5xl font-bold mt-2">
            {value}
          </h2>
        </div>

        <div className="text-5xl opacity-30">
          {icon}
        </div>
      </div>
    </div>
  );
}