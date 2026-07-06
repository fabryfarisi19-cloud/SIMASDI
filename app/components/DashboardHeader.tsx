"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Sun,
  CloudSun,
  MoonStar,
} from "lucide-react";

export default function DashboardHeader() {
  const [nama, setNama] = useState("Pengguna");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (user) {
      const u = JSON.parse(user);
      setNama(u.nama || "Pengguna");
    }

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const jam = now.getHours();

  let salam = "Selamat Malam";
  let Icon = MoonStar;

  if (jam >= 5 && jam < 11) {
    salam = "Selamat Pagi";
    Icon = Sun;
  } else if (jam >= 11 && jam < 15) {
    salam = "Selamat Siang";
    Icon = Sun;
  } else if (jam >= 15 && jam < 18) {
    salam = "Selamat Sore";
    Icon = CloudSun;
  }

  const tanggal = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const waktu = now.toLocaleTimeString("id-ID");

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 flex justify-between items-center mb-8">

      <div className="flex items-center gap-5">

        <Image
          src="/logoimipas.png"
          alt="logo"
          width={90}
          height={90}
          className="rounded-xl"
        />

        <div>

          <h1 className="text-2xl font-bold text-blue-900">
            Dashboard 
          </h1>

          <p className="text-md text-slate-900">
            Balai Pemasyarakatan Kelas I Jakarta Barat
          </p>

          <div className="flex items-center gap-2 mt-3 text-blue-700">

            <Icon size={20} />

            <span className="font-semibold">
              {salam}, {nama}
            </span>

          </div>

        </div>

      </div>

      <div className="text-right">

        <h2 className="text-4xl font-bold">
          {waktu}
        </h2>

        <p className="text-slate-500 mt-2">
          {tanggal}
        </p>

      </div>

    </div>
  );
}