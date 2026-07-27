"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
export default function EditRuanganPage() {
  const params = useParams();
  const router = useRouter();
const [kodeRuangan, setKodeRuangan] = useState("");
const [namaRuangan, setNamaRuangan] = useState("");
const [lantai, setLantai] = useState("");
useEffect(() => {
  loadData();
}, []);

async function loadData() {
  const { data, error } = await supabase
    .from("ruangan")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  setKodeRuangan(data.kode_ruangan);
  setNamaRuangan(data.nama_ruangan);
  setLantai(data.lantai);
}
async function handleUpdate() {
  const { error } = await supabase
    .from("ruangan")
    .update({
      kode_ruangan: kodeRuangan,
      nama_ruangan: namaRuangan,
      lantai: lantai,
    })
    .eq("id", Number(params.id));

  if (error) {
    alert(error.message);
    return;
  }

 alert("Data berhasil diubah");
router.push("/simstok/ruangan");
}
return (
  <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow">
    <h1 className="text-2xl font-bold mb-6">
      Edit Ruangan
    </h1>

    <div className="mb-4">
      <label className="block mb-2 font-medium">
        Kode Ruangan
      </label>
      <input
        type="text"
        value={kodeRuangan}
        onChange={(e) => setKodeRuangan(e.target.value)}
        className="w-full border rounded-lg p-2"
      />
    </div>

    <div className="mb-4">
      <label className="block mb-2 font-medium">
        Nama Ruangan
      </label>
      <input
        type="text"
        value={namaRuangan}
        onChange={(e) => setNamaRuangan(e.target.value)}
        className="w-full border rounded-lg p-2"
      />
    </div>

    <div className="mb-6">
      <label className="block mb-2 font-medium">
        Lantai
      </label>

      <select
        value={lantai}
        onChange={(e) => setLantai(e.target.value)}
        className="w-full border rounded-lg p-2"
      >
        <option value="">Pilih Lantai</option>
        <option value="Basement">Basement</option>
        <option value="1">Lantai 1</option>
        <option value="2">Lantai 2</option>
        <option value="3">Lantai 3</option>
      </select>
    </div>

    <div className="flex gap-3">
    <button
  onClick={handleUpdate}
  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
>
  Simpan
</button>
    <button
  onClick={() => router.push("/simstok/ruangan")}
  className="bg-gray-500 text-white px-4 py-2 rounded-lg"
>
  Batal
</button>
    </div>
  </div>
);

}