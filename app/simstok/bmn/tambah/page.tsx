"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function TambahBMNPage() {
  const searchParams = useSearchParams();
  const ruanganId = searchParams.get("ruangan");

  const [kodeBarang, setKodeBarang] = useState("");
  const [nup, setNup] = useState("");
  const [namaBarang, setNamaBarang] = useState("");

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Tambah BMN
      </h1>

      <div className="bg-white rounded-xl shadow p-6 max-w-3xl">

        <p className="text-gray-600 mb-6">
          ID Ruangan: {ruanganId}
        </p>

        <div className="grid md:grid-cols-2 gap-5">

          <div>
            <label className="block font-semibold mb-2">
              Kode Barang
            </label>

            <input
              type="text"
              value={kodeBarang}
              onChange={(e) => setKodeBarang(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Contoh: 3010101001"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              NUP
            </label>

            <input
              type="text"
              value={nup}
              onChange={(e) => setNup(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Masukkan NUP"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold mb-2">
              Nama Barang
            </label>
<div>
  <label className="block font-semibold mb-2">
    Kondisi
  </label>

  <select
    className="w-full border rounded-lg px-4 py-2"
  >
    <option value="">Pilih Kondisi</option>
    <option value="Baik">Baik</option>
    <option value="Rusak Ringan">Rusak Ringan</option>
    <option value="Rusak Berat">Rusak Berat</option>
  </select>
</div>
            <input
              type="text"
              value={namaBarang}
              onChange={(e) => setNamaBarang(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Contoh: Laptop Lenovo"
            />
          </div>

        </div>

      </div>
    </div>
  );
}