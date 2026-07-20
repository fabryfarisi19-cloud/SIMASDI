"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Save, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function TambahBMN() {
  const [loading, setLoading] = useState(false);

  const [kodeBarang, setKodeBarang] = useState("");
  const [namaBarang, setNamaBarang] = useState("");
  const [kategori, setKategori] = useState("");
  const [merk, setMerk] = useState("");
  const [nup, setNup] = useState("");
  const [ruangan, setRuangan] = useState("");
  const [penanggungJawab, setPenanggungJawab] = useState("");
  const [kondisi, setKondisi] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [nilaiPerolehan, setNilaiPerolehan] = useState(0);
  const [tahunPerolehan, setTahunPerolehan] = useState(
    new Date().getFullYear()
  );

  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  function pilihFoto(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];

  if (!file) return;

  setFoto(file);

  setPreview(URL.createObjectURL(file));
}
async function simpanBarang() {
  if (!kodeBarang || !namaBarang) {
    alert("Kode Barang dan Nama Barang wajib diisi.");
    return;
  }

  setLoading(true);

  try {
    let fotoUrl = "";

    // Upload Foto
    <div className="mt-8">

  <label className="font-semibold block mb-2">
    Foto Barang
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={pilihFoto}
    className="w-full border rounded-xl p-3"
  />

  {preview && (
    <div className="mt-5">
      <Image
        src={preview}
        alt="Preview"
        width={250}
        height={250}
        className="rounded-xl border object-cover"
      />
    </div>
  )}

</div>

    // Simpan ke database
    const { error } = await supabase
      .from("barang")
      .insert({
        kode_barang: kodeBarang,
        nama_barang: namaBarang,
        kategori: kategori,
        merk: merk,
        nup: nup,
        ruangan: ruangan,
        penanggung_jawab: penanggungJawab,
        kondisi: kondisi,
        jumlah: jumlah,
        nilai_perolehan: nilaiPerolehan,
        tahun_perolehan: tahunPerolehan,
        foto: fotoUrl,
      });

    if (error) {
      throw error;
    }

    alert("Barang berhasil disimpan.");

    // Reset Form
    setKodeBarang("");
    setNamaBarang("");
    setKategori("");
    setMerk("");
    setNup("");
    setRuangan("");
    setPenanggungJawab("");
    setKondisi("");
    setJumlah(1);
    setNilaiPerolehan(0);
    setTahunPerolehan(new Date().getFullYear());
    setFoto(null);
    setPreview("");
  } catch (err: any) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
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
    <label className="font-semibold">Kode Barang</label>
    <input
      value={kodeBarang}
      onChange={(e)=>setKodeBarang(e.target.value)}
      className="w-full border rounded-xl p-3 mt-2"
    />
  </div>

  <div>
    <label className="font-semibold">Nama Barang</label>
    <input
      value={namaBarang}
      onChange={(e)=>setNamaBarang(e.target.value)}
      className="w-full border rounded-xl p-3 mt-2"
    />
  </div>

  <div>
    <label className="font-semibold">Kategori</label>
    <select
      value={kategori}
      onChange={(e)=>setKategori(e.target.value)}
      className="w-full border rounded-xl p-3 mt-2"
    >
      <option value="">Pilih Kategori</option>
      <option>Tanah</option>
      <option>Gedung dan Bangunan</option>
      <option>Peralatan dan Mesin</option>
      <option>Jaringan</option>
      <option>Aset Tetap Lainnya</option>
    </select>
  </div>

  <div>
    <label className="font-semibold">Merk / Tipe</label>
    <input
      value={merk}
      onChange={(e)=>setMerk(e.target.value)}
      className="w-full border rounded-xl p-3 mt-2"
    />
  </div>

  <div>
    <label className="font-semibold">Nomor Register (NUP)</label>
    <input
      value={nup}
      onChange={(e)=>setNup(e.target.value)}
      className="w-full border rounded-xl p-3 mt-2"
    />
  </div>

  <div>
    <label className="font-semibold">Ruangan</label>
    <input
      value={ruangan}
      onChange={(e)=>setRuangan(e.target.value)}
      className="w-full border rounded-xl p-3 mt-2"
    />
  </div>

  <div>
    <label className="font-semibold">Penanggung Jawab</label>
    <input
      value={penanggungJawab}
      onChange={(e)=>setPenanggungJawab(e.target.value)}
      className="w-full border rounded-xl p-3 mt-2"
    />
  </div>

  <div>
    <label className="font-semibold">Kondisi</label>
    <select
      value={kondisi}
      onChange={(e)=>setKondisi(e.target.value)}
      className="w-full border rounded-xl p-3 mt-2"
    >
      <option value="">Pilih Kondisi</option>
      <option>Baik</option>
      <option>Rusak Ringan</option>
      <option>Rusak Berat</option>
    </select>
  </div>

  <div>
    <label className="font-semibold">Jumlah</label>
    <input
      type="number"
      value={jumlah}
      onChange={(e)=>setJumlah(Number(e.target.value))}
      className="w-full border rounded-xl p-3 mt-2"
    />
  </div>

  <div>
    <label className="font-semibold">Nilai Perolehan</label>
    <input
      type="number"
      value={nilaiPerolehan}
      onChange={(e)=>setNilaiPerolehan(Number(e.target.value))}
      className="w-full border rounded-xl p-3 mt-2"
    />
  </div>

  <div>
    <label className="font-semibold">Tahun Perolehan</label>
    <input
      type="number"
      value={tahunPerolehan}
      onChange={(e)=>setTahunPerolehan(Number(e.target.value))}
      className="w-full border rounded-xl p-3 mt-2"
    />
  </div>

</div>

        <div className="mt-8">

      <button
  onClick={simpanBarang}
  disabled={loading}
  className="mt-8 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl flex items-center gap-3"
>
  <Save size={20} />

  {loading ? "Menyimpan..." : "Simpan Barang"}
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