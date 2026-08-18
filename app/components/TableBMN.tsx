"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TableBMN() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data, error } = await supabase
      .from("barang")
      .select(
        "id, kode_barang, nama_barang, ruangan, kondisi, nilai_perolehan"
      )
      .order("id", { ascending: false })
      .limit(10);

    if (error) {
      console.error("ERROR TABLE BMN:", error.message);
      setLoading(false);
      return;
    }

    setData(data || []);
    setLoading(false);
  }

  function formatRupiah(nilai: number) {
    return `Rp ${Number(nilai || 0).toLocaleString("id-ID")}`;
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">

      <h2 className="text-2xl font-bold text-blue-900 mb-6">
        Data BMN Terbaru
      </h2>

      <div className="overflow-x-auto">

        <table className="min-w-[900px] w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="text-left p-4">
                Kode
              </th>

              <th className="text-left p-4">
                Nama Barang
              </th>

              <th className="text-left p-4">
                Ruangan
              </th>

              <th className="text-left p-4">
                Kondisi
              </th>

              <th className="text-right p-4">
                Nilai
              </th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-gray-500"
                >
                  Memuat data BMN...
                </td>
              </tr>

            ) : data.length === 0 ? (

              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-gray-500"
                >
                  Belum ada data BMN.
                </td>
              </tr>

            ) : (

              data.map((item) => (

                <tr
                  key={item.id}
                  className="border-b hover:bg-slate-50"
                >

                  <td className="p-4">
                    {item.kode_barang || "-"}
                  </td>
<td className="p-4 font-semibold">
  <a
    href={`/simstok/data-bmn/${item.id}`}
    className="text-blue-700 hover:text-blue-900 hover:underline"
  >
    {item.nama_barang || "-"}
  </a>
</td>

                  <td className="p-4">
                    {item.ruangan || "-"}
                  </td>

                  <td className="p-4">

                    <span
                      className={`px-3 py-1 rounded-full text-white text-sm ${
                        String(item.kondisi || "").toLowerCase() ===
                        "baik"
                          ? "bg-green-600"
                          : String(item.kondisi || "")
                              .toLowerCase() ===
                            "rusak ringan"
                          ? "bg-yellow-500"
                          : "bg-red-600"
                      }`}
                    >
                      {item.kondisi || "-"}
                    </span>

                  </td>

                  <td className="p-4 text-right font-bold">

                    {formatRupiah(
                      Number(item.nilai_perolehan || 0)
                    )}

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

           </div>

      <div className="flex justify-end mt-6">

        <a
          href="/simstok/data-bmn"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
        >
          Lihat Semua BMN →
        </a>

      </div>

    </div>
  );
}