"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
export default function TambahRuanganPage() {
const [kodeRuangan, setKodeRuangan] = useState("");  
const [namaRuangan, setNamaRuangan] = useState("");  
const [lantai, setLantai] = useState("");
const router = useRouter();
async function simpanRuangan() {
  if (!kodeRuangan || !namaRuangan || !lantai) {
    alert("Semua field harus diisi.");
    return;
  }

  const { error } = await supabase
    .from("ruangan")
    .insert([
      {
        kode_ruangan: kodeRuangan,
        nama_ruangan: namaRuangan,
        lantai: lantai,
      },
    ]);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Ruangan berhasil ditambahkan.");

  router.push("/simstok/ruangan");
}
  return (
   <div className="p-8 max-w-xl">

  <h1 className="text-3xl font-bold mb-6">
    Tambah Ruangan
  </h1>

  <div className="space-y-4">

    <div>
      <label className="block mb-2 font-medium">
        Kode Ruangan
      </label>

      <input
        type="text"
        value={kodeRuangan}
        onChange={(e) => setKodeRuangan(e.target.value)}
        className="w-full border rounded-lg px-4 py-2"
        placeholder="Contoh: R009"
      />
    </div>
<div>
  <label className="block mb-2 font-medium">
    Nama Ruangan
  </label>

  <input
    type="text"
    value={namaRuangan}
    onChange={(e) => setNamaRuangan(e.target.value)}
    className="w-full border rounded-lg px-4 py-2"
    placeholder="Contoh: Ruang Arsip"
  />
  <div>
  <label className="block mb-2 font-medium">
    Lantai
  </label>

  <select
    value={lantai}
    onChange={(e) => setLantai(e.target.value)}
    className="w-full border rounded-lg px-4 py-2"
  >
    <option value="">Pilih Lantai</option>
    <option value="1">Lantai 1</option>
    <option value="2">Lantai 2</option>
    <option value="3">Lantai 3</option>
  </select>
</div>
</div>
  </div>
<div className="pt-4 flex gap-3">

<button
  onClick={simpanRuangan}
  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
>
  Simpan
</button>

 <button
  onClick={() => router.push("/simstok/ruangan")}
  className="bg-gray-200 hover:bg-gray-300 px-6 py-2 rounded-lg"
>
  Batal
</button>

</div>
</div>

  );
}