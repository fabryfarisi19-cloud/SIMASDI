"use client";

import { useEffect, useState } from "react";
import {
  Printer,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LaporanBMNPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
const [filterRuangan, setFilterRuangan] = useState("Semua");
const [filterKondisi, setFilterKondisi] = useState("Semua");
const [filterTahun, setFilterTahun] = useState("Semua");
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data, error } = await supabase
      .from("barang")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("ERROR LAPORAN BMN:", error.message);
      setLoading(false);
      return;
    }

    setData(data || []);
    setLoading(false);
  }
const filteredData = data.filter((item) => {
  const cocokRuangan =
    filterRuangan === "Semua" ||
    String(item.ruangan || "") === filterRuangan;

  const cocokKondisi =
    filterKondisi === "Semua" ||
    String(item.kondisi || "").toLowerCase() ===
      filterKondisi.toLowerCase();

  const cocokTahun =
    filterTahun === "Semua" ||
    String(item.tahun_perolehan || "") === filterTahun;

  return cocokRuangan && cocokKondisi && cocokTahun;
});
  const totalBMN = filteredData.reduce(
    (total, item) => total + Number(item.jumlah || 0),
    0
  );

  const barangBaik = filteredData.reduce(
    (total, item) =>
      String(item.kondisi || "").toLowerCase() === "baik"
        ? total + Number(item.jumlah || 0)
        : total,
    0
  );

  const rusakRingan = filteredData.reduce(
    (total, item) =>
      String(item.kondisi || "").toLowerCase() === "rusak ringan"
        ? total + Number(item.jumlah || 0)
        : total,
    0
  );

  const rusakBerat = filteredData.reduce(
    (total, item) =>
      String(item.kondisi || "").toLowerCase() === "rusak berat"
        ? total + Number(item.jumlah || 0)
        : total,
    0
  );

  const totalNilai = filteredData.reduce(
    (total, item) =>
      total + Number(item.nilai_perolehan || 0),
    0
  );

  function formatRupiah(nilai: number) {
    return `Rp ${nilai.toLocaleString("id-ID")}`;
  }

  function cetakLaporan() {
    window.print();
  }
