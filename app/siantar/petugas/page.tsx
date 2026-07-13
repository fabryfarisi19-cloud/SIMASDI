"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  panggilBerikutnya,
  panggilUlang,
  selesai,
} from "@/lib/siantar";
import { panggilVoice } from "@/app/components/VoiceEngine";

export default function PanelPetugas() {
  const [loket, setLoket] = useState(1);

  const [antrianAktif, setAntrianAktif] = useState<{
    
    id?: number;
    nomor?: string;
    loket?: number;
  } | null>(null);
const [menunggu, setMenunggu] = useState<any[]>([]);

 async function panggil() {
  try {
    const hasil = await panggilBerikutnya(loket);

    if (!hasil) {
      alert("Tidak ada antrian yang menunggu.");
      return;
    }

    setAntrianAktif(hasil);
loadMenunggu();
console.log("SEBELUM PANGGIL SUARA");

await panggilVoice(hasil.nomor, hasil.loket);

console.log("SESUDAH PANGGIL SUARA");

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
      loadMenunggu();
    } catch (err) {
      console.error(err);
      alert("Gagal menyelesaikan pelayanan");
    }
  }
async function ulangiPanggilan() {
  if (!antrianAktif) return;

  try {
    await panggilUlang(antrianAktif.id!);

  await panggilVoice(
  antrianAktif.nomor!,
  loket
);
    alert(`Memanggil ulang ${antrianAktif.nomor}`);
  } catch (err: any) {
    console.error(err);
    alert(err.message || JSON.stringify(err));
  }
}
useEffect(() => {
  loadMenunggu();
}, []);

async function loadMenunggu() {
  const hariIni = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("antrian")
    .select("nomor")
    .eq("tanggal", hariIni)
    .eq("status", "MENUNGGU")
    .order("id")
    .limit(5);

  setMenunggu(data || []);
}
  return (
<main className="min-h-screen bg-slate-100 pt-24 md:pt-28 px-6 md:px-10 pb-10">
      <h1 className="text-4xl font-bold mb-8">
        Panel Petugas
      </h1>

    <div className="grid lg:grid-cols-2 gap-8">
<div className="bg-white rounded-2xl shadow p-8">

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
{antrianAktif && (
  <div className="mt-6 rounded-2xl bg-blue-50 border border-blue-200 p-6">

    <p className="text-slate-500 text-sm">
      Sedang Dilayani
    </p>

    <h2 className="text-5xl font-black text-blue-700 mt-2">
      {antrianAktif.nomor}
    </h2>

    <p className="mt-3 text-lg font-semibold">
      Loket {loket}
    </p>

  </div>
)}
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

      {/* Panel Antrean Menunggu */}
      <div className="bg-white rounded-2xl shadow p-8">

        <h2 className="text-2xl font-bold mb-5">
          📋 Antrean Menunggu
        </h2>

        {menunggu.length === 0 ? (
          <p className="text-slate-500">
            Tidak ada antrean menunggu.
          </p>
        ) : (
          <div className="space-y-3">
            {menunggu.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl bg-slate-100 p-4"
              >
                <span className="text-xl font-bold">
                  {item.nomor}
                </span>

                <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
                  Menunggu
                </span>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>

    </main>
  );
}