"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
export default function HeaderDisplay() {

    const [waktu, setWaktu] = useState(new Date());

useEffect(() => {
  const interval = setInterval(() => {
    setWaktu(new Date());
  }, 1000);

  return () => clearInterval(interval);
}, []);
  return (
    <div className="bg-blue-900 text-white px-8 py-5 flex items-center justify-between">

      <div className="flex items-center gap-5">

        <Image
          src="/logoimipas.png"
          alt="Logo"
          width={70}
          height={70}
        />

        <div>
          <h1 className="text-4xl font-bold">
            SIAP
          </h1>

          <p className="text-xl">
            Sistem Informasi Antrean Pelayanan
          </p>

          <p className="text-blue-200">
            Balai Pemasyarakatan Kelas I Jakarta Barat
          </p>
        </div>

      </div>

      <div className="text-right">
       <div className="text-5xl font-bold">
  {waktu.toLocaleTimeString("id-ID")}
</div>

        <div className="text-xl">
        {waktu.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

    </div>
  );
}