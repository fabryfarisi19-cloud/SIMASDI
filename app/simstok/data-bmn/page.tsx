"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
export default function DataBMNPage() {
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

  <div className="flex flex-wrap gap-4 items-center">

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
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

        <table className="w-full">

          <thead className="bg-blue-700 text-white">

            <tr>

              <th className="p-4">Kode</th>

              <th>Nama Barang</th>

              <th>Ruangan</th>

              <th>Kondisi</th>

              <th>Jumlah</th>

              <th>Nilai</th>

              <th>Aksi</th>

            </tr>

          </thead>

          <tbody>

            <tr className="border-b">

              <td className="p-4">
                3010101001
              </td>

              <td>Laptop Lenovo ThinkPad</td>

              <td>Subbag TU</td>

              <td>
                <span className="bg-green-600 text-white px-3 py-1 rounded-full">
                  Baik
                </span>
              </td>

              <td>5</td>

              <td>Rp18.500.000</td>

              <td className="text-blue-700 font-semibold">
                Edit
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </main>
  );
}