const daftarRuangan = Array.from(
  new Set(
    data
      .map((item) => item.ruangan)
      .filter(Boolean)
  )
);
const daftarTahun = Array.from(
  new Set(
    data
      .map((item) => item.tahun_perolehan)
      .filter(Boolean)
      .map((tahun) => String(tahun))
  )
).sort((a, b) => Number(b) - Number(a));
  return (
    <main>

      {/* HEADER */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8 print:hidden">

        <div>
          <h1 className="text-4xl font-bold text-blue-900">
            Laporan BMN
          </h1>

          <p className="text-slate-600 mt-2">
            Laporan Barang Milik Negara
          </p>
        </div>

        <div className="flex gap-3">

          <Link
            href="/simstok/dashboard"
            className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 px-5 py-3 rounded-xl"
          >
            <ArrowLeft size={18} />
            Kembali
          </Link>

      <Link
  href="/simstok/laporan/preview"
  className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-xl"
>
  <Printer size={18} />
  Preview Laporan
</Link>

        </div>

      </div>

      {/* JUDUL CETAK */}
      <div className="hidden print:block text-center mb-8">

        <h1 className="text-2xl font-bold">
          LAPORAN BARANG MILIK NEGARA
        </h1>

        <p>
          SIMSTOK BMN
        </p>

        <p>
          Bapas Kelas I Jakarta Barat
        </p>

      </div>
{/* FILTER LAPORAN */}
<div className="bg-white rounded-3xl shadow-lg p-6 mb-8 print:hidden">

  <div className="flex items-center justify-between mb-5">

    <div>
      <h2 className="text-xl font-bold text-slate-800">
        Filter Laporan
      </h2>

      <p className="text-sm text-slate-500 mt-1">
        Pilih ruangan dan kondisi BMN
      </p>
    </div>

    <button
     onClick={() => {
  setFilterRuangan("Semua");
  setFilterKondisi("Semua");
  setFilterTahun("Semua");
}}
      className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-xl text-sm"
    >
      Reset Filter
    </button>

  </div>

<div className="grid md:grid-cols-3 gap-5">

    {/* RUANGAN */}
    <div>

      <label className="block text-sm font-semibold text-slate-600 mb-2">
        Ruangan
      </label>

      <select
        value={filterRuangan}
        onChange={(e) => setFilterRuangan(e.target.value)}
        className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
      >

        <option value="Semua">
          Semua Ruangan
        </option>

        {daftarRuangan.map((ruangan) => (
          <option
            key={ruangan}
            value={ruangan}
          >
            {ruangan}
          </option>
        ))}

      </select>

    </div>

    {/* KONDISI */}
    <div>

      <label className="block text-sm font-semibold text-slate-600 mb-2">
        Kondisi
      </label>

      <select
        value={filterKondisi}
        onChange={(e) => setFilterKondisi(e.target.value)}
        className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
      >

        <option value="Semua">
          Semua Kondisi
        </option>

        <option value="Baik">
          Baik
        </option>

        <option value="Rusak Ringan">
          Rusak Ringan
        </option>

        <option value="Rusak Berat">
          Rusak Berat
        </option>

      </select>

    </div>
{/* TAHUN PEROLEHAN */}
<div>

  <label className="block text-sm font-semibold text-slate-600 mb-2">
    Tahun Perolehan
  </label>

  <select
    value={filterTahun}
    onChange={(e) => setFilterTahun(e.target.value)}
    className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
  >

    <option value="Semua">
      Semua Tahun
    </option>

    {daftarTahun.map((tahun) => (
      <option
        key={tahun}
        value={tahun}
      >
        {tahun}
      </option>
    ))}

  </select>

</div>
  </div>

</div>
      {/* STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">

        <Card
          title="TOTAL BMN"
          value={loading ? "..." : totalBMN.toLocaleString("id-ID")}
          icon={<Boxes size={30} />}
          color="blue"
        />

        <Card
          title="BAIK"
          value={loading ? "..." : barangBaik.toLocaleString("id-ID")}
          icon={<CheckCircle2 size={30} />}
          color="green"
        />

        <Card
          title="RUSAK RINGAN"
          value={loading ? "..." : rusakRingan.toLocaleString("id-ID")}
          icon={<AlertTriangle size={30} />}
          color="yellow"
        />

        <Card
          title="RUSAK BERAT"
          value={loading ? "..." : rusakBerat.toLocaleString("id-ID")}
          icon={<XCircle size={30} />}
          color="red"
        />

        <Card
          title="TOTAL NILAI"
          value={
            loading
              ? "..."
              : formatRupiah(totalNilai)
          }
          icon={<Wallet size={30} />}
          color="purple"
        />

      </div>

      {/* TABEL */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

        <div className="p-6">

          <h2 className="text-xl font-bold text-blue-900">
            Daftar Barang Milik Negara
          </h2>

      <p className="text-sm text-slate-500 mt-1">
  Menampilkan {filteredData.length} dari {data.length} data BMN
</p>

        </div>

        <div className="overflow-x-auto">

          <table className="min-w-[1200px] w-full">

            <thead className="bg-blue-600 text-white">

              <tr>

                <th className="p-3 text-left">
                  No
                </th>

                <th className="p-3 text-left">
                  Kode Barang
                </th>

                <th className="p-3 text-left">
                  NUP
                </th>

                <th className="p-3 text-left">
                  Nama Barang
                </th>

                <th className="p-3 text-left">
                  Kategori
                </th>

                <th className="p-3 text-left">
                  Ruangan
                </th>

                <th className="p-3 text-left">
                  Kondisi
                </th>

                <th className="p-3 text-center">
                  Jumlah
                </th>

                <th className="p-3 text-right">
                  Nilai Perolehan
                </th>

              </tr>

            </thead>

           <tbody>
  {filteredData.length === 0 ? (
    <tr>
      <td
        colSpan={9}
        className="p-10 text-center text-slate-500"
      >
        Tidak ada BMN sesuai filter.
      </td>
    </tr>
  ) : (
    filteredData.map((item, index) => (
      <tr
        key={item.id}
        className="border-b hover:bg-slate-50"
      >
        <td className="p-3 text-center">
          {index + 1}
        </td>

        <td className="p-3">
          {item.kode_barang || "-"}
        </td>

        <td className="p-3">
          {item.nup || "-"}
        </td>

        <td className="p-3">
          {item.nama_barang || "-"}
        </td>

        <td className="p-3">
          {item.kategori || "-"}
        </td>

        <td className="p-3">
          {item.ruangan || "-"}
        </td>

        <td className="p-3">
          {item.kondisi || "-"}
        </td>

        <td className="p-3 text-center">
          {item.jumlah || 0}
        </td>

        <td className="p-3 text-right font-semibold">
          Rp{" "}
          {Number(
            item.nilai_perolehan || 0
          ).toLocaleString("id-ID")}
        </td>
      </tr>
    ))
  )}
</tbody>

          </table>

        </div>

      </div>

      {/* FOOTER */}
      <div className="text-center text-sm text-slate-400 mt-8 print:hidden">
        SIMSTOK BMN • Bapas Kelas I Jakarta Barat
      </div>

    </main>
  );
}

function Card({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "yellow" | "red" | "purple";
}) {
  const colors = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    yellow: "bg-yellow-500",
    red: "bg-red-600",
    purple: "bg-purple-600",
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-5 flex items-center justify-between">

      <div>
        <p className="text-sm font-bold text-slate-500">
          {title}
        </p>

        <p className="text-2xl font-black mt-2">
          {value}
        </p>
      </div>

      <div
        className={`${colors[color]} text-white w-14 h-14 rounded-full flex items-center justify-center`}
      >
        {icon}
      </div>

    </div>
  );
}