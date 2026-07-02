"use client";

import { useState } from "react";
import {
  panggilBerikutnya,
  panggilUlang,
  selesai,
} from "@/lib/siantar";
import { panggilSuara } from "@/app/components/CallSound";

export default function PanelPetugas() {
  const [loket, setLoket] = useState(1);

  const [antrianAktif, setAntrianAktif] = useState<{
    id?: number;
    nomor?: string;
    loket?: number;
  } | null>(null);

 async function panggil() {
  try {
    const hasil = await panggilBerikutnya(loket);

    if (!hasil) {
      alert("Tidak ada antrian yang menunggu.");
      return;
    }

    setAntrianAktif(hasil);

    panggilSuara(hasil.nomor, hasil.loket);

    alert(`Memanggil ${hasil.nomor} ke Loket ${hasil.loket}`);
  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan.");
  }
}

  async function selesaiPelayanan() {
    if (!antrianAktif) return;

    try {
      await selesai(antrianAktif.id!);

      alert("Pelayanan selesai");

      setAntrianAktif(null);
    } catch (err) {
      console.error(err);
      alert("Gagal menyelesaikan pelayanan");
    }
  }
async function ulangiPanggilan() {
  if (!antrianAktif) return;

  try {
    await panggilUlang(antrianAktif.id!);

    panggilSuara(
      antrianAktif.nomor!,
      loket
    );

    alert(`Memanggil ulang ${antrianAktif.nomor}`);
  } catch (err: any) {
    console.error(err);
    alert(err.message || JSON.stringify(err));
  }
}
  return (
    <main className="min-h-screen bg-slate-100 p-10">
      <h1 className="text-4xl font-bold mb-8">
        Panel Petugas
      </h1>

      <div className="bg-white rounded-2xl shadow p-8 max-w-md">
        <label className="block mb-2 font-semibold">
          Pilih Loket
        </label>

        <select
          value={loket}
          onChange={(e) => setLoket(Number(e.target.value))}
          className="border rounded-lg p-3 w-full"
        >
          <option value={1}>Loket 1</option>
          <option value={2}>Loket 2</option>
          <option value={3}>Loket 3</option>
        </select>

        <button
          onClick={panggil}
          className="mt-6 w-full bg-blue-700 text-white py-4 rounded-xl text-xl font-bold"
        >
          🔊 Panggil Berikutnya
        </button>
{antrianAktif && (
  <>
    <button
      onClick={ulangiPanggilan}
      className="mt-4 w-full rounded-xl bg-yellow-500 text-white py-4 text-xl font-bold hover:bg-yellow-600"
    >
      🔁 Panggil Ulang
    </button>

    <button
      onClick={selesaiPelayanan}
      className="mt-4 w-full bg-green-600 text-white py-4 rounded-xl text-xl font-bold"
    >
      ✅ Selesai
    </button>
  </>
)}
      </div>
    </main>
  );
}