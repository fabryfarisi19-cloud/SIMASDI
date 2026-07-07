"use client";

import Image from "next/image";

type Props = {
  title: string;
};

export default function HeaderLaporan({ title }: Props) {
  return (
    <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-5 text-center md:flex-row md:items-center md:justify-between md:text-left">
    <div className="flex flex-col items-center gap-4 md:flex-row">

        <Image
          src="/logoimipas.png"
          alt="Logo"
          width={70}
          height={70}
        />

        <div>
        <h1 className="text-3xl md:text-4xl font-bold text-blue-900">
            {title}
          </h1>

          <p className="text-slate-600 mt-1">
            Balai Pemasyarakatan Kelas I Jakarta Barat
          </p>
        </div>

      </div>

     <div className="text-center md:text-right">

        <div className="text-lg font-semibold text-slate-700">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>

        <div className="text-sm text-slate-500">
          Sistem Informasi Antrean Pelayanan
        </div>

      </div>

    </div>
  );
}