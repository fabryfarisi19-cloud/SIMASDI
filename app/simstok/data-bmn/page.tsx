"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  QrCode,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function DataBMNPage() {
    const [barang, setBarang] = useState<any[]>([]);
const [search, setSearch] = useState("");  
const [filterKondisi, setFilterKondisi] = useState("");  
const [filterRuangan, setFilterRuangan] = useState("");
    useEffect(() => {
  getBarang();
}, []);

async function getBarang() {
  const { data, error } = await supabase
    .from("barang")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  setBarang(data || []);
}

async function hapusBarang(id: number) {
  const konfirmasi = confirm(
    "Apakah Anda yakin ingin menghapus data BMN ini?"
  );

  if (!konfirmasi) return;

  const { error } = await supabase
    .from("barang")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  getBarang();
}
const barangFilter = barang.filter((item) => {
  const cocokSearch =
    item.nama_barang
      ?.toLowerCase()
      .includes(search.toLowerCase()) ||
    item.kode_barang
      ?.toLowerCase()
      .includes(search.toLowerCase());

  const cocokKondisi =
    filterKondisi === "" ||
    item.kondisi === filterKondisi;

  const cocokRuangan =
    filterRuangan === "" ||
    item.ruangan === filterRuangan;

  return cocokSearch && cocokKondisi && cocokRuangan;
});
  return (
    <main>

      {/* Header */}
  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

        <div>
          <h1 className="text-4xl font-bold text-blue-900">
            Data BMN
          </h1>

          <p className="text-slate-500 mt-2">
            Daftar Barang Milik Negara
          </p>
        </div>
<Link
  href="/simstok/data-bmn/tambah"
  className="w-full md:w-auto justify-center bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl flex items-center gap-2"
>
  <Plus size={20} />
  Tambah Barang
</Link>

      </div>

      {/* Filter */}
     <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

    <div className="relative flex-1 max-w-md">

      <Search
        size={20}
        className="absolute left-4 top-4 text-slate-400"
      />

   <input
  type="text"
  placeholder="Cari Barang..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="w-full border rounded-xl pl-12 pr-4 py-3"
/>

    </div>

  <select
  value={filterKondisi}
  onChange={(e) => setFilterKondisi(e.target.value)}
  className="border rounded-xl px-4 py-3"
>
  <option value="">Semua Kondisi</option>
  <option value="Baik">Baik</option>
  <option value="Rusak Ringan">Rusak Ringan</option>
  <option value="Rusak Berat">Rusak Berat</option>
</select>
<select
  value={filterRuangan}
  onChange={(e) => setFilterRuangan(e.target.value)}
  className="border rounded-xl px-4 py-3"
>
  <option value="">Semua Ruangan</option>
  <option value="Subbag TU">Subbag TU</option>
  <option value="Ruang Kepala Bapas">Ruang Kepala Bapas</option>
  <option value="Ruang PK">Ruang PK</option>
  <option value="Ruang Umum">Ruang Umum</option>
  <option value="Gudang">Gudang</option>
</select>
  </div>

</div>

      {/* Table */}
   <div className="w-full overflow-x-auto rounded-3xl shadow-lg">

<table className="w-full min-w-[760px] bg-white">

    <thead className="bg-blue-600 text-white">

<tr>

<th className="px-3 py-4 text-left w-[90px]">
Kode
</th>

<th className="px-3 py-4 text-left min-w-[180px]">
Nama Barang
</th>

<th className="px-3 py-4 text-center w-[120px]">
Ruangan
</th>

<th className="px-3 py-4 text-center w-[90px]">
Kondisi
</th>

<th className="px-3 py-4 text-center w-[70px]">
Jumlah
</th>
<th className="px-3 py-4 text-center w-[180px]">
  Aksi
</th>
</tr>

</thead>

         <tbody>

{barangFilter.map((item) => (

<tr
key={item.id}
className="border-b hover:bg-slate-50"
>

<td className="px-3 py-4 whitespace-nowrap">
{item.kode_barang}
</td>

<td className="px-3 py-4">
<div className="font-semibold">
{item.nama_barang}
</div>
</td>

<td className="px-3 py-4 text-center">
{item.ruangan}
</td>

<td className="px-3 py-4 text-center">
<span
  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
    item.kondisi === "Baik"
      ? "bg-green-100 text-green-700"
      : item.kondisi === "Rusak Ringan"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700"
  }`}
>
  <span
    className={`w-2 h-2 rounded-full mr-2 ${
      item.kondisi === "Baik"
        ? "bg-green-500"
        : item.kondisi === "Rusak Ringan"
        ? "bg-yellow-500"
        : "bg-red-500"
    }`}
  />
  {item.kondisi}
</span>

</td>

<td className="px-3 py-4 text-center font-bold">
{item.jumlah}
</td>

</tr>

))}

</tbody>
        </table>

      </div>

    </main>
  );
}