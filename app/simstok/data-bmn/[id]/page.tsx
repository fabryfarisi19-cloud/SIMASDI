"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Pencil, ArrowRightLeft, Trash2 } from "lucide-react";
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


async function hapusBarang() {
  if (!barang) return;

  const kendaraan =
    barang.kategori === "Kendaraan Dinas";

  // ==============================
  // KONFIRMASI
  // ==============================
  const pesan = kendaraan
    ? `⚠️ HAPUS KENDARAAN DINAS

Nama:
${barang.nama_barang || "-"}

Nomor Polisi:
${barang.nomor_polisi || "-"}

Nomor Rangka:
${barang.nomor_rangka || "-"}

Data kendaraan akan dihapus permanen.

Lanjutkan?`
    : `Hapus barang:

${barang.nama_barang || "-"}

Data akan dihapus permanen.

Lanjutkan?`;

  if (!window.confirm(pesan)) {
    return;
  }

  // ==============================
  // KONFIRMASI KEDUA
  // ==============================
  if (kendaraan) {
    const kode = window.prompt(
      `Ketik HAPUS untuk menghapus kendaraan:

${barang.nama_barang || "-"}
${barang.nomor_polisi || "-"}`
    );

    if (kode !== "HAPUS") {
      window.alert("Penghapusan dibatalkan.");
      return;
    }
  }

  // ==============================
  // HAPUS DATA
  // ==============================
  try {
    console.log("MULAI HAPUS BMN");
    console.log("ID:", barang.id);
    console.log("Nama:", barang.nama_barang);
    console.log("Kategori:", barang.kategori);

 const { error } = await supabase
  .from("barang")
  .delete()
  .eq("id", barang.id);

console.log("ERROR DELETE:", error);

if (error) {
  alert(
    `GAGAL MENGHAPUS DATA\n\n${error.message}`
  );
  return;
}
   
    // ==============================
    // HAPUS FOTO
    // ==============================
    if (barang.foto) {
      try {
        const url = new URL(barang.foto);

        const marker =
          "/storage/v1/object/public/barang/";

        const index =
          url.pathname.indexOf(marker);

        if (index !== -1) {
          const namaFile =
            decodeURIComponent(
              url.pathname.substring(
                index + marker.length
              )
            );

          if (namaFile) {
            const { error: fotoError } =
              await supabase.storage
                .from("barang")
                .remove([namaFile]);

            if (fotoError) {
              console.warn(
                "Foto tidak terhapus:",
                fotoError.message
              );
            }
          }
        }
      } catch (errorFoto) {
        console.warn(
          "Foto tidak dapat diproses:",
          errorFoto
        );
      }
    }

    alert(
      kendaraan
        ? "✅ Kendaraan Dinas berhasil dihapus."
        : "✅ Barang BMN berhasil dihapus."
    );

    window.location.href =
      "/simstok/data-bmn";

  } catch (error: any) {
    console.error(
      "ERROR HAPUS:",
      error
    );

    alert(
      "Terjadi kesalahan:\n\n" +
      (error?.message || error)
    );
  }
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
<button
  type="button"
  onClick={hapusBarang}
  className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
  title="Hapus"
>
  <Trash2 size={18} />
</button>

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