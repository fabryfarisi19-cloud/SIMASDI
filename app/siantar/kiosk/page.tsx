"use client";

import { ambilNomor } from "@/lib/siantar";
import { useRouter } from "next/navigation";

export default function KioskPage() {
 const router = useRouter();

 async function pilihLayanan(kode: string, layanan: string) {
  try {

const nomor = await ambilNomor(kode, layanan);

   router.push(
  `/siantar/tiket?nomor=${nomor}&layanan=${encodeURIComponent(layanan)}`
);
  } catch (err: any) {
    console.error("ERROR SIANTAR:", err);

    alert(
      err?.message ||
      JSON.stringify(err, null, 2) ||
      "Terjadi kesalahan"
    );
  }
}

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
      <div className="max-w-5xl w-full">

        <h1 className="text-5xl font-bold text-center text-blue-800">
          SIAP
        </h1>

        <p className="text-center text-xl text-slate-600 mt-3">
          Silakan Pilih Jenis Layanan
        </p>

        <div className="grid md:grid-cols-2 gap-8 mt-12">

          <button
            onClick={() => pilihLayanan("A", "Administrasi")}
            className="h-36 rounded-3xl bg-blue-600 text-white text-3xl font-bold hover:bg-blue-700"
          >
            📄 Administrasi
          </button>

          <button
            onClick={() => pilihLayanan("B", "Bimbingan Klien")}
            className="h-36 rounded-3xl bg-green-600 text-white text-3xl font-bold hover:bg-green-700"
          >
            👨‍⚖️ Bimbingan Klien
          </button>

          <button
            onClick={() => pilihLayanan("C", "Konsultasi")}
            className="h-36 rounded-3xl bg-orange-500 text-white text-3xl font-bold hover:bg-orange-600"
          >
            💬 Konsultasi
          </button>

          <button
            onClick={() => pilihLayanan("D", "Informasi")}
            className="h-36 rounded-3xl bg-purple-600 text-white text-3xl font-bold hover:bg-purple-700"
          >
            ℹ️ Informasi
          </button>

        </div>

      </div>
    </main>
  );
}