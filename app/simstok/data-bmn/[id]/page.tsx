"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function DetailBarang({
  params,
}: {
  params: { id: string };
}) {
  const [barang, setBarang] = useState<any>(null);

  useEffect(() => {
    loadBarang();
  }, []);

  async function loadBarang() {
    const { data } = await supabase
      .from("barang")
      .select("*")
      .eq("id", params.id)
      .single();

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

        <Link
          href={`/simstok/data-bmn/edit/${barang.id}`}
          className="bg-amber-500 text-white px-5 py-3 rounded-xl flex gap-2"
        >
          <Pencil size={18} />
          Edit
        </Link>

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
            <Item label="Ruangan" value={barang.ruangan} />
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