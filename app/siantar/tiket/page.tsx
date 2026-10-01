
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function TiketContent() {
  const params = useSearchParams();

  const nomor = params.get("nomor") || "-";
  const layanan = params.get("layanan") || "-";

  const [tanggal, setTanggal] = useState("");
  const [jam, setJam] = useState("");

  useEffect(() => {
    const sekarang = new Date();

    setTanggal(
      sekarang.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    );

    setJam(
      sekarang.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
  }, []);

  return (
    <>
      <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4 print:bg-white print:p-0">
        <div className="bg-white shadow-xl rounded-2xl p-10 w-[420px] print:shadow-none print:rounded-none print:w-full print:max-w-[80mm] print:p-4">

          {/* HEADER */}
          <h1 className="text-center text-3xl font-bold text-blue-700 print:text-black">
            SIAP
          </h1>

          <p className="text-center text-slate-500 text-sm mt-1">
            Balai Pemasyarakatan Kelas I Jakarta Barat
          </p>

          <hr className="my-6 border-slate-300" />

          {/* NOMOR ANTREAN */}
          <p className="text-center text-lg text-slate-600">
            Nomor Antrean
          </p>

          <h2 className="text-center text-7xl font-black my-6 tracking-wider">
            {nomor}
          </h2>

          {/* DETAIL */}
          <div className="space-y-2 text-lg">
            <p>
              <b>Layanan :</b> {layanan}
            </p>

            <p>
              <b>Tanggal :</b> {tanggal || "Memuat..."}
            </p>

            <p>
              <b>Jam :</b> {jam || "Memuat..."}
            </p>
          </div>

          {/* INFORMASI */}
          <div className="mt-8 text-center text-slate-600 text-sm leading-relaxed">
            Silakan menunggu hingga nomor Anda dipanggil.
          </div>

          {/* TOMBOL CETAK */}
          <button
            type="button"
            onClick={() => window.print()}
            className="mt-8 w-full bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-xl text-xl font-bold print:hidden"
          >
            🖨 Cetak Tiket
          </button>

        </div>
      </main>

      {/* STYLE KHUSUS CETAK */}
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: white;
          }

          body {
            width: 80mm;
          }
        }
      `}</style>
    </>
  );
}

export default function TiketPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-100">
          <div className="text-lg text-slate-600">
            Memuat tiket...
          </div>
        </main>
      }
    >
      <TiketContent />
    </Suspense>
  );
}

