"use client";

import {
  ArrowLeft,
  BookOpen,
  Camera,
  CalendarDays,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PublikasiPage() {
  const router = useRouter();

  const menuPublikasi = [
    {
      nama: "Video",
      deskripsi: "Dokumentasi video dan publikasi SIMASDI",
      icon: PlayCircle,
      href: "/publikasi/video",
    },
    {
      nama: "Foto",
      deskripsi: "Dokumentasi foto kegiatan Bapas Jakarta Barat",
      icon: Camera,
      href: "/publikasi/foto",
    },
    {
      nama: "Majalah SIMASDI",
      deskripsi: "Baca majalah digital SIMASDI dengan efek flipbook",
      icon: BookOpen,
      href: "/majalah",
    },
    {
      nama: "Kegiatan",
      deskripsi: "Dokumentasi kegiatan Bapas Jakarta Barat",
      icon: CalendarDays,
      href: "/publikasi/kegiatan",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100">

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">

          <button
            onClick={() => router.back()}
            className="rounded-xl p-2 transition hover:bg-slate-100"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-900 text-white">
            <PlayCircle size={23} />
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Publikasi
            </h1>

            <p className="text-xs text-slate-500">
              Dokumentasi dan informasi Bapas Kelas I Jakarta Barat
            </p>
          </div>

        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-7xl px-4 py-8">

        {/* BANNER */}
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-blue-700 p-7 text-white shadow-xl">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <PlayCircle size={30} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                Publikasi SIMASDI
              </h2>

              <p className="mt-1 text-sm text-blue-100">
                Pusat dokumentasi, informasi, dan publikasi
                Bapas Kelas I Jakarta Barat
              </p>
            </div>

          </div>
        </div>

        {/* MENU */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {menuPublikasi.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >

                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-800 transition group-hover:bg-blue-900 group-hover:text-white">
                  <Icon size={28} />
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {item.nama}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.deskripsi}
                </p>

                <div className="mt-5 text-sm font-semibold text-blue-700">
                  Buka →
                </div>

              </Link>
            );
          })}

        </div>

      </main>
    </div>
  );
}