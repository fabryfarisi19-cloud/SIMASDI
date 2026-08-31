"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Pencil, ArrowRightLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

import { useParams } from "next/navigation";

export default function DetailBarang() {

  const params = useParams();
  const [barang, setBarang] = useState<any>(null);

  useEffect(() => {
    loadBarang();
  }, []);

  async function loadBarang() {
  const { data, error } = await supabase
  .from("barang")
  .select("*")
 .eq("id", Number(params.id))
  .single();

if (error) {
  alert(error.message);
  return;
}

setBarang(data);
  }

  if (!barang) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <main className="max-w-6xl mx-auto p-8">

      <div className="flex justify-between items-center mb-8">

        <Link
          href="/simstok/data-bmn"
          className="flex items-center gap-2 bg-slate-200 px-5 py-3 rounded-xl"
        >
          <ArrowLeft size={18} />
          Kembali
        </Link>

       <div className="flex gap-2">

  <Link
    href={`/simstok/mutasi/tambah?barang=${barang.id}`}
    className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl flex gap-2"
  >
    <ArrowRightLeft size={18} />
    Mutasi BMN
  </Link>

  <Link
    href={`/simstok/data-bmn/edit/${barang.id}`}
    className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-xl flex gap-2"
  >
    <Pencil size={18} />
    Edit
  </Link>

</div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-8">

        <div className="grid md:grid-cols-2 gap-10">

          <div>
            {barang.foto ? (
              <Image
                src={barang.foto}
                alt={barang.nama_barang}
                width={500}
                height={500}
                className="rounded-xl border"
              />
            ) : (
              <div className="h-80 border rounded-xl flex items-center justify-center">
                Tidak ada foto
              </div>
            )}
          </div>

          <div className="space-y-4">

            <Item label="Kode Barang" value={barang.kode_barang} />
            <Item label="Nama Barang" value={barang.nama_barang} />
            <Item label="Kategori" value={barang.kategori} />
            <Item label="Merk" value={barang.merk} />
            <Item label="NUP" value={barang.nup} />
          {barang.kategori !== "Kendaraan Dinas" && (
  <Item
    label="Ruangan"
    value={barang.ruangan}
  />
)}
            <Item
              label="Penanggung Jawab"
              value={barang.penanggung_jawab}
            />
            <Item label="Kondisi" value={barang.kondisi} />
            <Item label="Jumlah" value={barang.jumlah} />
            <Item
              label="Nilai Perolehan"
              value={barang.nilai_perolehan}
            />
            <Item
              label="Tahun Perolehan"
              value={barang.tahun_perolehan}
            />
{barang.kategori === "Kendaraan Dinas" && (
  <div className="md:col-span-2 mt-6 border-2 border-blue-100 rounded-2xl p-6 bg-blue-50">

    <h2 className="text-xl font-bold text-blue-900 mb-6">
      🚗 Data Kendaraan Dinas
    </h2>

    <div className="grid md:grid-cols-2 gap-5">

      <Item
        label="Jenis Kendaraan"
        value={barang.jenis_kendaraan}
      />

      <Item
        label="Nomor Polisi"
        value={barang.nomor_polisi}
      />

      <Item
        label="Nomor BPKB"
        value={barang.nomor_bpkb}
      />

      <Item
        label="Nomor STNK"
        value={barang.nomor_stnk}
      />

      <Item
        label="Nomor Rangka"
        value={barang.nomor_rangka}
      />

      <Item
        label="Nomor Mesin"
        value={barang.nomor_mesin}
      />

      <Item
        label="Tahun Pembuatan"
        value={barang.tahun_pembuatan}
      />

      <Item
        label="Warna"
        value={barang.warna}
      />

      <Item
        label="Status Kendaraan"
        value={barang.status_kendaraan}
      />

    </div>

  </div>
)}
          </div>

        </div>

      </div>

    </main>
  );
}

function Item({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-lg font-semibold">
        {value || "-"}
      </div>
    </div>
  );
}