"use client";

import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const fotoDummy = [
  {
    id: 1,
    judul: "Kegiatan Bapas Jakarta Barat",
    gambar: "/publikasi/foto/foto1.jpg",
  },
  {
    id: 2,
    judul: "Pelayanan Bapas",
    gambar: "/publikasi/foto/foto2.jpg",
  },
  {
    id: 3,
    judul: "Kegiatan Pegawai",
    gambar: "/publikasi/foto/foto3.jpg",
  },
  {
    id: 4,
    judul: "Dokumentasi Kegiatan",
    gambar: "/publikasi/foto/foto4.jpg",
  },
];

export default function FotoPage() {
  const router = useRouter();

  const [fotoTerpilih, setFotoTerpilih] = useState<string | null>(null);

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
            <Camera size={22} />
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Foto
            </h1>

            <p className="text-xs text-slate-500">
              Galeri foto Bapas Kelas I Jakarta Barat
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
              <Camera size={30} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                Galeri Foto
              </h2>

              <p className="mt-1 text-sm text-blue-100">
                Dokumentasi kegiatan Bapas Kelas I Jakarta Barat
              </p>
            </div>

          </div>
        </div>

        {/* GALERI */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {fotoDummy.map((foto) => (

            <button
              key={foto.id}
              onClick={() => setFotoTerpilih(foto.gambar)}
              className="group overflow-hidden rounded-3xl bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >

              {/* FOTO */}
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">

                <img
                  src={foto.gambar}
                  alt={foto.judul}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />

                {/* Placeholder jika foto belum ada */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-slate-200 text-blue-700">
                  <ImageIcon size={40} />
                  <span className="mt-2 text-xs font-semibold">
                    Foto belum tersedia
                  </span>
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">

                  <div className="scale-75 rounded-full bg-white p-3 opacity-0 shadow-lg transition group-hover:scale-100 group-hover:opacity-100">
                    <ImageIcon
                      size={22}
                      className="text-blue-800"
                    />
                  </div>

                </div>

              </div>

              {/* JUDUL */}
              <div className="p-4">

                <h3 className="line-clamp-2 text-sm font-bold text-slate-800">
                  {foto.judul}
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Dokumentasi Bapas
                </p>

              </div>

            </button>

          ))}

        </div>

      </main>

      {/* LIGHTBOX */}
      {fotoTerpilih && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setFotoTerpilih(null)}
        >

          <button
            onClick={() => setFotoTerpilih(null)}
            className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
          >
            <X size={24} />
          </button>

          <img
            src={fotoTerpilih}
            alt="Foto dokumentasi"
            className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

        </div>
      )}

    </div>
  );
}