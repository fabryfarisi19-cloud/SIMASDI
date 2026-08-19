"use client";

import { useEffect, useState } from "react";
import { UserCog, Search, Package } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function PenanggungJawab() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
const [selectedPJ, setSelectedPJ] = useState("");
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
      console.error("ERROR PENANGGUNG JAWAB:", error.message);
      setLoading(false);
      return;
    }

    setData(data || []);
    setLoading(false);
  }

  const hasil = data.filter((item) =>
    String(item.penanggung_jawab || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );
const daftarPenanggungJawab = Array.from(
  new Set(
    data
      .map((item) => item.penanggung_jawab)
      .filter(Boolean)
  )
);

const totalBMN = data.reduce(
  (total, item) =>
    total + Number(item.jumlah || 0),
  0
);

const totalNilai = data.reduce(
  (total, item) =>
    total + Number(item.nilai_perolehan || 0),
  0
);

function formatRupiah(nilai: number) {
  return `Rp ${nilai.toLocaleString("id-ID")}`;
}
  return (
    <main>

      {/* JUDUL */}
      <div className="mb-8">

        <h1 className="text-4xl font-bold text-blue-900">
          Penanggung Jawab BMN
        </h1>

        <p className="text-slate-600 mt-2">
          Daftar penanggung jawab Barang Milik Negara
        </p>

      </div>
{/* STATISTIK */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

  {/* TOTAL PENANGGUNG JAWAB */}
  <div className="bg-white rounded-3xl shadow-lg p-6">
    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm font-semibold text-slate-500">
          TOTAL PENANGGUNG JAWAB
        </p>

        <h2 className="text-4xl font-black text-slate-800 mt-2">
          {daftarPenanggungJawab.length}
        </h2>
      </div>

      <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center">
        <UserCog size={28} />
      </div>

    </div>
  </div>


  {/* TOTAL BMN */}
  <div className="bg-white rounded-3xl shadow-lg p-6">
    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm font-semibold text-slate-500">
          TOTAL BMN
        </p>

        <h2 className="text-4xl font-black text-slate-800 mt-2">
          {totalBMN.toLocaleString("id-ID")}
        </h2>
      </div>

      <div className="w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center">
        <Package size={28} />
      </div>

    </div>
  </div>


  {/* TOTAL NILAI */}
  <div className="bg-white rounded-3xl shadow-lg p-6">
    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm font-semibold text-slate-500">
          TOTAL NILAI BMN
        </p>

        <h2 className="text-2xl font-black text-slate-800 mt-3">
          {formatRupiah(totalNilai)}
        </h2>
      </div>

      <div className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center">
        <Package size={28} />
      </div>

    </div>
  </div>

</div>
      {/* PENCARIAN */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">

        <div className="flex flex-col md:flex-row gap-3">

          <div className="relative flex-1">

            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari penanggung jawab..."
              className="w-full border border-slate-300 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

        </div>

      </div>

      {/* TABEL */}
      <div className="bg-white rounded-3xl shadow-lg p-6">

        <div className="flex items-center gap-3 mb-6">

          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
            <UserCog size={25} />
          </div>

          <div>

            <h2 className="text-xl font-bold text-slate-800">
              Daftar BMN
            </h2>

            <p className="text-sm text-slate-500">
              {hasil.length} data ditemukan
            </p>

          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px]">

            <thead className="bg-slate-100">

              <tr>

                <th className="p-4 text-left">
                  No
                </th>

                <th className="p-4 text-left">
                  Penanggung Jawab
                </th>

                <th className="p-4 text-left">
                  Kode Barang
                </th>

                <th className="p-4 text-left">
                  Nama Barang
                </th>

                <th className="p-4 text-left">
                  Ruangan
                </th>

                <th className="p-4 text-left">
                  Kondisi
                </th>

                <th className="p-4 text-right">
                  Jumlah
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-slate-500"
                  >
                    Memuat data...
                  </td>
                </tr>

              ) : hasil.length === 0 ? (

                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-slate-500"
                  >
                    Belum ada data penanggung jawab.
                  </td>
                </tr>

              ) : (

                hasil.map((item, index) => (

                  <tr
                    key={item.id}
                    className="border-b hover:bg-slate-50"
                  >

                    <td className="p-4">
                      {index + 1}
                    </td>
<td className="p-4">
  <button
    onClick={() =>
      setSelectedPJ(item.penanggung_jawab || "")
    }
    className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
  >
    {item.penanggung_jawab || "-"}
  </button>
</td>

                    <td className="p-4">
                      {item.kode_barang || "-"}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">

                        <Package
                          size={18}
                          className="text-blue-600"
                        />

                        {item.nama_barang || "-"}

                      </div>
                    </td>

                    <td className="p-4">
                      {item.ruangan || "-"}
                    </td>

                    <td className="p-4">
                      {item.kondisi || "-"}
                    </td>

                    <td className="p-4 text-right font-bold">
                      {item.jumlah || 0}
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>
{selectedPJ && (
  <div className="bg-white rounded-3xl shadow-lg p-6 mt-6">

    <div className="flex items-center justify-between mb-6">

      <div>
        <p className="text-sm text-slate-500">
          Penanggung Jawab
        </p>

        <h2 className="text-2xl font-bold text-blue-900">
          {selectedPJ}
        </h2>
      </div>

      <button
        onClick={() => setSelectedPJ("")}
        className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-xl"
      >
        Tutup
      </button>

    </div>

    <div className="overflow-x-auto">

      <table className="w-full min-w-[800px]">

        <thead className="bg-slate-100">

          <tr>
            <th className="p-4 text-left">No</th>
            <th className="p-4 text-left">Kode Barang</th>
            <th className="p-4 text-left">Nama Barang</th>
            <th className="p-4 text-left">Ruangan</th>
            <th className="p-4 text-left">Kondisi</th>
            <th className="p-4 text-right">Jumlah</th>
          </tr>

        </thead>

        <tbody>

          {data
            .filter(
              (item) =>
                String(item.penanggung_jawab || "") ===
                selectedPJ
            )
            .map((item, index) => (

              <tr
                key={item.id}
                className="border-b"
              >

                <td className="p-4">
                  {index + 1}
                </td>

                <td className="p-4">
                  {item.kode_barang || "-"}
                </td>

                <td className="p-4 font-semibold">
                  {item.nama_barang || "-"}
                </td>

                <td className="p-4">
                  {item.ruangan || "-"}
                </td>

                <td className="p-4">
                  {item.kondisi || "-"}
                </td>

                <td className="p-4 text-right font-bold">
                  {item.jumlah || 0}
                </td>

              </tr>

            ))}

        </tbody>

      </table>

    </div>

  </div>
)}
    </main>
  );
}