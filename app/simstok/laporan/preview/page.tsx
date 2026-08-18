"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function PreviewLaporanBMN() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
const [tanggalCetak, setTanggalCetak] = useState("");
 useEffect(() => {
  loadData();

  const sekarang = new Date();

  setTanggalCetak(
    sekarang.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  );
}, []);
  async function loadData() {
    const { data, error } = await supabase
      .from("barang")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("ERROR PREVIEW LAPORAN:", error.message);
      setLoading(false);
      return;
    }

    setData(data || []);
    setLoading(false);
  }

  const totalBMN = data.reduce(
    (total, item) => total + Number(item.jumlah || 0),
    0
  );

  const baik = data.reduce(
    (total, item) =>
      String(item.kondisi || "").toLowerCase() === "baik"
        ? total + Number(item.jumlah || 0)
        : total,
    0
  );

  const ringan = data.reduce(
    (total, item) =>
      String(item.kondisi || "").toLowerCase() === "rusak ringan"
        ? total + Number(item.jumlah || 0)
        : total,
    0
  );

  const berat = data.reduce(
    (total, item) =>
      String(item.kondisi || "").toLowerCase() === "rusak berat"
        ? total + Number(item.jumlah || 0)
        : total,
    0
  );

  const totalNilai = data.reduce(
    (total, item) =>
      total + Number(item.nilai_perolehan || 0),
    0
  );

  function rupiah(nilai: number) {
    return `Rp ${nilai.toLocaleString("id-ID")}`;
  }
const nomorLaporan = "SIMSTOKBMN/001/VIII/2026";
  function cetak() {
    window.print();
  }

  return (
    <main className="min-h-screen bg-slate-200 p-6">

      {/* TOMBOL */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-between print:hidden">

        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow"
        >
          <ArrowLeft size={18} />
          Kembali
        </button>

        <button
          onClick={cetak}
          className="flex items-center gap-2 bg-blue-700 text-white px-5 py-3 rounded-xl shadow"
        >
          <Printer size={18} />
          Cetak / Simpan PDF
        </button>

      </div>

      {/* KERTAS */}
      <div className="max-w-6xl mx-auto bg-white shadow-xl p-10 print:shadow-none print:max-w-none print:p-0">

        {/* HEADER */}
      {/* HEADER / KOP LAPORAN */}
<div className="border-b-2 border-black pb-5">

  <div className="flex items-center justify-center gap-5">

    <img
      src="/logosimasdi1.png"
      alt="Logo SIMSTOK BMN"
      className="w-24 h-24 object-contain"
    />

    <div className="text-center">

      <p className="text-lg font-bold">
        BALAI PEMASYARAKATAN KELAS I JAKARTA BARAT
      </p>

      <p className="text-sm mt-1">
        SISTEM INFORMASI MANAJEMEN STOK BARANG MILIK NEGARA
      </p>

      <h1 className="text-2xl font-bold mt-3">
        LAPORAN BARANG MILIK NEGARA
      </h1>

      <p className="text-sm mt-2">
        Nomor: {nomorLaporan}
      </p>

      <p className="text-sm">
        Tanggal: {tanggalCetak}
      </p>

    </div>

  </div>

</div>

        {/* RINGKASAN */}
        <div className="grid grid-cols-5 gap-3 my-6">

          <Summary title="Total BMN" value={totalBMN} />
          <Summary title="Baik" value={baik} />
          <Summary title="Rusak Ringan" value={ringan} />
          <Summary title="Rusak Berat" value={berat} />
          <Summary
            title="Total Nilai"
            value={rupiah(totalNilai)}
          />

        </div>

        {/* TABEL */}
        {loading ? (
          <div className="text-center py-10">
            Memuat laporan...
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">

            <thead>

              <tr className="bg-slate-200">

                <th className="border border-black p-2">
                  No
                </th>

                <th className="border border-black p-2">
                  Kode Barang
                </th>

                <th className="border border-black p-2">
                  NUP
                </th>

                <th className="border border-black p-2">
                  Nama Barang
                </th>

                <th className="border border-black p-2">
                  Kategori
                </th>

                <th className="border border-black p-2">
                  Ruangan
                </th>

                <th className="border border-black p-2">
                  Kondisi
                </th>

                <th className="border border-black p-2">
                  Jumlah
                </th>

                <th className="border border-black p-2">
                  Nilai Perolehan
                </th>

              </tr>

            </thead>

            <tbody>

              {data.map((item, index) => (

                <tr key={item.id}>

                  <td className="border border-black p-2 text-center">
                    {index + 1}
                  </td>

                  <td className="border border-black p-2">
                    {item.kode_barang || "-"}
                  </td>

                  <td className="border border-black p-2">
                    {item.nup || "-"}
                  </td>

                  <td className="border border-black p-2">
                    {item.nama_barang || "-"}
                  </td>

                  <td className="border border-black p-2">
                    {item.kategori || "-"}
                  </td>

                  <td className="border border-black p-2">
                    {item.ruangan || "-"}
                  </td>

                  <td className="border border-black p-2 text-center">
                    {item.kondisi || "-"}
                  </td>

                  <td className="border border-black p-2 text-center">
                    {item.jumlah || 0}
                  </td>

                  <td className="border border-black p-2 text-right">
                    {rupiah(
                      Number(item.nilai_perolehan || 0)
                    )}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>
        )}

        {/* FOOTER */}
       {/* TANDA TANGAN */}
<div className="mt-12 grid grid-cols-2 gap-16 text-center text-sm">

  <div>
    <p>
      Mengetahui,
    </p>

    <p className="mt-1">
      Kepala Bapas Kelas I Jakarta Barat
    </p>

    <div className="h-24"></div>

    <p className="font-bold underline">
      ........................................
    </p>

    <p>
      NIP. ..................................
    </p>
  </div>


  <div>
    <p>
      Jakarta Barat, {tanggalCetak}
    </p>

    <p className="mt-1">
      Pengelola BMN
    </p>

    <div className="h-24"></div>

    <p className="font-bold underline">
      ........................................
    </p>

    <p>
      NIP. ..................................
    </p>
  </div>

</div>

{/* FOOTER */}
<div className="mt-8 text-xs text-slate-400 text-center">
  Dicetak dari SIMSTOK BMN • Bapas Kelas I Jakarta Barat
</div>

      </div>

    </main>
  );
}

function Summary({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="border border-black rounded-lg p-3 text-center">

      <p className="text-xs font-semibold">
        {title}
      </p>

      <p className="font-bold mt-1">
        {value}
      </p>

    </div>
  );
}
<style jsx global>{`
  @media print {
    @page {
      size: A4 portrait;
      margin: 15mm;
    }

    body {
      background: white !important;
    }

    .print\\:hidden {
      display: none !important;
    }

    table {
      width: 100% !important;
      font-size: 9px !important;
    }

    th,
    td {
      padding: 5px !important;
    }

    tr {
      page-break-inside: avoid;
    }
  }
`}</style>