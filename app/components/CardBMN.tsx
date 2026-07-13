import { ReactNode } from "react";

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  icon: ReactNode;
};

export default function CardBMN({
  title,
  value,
  subtitle,
  color,
  icon,
}: Props) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 flex justify-between items-center hover:shadow-xl transition">

      <div>
        <p className={`font-bold ${color}`}>
          {title}
        </p>

        <h2 className="text-4xl font-black mt-2">
          {value}
        </h2>

        {subtitle && (
          <p className="text-slate-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center text-white ${color.replace(
          "text",
          "bg"
        )}`}
      >
        {icon}
      </div>
    </div>
  );
}