"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function TiketContent() {
  const params = useSearchParams();

  const nomor = params.get("nomor");
  const layanan = params.get("layanan");

  const sekarang = new Date();

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white shadow-xl rounded-2xl p-10 w-[420px]">

        <h1 className="text-center text-3xl font-bold text-blue-700">
          SIAP
        </h1>

        <p className="text-center text-slate-500">
          Balai Pemasyarakatan Kelas I Jakarta Barat
        </p>

        <hr className="my-6" />

        <p className="text-center text-lg">
          Nomor Antrean
        </p>

        <h2 className="text-center text-7xl font-black my-6">
          {nomor}
        </h2>

        <div className="space-y-2 text-lg">
          <p><b>Layanan :</b> {layanan}</p>
          <p><b>Tanggal :</b> {sekarang.toLocaleDateString("id-ID")}</p>
          <p><b>Jam :</b> {sekarang.toLocaleTimeString("id-ID")}</p>
        </div>

        <div className="mt-8 text-center text-slate-600">
          Silakan menunggu hingga nomor Anda dipanggil.
        </div>

        <button
          onClick={() => window.print()}
          className="mt-8 w-full bg-blue-700 text-white py-4 rounded-xl text-xl font-bold"
        >
          🖨 Cetak Tiket
        </button>

      </div>
    </main>
  );
}

export default function TiketPage() {
  return (
    <Suspense fallback={<div>Memuat...</div>}>
      <TiketContent />
    </Suspense>
  );
}