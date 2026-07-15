"use client";

import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
export default function DataBMNPage() {
    const [barang, setBarang] = useState<any[]>([]);
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
  return (
    <main>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">

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
  className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl flex items-center gap-2"
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
        placeholder="Cari Barang..."
        className="w-full border rounded-xl pl-12 pr-4 py-3"
      />

    </div>

    <select className="border rounded-xl px-4 py-3">
      <option>Semua Kondisi</option>
      <option>Baik</option>
      <option>Rusak Ringan</option>
      <option>Rusak Berat</option>
    </select>
<select className="border rounded-xl px-4 py-3">
  <option>Semua Ruangan</option>
  <option>Subbag TU</option>
  <option>Ruang Kepala Bapas</option>
  <option>Ruang PK</option>
  <option>Ruang Umum</option>
  <option>Gudang</option>
</select>
  </div>

</div>

      {/* Table */}
      <div className="overflow-x-auto rounded-3xl shadow-lg">

<table className="min-w-[760px] w-full bg-white">

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

</tr>

</thead>

         <tbody>

{barang.map((item)=>(

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

<span className="px-3 py-1 rounded-full bg-green-500 text-white text-xs">

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