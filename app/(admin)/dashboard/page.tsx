"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  RefreshCcw,
  Printer,
  Inbox,
  Send,
  FileText,
  Archive,
  Sun,
  CalendarDays,
} from "lucide-react";
import StatCard from "@/app/components/StatCard";
export default function DashboardPage() {
  const [jam, setJam] = useState("");
  const [tanggal, setTanggal] = useState("");

  useEffect(() => {
    const updateJam = () => {
      const now = new Date();

      setJam(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );

      setTanggal(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };

    updateJam();

    const interval = setInterval(updateJam, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">

      {/* CARD UTAMA */}
      <div className="bg-white rounded-3xl shadow-xl p-6">

        <div className="flex flex-col md:flex-row items-center gap-6">

          {/* Logo */}
          <Image
            src="/logoimipas.png"
            alt="Logo"
            width={90}
            height={90}
            className="rounded-2xl"
          />

          {/* Informasi */}
          <div className="flex-1 text-center md:text-left">

            <h1 className="text-3xl font-black text-blue-900">
              SIMASDI
            </h1>

            <p className="text-slate-700">
              Balai Pemasyarakatan
            </p>

            <p className="text-slate-700">
              Kelas I Jakarta Barat
            </p>

            <h2 className="mt-4 text-2xl font-bold text-blue-700">
              Selamat Pagi, Fabry Farisi Punandio
            </h2>

          </div>

          {/* Icon */}
          <div className="hidden md:flex w-16 h-16 rounded-2xl bg-blue-50 items-center justify-center">
            <Sun size={34} className="text-blue-600" />
          </div>

        </div>

        <div className="border-t mt-6 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">

          <div>

            <h2 className="text-5xl font-black tracking-wider">
              {jam}
            </h2>

          </div>

          <div className="flex items-center gap-2 text-slate-600">

            <CalendarDays className="text-blue-600" />

            <span className="font-semibold">
              {tanggal}
            </span>

          </div>

        </div>

      </div>
      {/* Tombol */}
      <div className="grid grid-cols-2 gap-4">

        <button
          className="
            rounded-2xl
            bg-blue-600
            hover:bg-blue-700
            text-white
            p-5
            shadow-lg
            transition
            flex
            items-center
            justify-center
            gap-3
          "
        >
          <RefreshCcw size={28} />

          <div className="text-left">

            <div className="font-bold text-lg">
              Perbarui Data
            </div>

            <div className="text-sm opacity-90">
              Sinkronisasi data
            </div>

          </div>

        </button>

        <button
          className="
            rounded-2xl
            bg-red-600
            hover:bg-red-700
            text-white
            p-5
            shadow-lg
            transition
            flex
            items-center
            justify-center
            gap-3
          "
        >
          <Printer size={28} />

          <div className="text-left">

            <div className="font-bold text-lg">
              Cetak PDF
            </div>

            <div className="text-sm opacity-90">
              Export laporan
            </div>

          </div>

        </button>

      </div>

      {/* Ringkasan */}
      <div className="flex items-center justify-between">

        <h2 className="text-2xl font-bold text-slate-800">
          Ringkasan Data
        </h2>

        <button className="text-blue-600 font-semibold">
          Lihat Semua →
        </button>

      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 gap-4">

        <StatCard
          title="Surat Masuk"
          value="5"
          subtitle="Data terbaru"
          color="blue"
          icon={<Inbox size={28} />}
        />

        <StatCard
          title="Surat Keluar"
          value="2"
          subtitle="Total surat"
          color="purple"
          icon={<Send size={28} />}
        />

        <StatCard
          title="Disposisi"
          value="3"
          subtitle="Menunggu"
          color="orange"
          icon={<FileText size={28} />}
        />

        <StatCard
          title="Arsip"
          value="12"
          subtitle="Dokumen"
          color="green"
          icon={<Archive size={28} />}
        />

      </div>

    </div>
  );
}