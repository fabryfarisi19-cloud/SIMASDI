"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingSiantar() {
  console.log("HALAMAN SETTING DIMUAT");

  const [runningText, setRunningText] = useState("");
  const [jumlahLoket, setJumlahLoket] = useState(3);
useEffect(() => {
  loadSetting();
}, []);

async function simpanSetting() {
  alert("Tombol Simpan diklik");

  try {
    const { data, error } = await supabase
      .from("setting_siantar")
      .update({
        running_text: runningText,
        jumlah_loket: jumlahLoket,
      })
      .eq("id", 1)
      .select();

    console.log("DATA :", data);
    console.log("ERROR :", error);

 if (error) {
  alert(error.message);
  return;
}

alert("Berhasil disimpan");

await loadSetting();
  } catch (err) {
    console.error(err);
    alert("Terjadi error");
  }
}
async function loadSetting() {
console.log("loadSetting dipanggil");

const { data, error } = await supabase
  .from("setting_siantar")
  .update({
    running_text: runningText,
    jumlah_loket: jumlahLoket,
  })
  .eq("id", 1)
  .select("*");
console.log("UPDATE DATA:", JSON.stringify(data, null, 2));
console.log("UPDATE ERROR:", error);
alert(JSON.stringify(data, null, 2));

  if (error) {
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    alert("Data setting kosong");
    return;
  }

  setRunningText(data[0].running_text ?? "");
  setJumlahLoket(data[0].jumlah_loket ?? 3);
}
return (
    
    <main className="p-8">

      <h1 className="text-4xl font-bold text-slate-800">
        Pengaturan SIANTAR
      </h1>

      <p className="text-slate-500 mt-2">
        Konfigurasi Sistem Informasi Antrian Terintegrasi
      </p>

      <div className="mt-8 bg-white rounded-2xl shadow p-8 space-y-6">

        <div>
          <label className="font-bold block mb-2">
            Running Text
          </label>

         <textarea
  rows={4}
  value={runningText}
  onChange={(e) => setRunningText(e.target.value)}
  className="w-full border rounded-xl p-4"
/>
        </div>

        <div>
          <label className="font-bold block mb-2">
            Jumlah Loket
          </label>

        <select
  value={jumlahLoket}
  onChange={(e) => setJumlahLoket(Number(e.target.value))}
  className="border rounded-xl p-3 w-48"
>
  <option value={1}>1 Loket</option>
  <option value={2}>2 Loket</option>
  <option value={3}>3 Loket</option>
  <option value={4}>4 Loket</option>
</select>
        </div>

     <button
  onClick={simpanSetting}
  className="bg-blue-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800"
>
  Simpan Pengaturan
</button>
      </div>

    </main>
  );
}