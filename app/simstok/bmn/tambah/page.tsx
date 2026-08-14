"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function TambahBMNForm() {
  const searchParams = useSearchParams();
  const ruanganId = searchParams.get("ruangan");

  const [kodeBarang, setKodeBarang] = useState("");
  const [nup, setNup] = useState("");
  const [namaBarang, setNamaBarang] = useState("");

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Tambah BMN
      </h1>

      <div className="max-w-3xl rounded-xl bg-white p-6 shadow">

        <p className="mb-6 text-gray-600">
          ID Ruangan: {ruanganId}
        </p>

        <div className="grid gap-5 md:grid-cols-2">

          <div>
            <label className="mb-2 block font-semibold">
              Kode Barang
            </label>

            <input
              type="text"
              value={kodeBarang}
              onChange={(e) => setKodeBarang(e.target.value)}
              className="w-full rounded-lg border px-4 py-2"
              placeholder="Contoh: 3010101001"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              NUP
            </label>

            <input
              type="text"
              value={nup}
              onChange={(e) => setNup(e.target.value)}
              className="w-full rounded-lg border px-4 py-2"
              placeholder="Masukkan NUP"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-semibold">
              Nama Barang
            </label>

            <input
              type="text"
              value={namaBarang}
              onChange={(e) => setNamaBarang(e.target.value)}
              className="w-full rounded-lg border px-4 py-2"
              placeholder="Contoh: Laptop Lenovo"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-semibold">
              Kondisi
            </label>

            <select className="w-full rounded-lg border px-4 py-2">
              <option value="">Pilih Kondisi</option>
              <option value="Baik">Baik</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
            </select>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function TambahBMNPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <p className="text-gray-600">
            Memuat halaman...
          </p>
        </div>
      }
    >
      <TambahBMNForm />
    </Suspense>
  );
}