"use client";

import { Save, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function TambahBMN() {
 const [kodeBarang, setKodeBarang] = useState("");
const [namaBarang, setNamaBarang] = useState("");   
async function simpanBarang() {
  const { error } = await supabase
    .from("barang")
    .insert({
      kode_barang: kodeBarang,
      nama_barang: namaBarang,
    });

if (error) {
  console.log(error);
  alert(error.message);
  return;
}
  alert("Barang berhasil disimpan.");

  setKodeBarang("");
  setNamaBarang("");
}
  return (
    <main>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">

        <div>
          <h1 className="text-4xl font-bold text-blue-900">
            Tambah Barang BMN
          </h1>

          <p className="text-slate-500 mt-2">
            Input data Barang Milik Negara
          </p>
        </div>

        <Link
          href="/simstok/data-bmn"
          className="flex items-center gap-2 bg-slate-200 px-5 py-3 rounded-xl"
        >
          <ArrowLeft size={18} />
          Kembali
        </Link>

      </div>

      <div className="bg-white rounded-3xl shadow-lg p-8">

        <div className="grid md:grid-cols-2 gap-6">

         <div>
  <label className="font-semibold">
    Kode Barang
  </label>

  <input
    type="text"
    value={kodeBarang}
    onChange={(e) => setKodeBarang(e.target.value)}
    className="w-full border rounded-xl p-3 mt-2"
  />
</div>
       <div>
  <label className="font-semibold">
    Nama Barang
  </label>

  <input
    type="text"
    value={namaBarang}
    onChange={(e) => setNamaBarang(e.target.value)}
    className="w-full border rounded-xl p-3 mt-2"
  />
</div>
         <div>
  <label className="font-semibold">
    Kategori
  </label>

  <select className="w-full border rounded-xl p-3 mt-2">
    <option>Pilih Kategori</option>
    <option>Tanah</option>
    <option>Gedung dan Bangunan</option>
    <option>Peralatan dan Mesin</option>
    <option>Jaringan</option>
    <option>Aset Tetap Lainnya</option>
  </select>
</div>
          <Input label="Merk / Tipe" />
          <Input label="Nomor Register (NUP)" />
          <Input label="Ruangan" />
          <Input label="Penanggung Jawab" />
          <Input label="Kondisi" />
          <Input label="Jumlah" type="number" />
          <Input label="Nilai Perolehan" type="number" />
          <Input label="Tahun Perolehan" type="number" />

          <div className="md:col-span-2">
            <label className="font-semibold">
              Foto Barang
            </label>

            <input
              type="file"
              className="w-full border rounded-xl p-3 mt-2"
            />
          </div>

        </div>

        <div className="mt-8">

       <button
  type="button"
  onClick={simpanBarang}
  className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-4 rounded-xl flex items-center gap-2"
>
  <Save size={20} />
  Simpan Barang
</button>

        </div>

      </div>

    </main>
  );
}

function Input({
  label,
  type = "text",
}: {
  label: string;
  type?: string;
}) {
    
  return (
    <div>

      <label className="font-semibold">
        {label}
      </label>

      <input
        type={type}
        className="w-full border rounded-xl p-3 mt-2"
      />

    </div>
  );
}