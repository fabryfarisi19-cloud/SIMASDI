"use client";

import { ReactNode } from "react";

type Props = {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  color: "blue" | "green" | "orange" | "purple";
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: Props) {
  const colors = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    orange: "bg-orange-500",
    purple: "bg-purple-600",
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-slate-500 text-sm font-semibold">
            {title}
          </p>

          <h2 className="text-4xl font-black mt-2">
            {value}
          </h2>

          <p className="text-slate-500 mt-2 text-sm">
            {subtitle}
          </p>

        </div>

        <div
          className={`${colors[color]} w-16 h-16 rounded-2xl flex items-center justify-center text-white`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}