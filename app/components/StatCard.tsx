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
    blue: {
      bg: "bg-blue-600",
      border: "border-blue-600",
    },
    green: {
      bg: "bg-green-600",
      border: "border-green-600",
    },
    orange: {
      bg: "bg-orange-500",
      border: "border-orange-500",
    },
    purple: {
      bg: "bg-purple-600",
      border: "border-purple-600",
    },
  };

  return (
    <div
  className={`
    bg-white
    rounded-2xl
    shadow-md
    border-l-4
    ${colors[color].border}
    p-5
    transition
    hover:-translate-y-1
    hover:shadow-lg
  `}
>
      <div className="flex items-center justify-between">

        <div>

         <h3 className="text-slate-600 text-xs font-semibold uppercase tracking-wide">
            {title}
          </h3>

        <div className="mt-2 text-4xl font-black text-slate-900">
            {value}
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {subtitle}
          </p>

        </div>

      <div
  className={`
    ${colors[color].bg}
    w-14
    h-14
            rounded-2xl
            flex
            items-center
            justify-center
            text-white
            shadow-lg
          `}
        >
          {icon}
        </div>

      </div>
    </div>
  );
}