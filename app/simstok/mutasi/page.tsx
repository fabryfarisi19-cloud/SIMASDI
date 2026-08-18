"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRightLeft,
  Eye,
  Search,
} from "lucide-react";

export default function MutasiPage() {
  const [mutasi, setMutasi] = useState<any[]>([]);
  const [barangMap, setBarangMap] = useState<Record<number, any>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMutasi();
  }, []);

  async function loadMutasi() {
    setLoading(true);

    const { data, error } = await supabase
      .from("mutasi_bmn")
      .select("*")
      .order("tanggal_mutasi", {
        ascending: false,
      })
      .order("id", {
        ascending: false,
      });

    if (error) {
      console.error(
        "ERROR RIWAYAT MUTASI:",
        error.message
      );
      setLoading(false);
      return;
    }

    setMutasi(data || []);
    const barangIds = [
  ...new Set(
    (data || []).map((item: any) => item.barang_id)
  ),
];

if (barangIds.length > 0) {
  const { data: barangData, error: barangError } =
    await supabase
      .from("barang")
      .select("id, kode_barang, nama_barang")
      .in("id", barangIds);

  if (barangError) {
    console.error(
      "ERROR DATA BARANG:",
      barangError.message
    );
  } else {
    const map: Record<number, any> = {};

    (barangData || []).forEach((barang: any) => {
      map[barang.id] = barang;
    });

    setBarangMap(map);
  }
}
    setLoading(false);
  }

  const dataFilter = mutasi.filter((item) => {
    const teks = search.toLowerCase();

    return (
      item.dari_ruangan
        ?.toLowerCase()
        .includes(teks) ||
      item.ke_ruangan
        ?.toLowerCase()
        .includes(teks) ||
      item.alasan
        ?.toLowerCase()
        .includes(teks) ||
      String(item.barang_id).includes(teks)
    );
  });

  return (
    <main>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

        <div>
          <h1 className="text-4xl font-bold text-blue-900">
            Riwayat Mutasi BMN
          </h1>

          <p className="text-slate-500 mt-2">
            Daftar perpindahan Barang Milik Negara
          </p>
        </div>

        <Link
          href="/simstok/data-bmn"
          className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 px-5 py-3 rounded-xl"
        >
          <ArrowLeft size={18} />
          Data BMN
        </Link>

      </div>

      {/* INFO */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="bg-purple-100 text-purple-700 p-3 rounded-xl">
              <ArrowRightLeft size={24} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Total Riwayat Mutasi
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {mutasi.length}
              </p>
            </div>

          </div>

          {/* SEARCH */}
          <div className="relative w-full md:w-80">

            <Search
              size={19}
              className="absolute left-4 top-3.5 text-slate-400"
            />

            <input
              type="text"
              placeholder="Cari riwayat..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full border rounded-xl pl-11 pr-4 py-3"
            />

          </div>

        </div>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1000px]">

            <thead className="bg-blue-600 text-white">

              <tr>

                <th className="px-4 py-4 text-center w-16">
                  No
                </th>

                <th className="px-4 py-4 text-left">
                  Tanggal
                </th>

                <th className="px-4 py-4 text-left">
  Barang
</th>

                <th className="px-4 py-4 text-left">
                  Dari Ruangan
                </th>

                <th className="px-4 py-4 text-left">
                  Ke Ruangan
                </th>

                <th className="px-4 py-4 text-left">
                  Alasan
                </th>

                <th className="px-4 py-4 text-left">
                  Keterangan
                </th>

                <th className="px-4 py-4 text-center">
                  Aksi
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Memuat riwayat mutasi...
                  </td>
                </tr>

              ) : dataFilter.length === 0 ? (

                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Belum ada riwayat mutasi.
                  </td>
                </tr>

              ) : (

                dataFilter.map(
                  (item, index) => (

                    <tr
                      key={item.id}
                      className="border-b hover:bg-slate-50"
                    >

                      <td className="px-4 py-4 text-center">
                        {index + 1}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        {new Date(
                          item.tanggal_mutasi
                        ).toLocaleDateString(
                          "id-ID"
                        )}
                      </td>
<td className="px-4 py-4">

  <div className="font-semibold text-slate-800">
    {barangMap[item.barang_id]?.nama_barang || "-"}
  </div>

  <div className="text-sm text-slate-500">
    {barangMap[item.barang_id]?.kode_barang || "-"}
  </div>

</td>

                      <td className="px-4 py-4">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                          {item.dari_ruangan ||
                            "-"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                          {item.ke_ruangan ||
                            "-"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {item.alasan || "-"}
                      </td>

                      <td className="px-4 py-4 max-w-[250px]">
                        {item.keterangan || "-"}
                      </td>

                      <td className="px-4 py-4 text-center">

                   <Link
  href={`/simstok/mutasi/${item.id}`}
                          className="inline-flex p-2 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200"
                          title="Detail BMN"
                        >
                          <Eye size={18} />
                        </Link>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </main>
  );
}