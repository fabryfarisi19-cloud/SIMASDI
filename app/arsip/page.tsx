"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ArsipPage() {

  const [namaDokumen, setNamaDokumen] = useState("");
  const [kategori, setKategori] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [arsipList, setArsipList] = useState<any[]>([]);
  const loadArsip = async () => {
  const { data } = await supabase.storage
    .from("arsip")
    .list();

  setArsipList(data || []);
};
const downloadArsip = async (namaFile: string) => {
    const { data } = supabase.storage
  .from("arsip")
  .getPublicUrl(namaFile);

window.open(data.publicUrl, "_blank");
};
    const hapusArsip = async (namaFile: string) => {
  if (!confirm("Yakin hapus arsip ini?")) return;

  const { error } = await supabase.storage
    .from("arsip")
    .remove([namaFile]);

  if (error) {
    alert(error.message);
    return;
  }
alert("Hapus arsip berhasil");
  loadArsip();
};
 
useEffect(() => {
  loadArsip();
}, []);
const uploadArsip = async () => {
  if (!file) {
    alert("Pilih file dulu");
    return;
  }

  const namaFile = `${Date.now()}-${file.name}`;

console.log("UPLOAD JALAN");
console.log(file);
console.log(namaFile);

const { error } = await supabase.storage
  .from("arsip")
  .upload(namaFile, file);

  if (error) {
  console.log(error);
    alert(error.message);
    return;
  }

  alert("Arsip berhasil diupload");
};
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Arsip Digital
      </h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <input
          type="text"
          placeholder="Nama Dokumen"
          className="w-full border p-2 rounded mb-4"
        />

        <input
          type="text"
          placeholder="Kategori"
          className="w-full border p-2 rounded mb-4"
        />

       <input
  type="file"
  onChange={(e) => {
    console.log(e.target.files?.[0]);
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  }}
  className="w-full border p-2 rounded mb-4"
/>

        <button
  onClick={uploadArsip}
  className="bg-blue-600 text-white px-4 py-2 rounded"
>
  Upload Arsip
</button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow mt-6">
  <h2 className="text-xl font-bold mb-4">
    Daftar Arsip
  </h2>

  <table className="w-full border">
    <thead>
      <tr className="bg-gray-100">
        <th className="border p-2">Nama File</th>
<th className="border p-2">Aksi</th>
      </tr>
    </thead>

    <tbody>
      {arsipList.map((item) => (
        <tr key={item.id}>
         <td className="border p-2">
  {item.name}
</td>

<td className="border p-2">
  <button
    onClick={() => downloadArsip(item.name)}
    className="bg-green-600 text-white px-3 py-1 rounded mr-2"
  >
    Download
  </button>

  <button
    onClick={() => hapusArsip(item.name)}
    className="bg-red-600 text-white px-3 py-1 rounded"
  >
    Hapus
  </button>
</td>

        </tr>
      ))}
    </tbody>
  </table>
</div>
    </div>
  );
}