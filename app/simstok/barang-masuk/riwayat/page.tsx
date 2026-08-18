"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PackagePlus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function RiwayatBarangMasuk() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data, error } = await supabase
      .from("barang")
      .select(
        "id, kode_barang, nama_barang, kategori, merk, ruangan, kondisi, jumlah, nilai_perolehan, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("ERROR RIWAYAT BARANG MASUK:", error.message);
      setLoading(false);
      return;
    }

    setData(data || []);
    setLoading(false);
  }

  const filteredData = data.filter((item) => {
    const keyword = search.toLowerCase();

    return (
      String(item.kode_barang || "")
        .toLowerCase()
        .includes(keyword) ||
      String(item.nama_barang || "")
        .toLowerCase()
        .includes(keyword) ||
      String(item.ruangan || "")
        .toLowerCase()
        .includes(keyword)
    );
  });

  function formatTanggal(tanggal: string) {
    if (!tanggal) return "-";

    return new Date(tanggal).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatRupiah(nilai: number | null) {
    if (nilai == null) return "-";

    return `Rp ${Number(nilai).toLocaleString("id-ID")}`;
  }

  return (
    <main>
      {/* HEADER */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-blue-900">
            Riwayat Barang Masuk
          </h1>

          <p className="text-slate-600 mt-2">
            Daftar Barang Milik Negara yang telah dicatat
          </p>
        </div>

        <Link
          href="/simstok/barang-masuk"
          className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-3 rounded-xl"
        >
          <ArrowLeft size={18} />
          Barang Masuk
        </Link>
      </div>

      {/* STATISTIK */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 flex items-center gap-4">
        <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl">
          <PackagePlus size={32} />
        </div>

        <div>
          <p className="text-sm text-slate-500">
            Total Barang Masuk
          </p>

          <p className="text-3xl font-bold text-slate-800">
            {data.length}
          </p>

          <p className="text-sm text-slate-500">
            Data tercatat
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-3xl shadow-lg p-5 mb-6">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode barang, nama barang, atau ruangan..."
            className="w-full border border-slate-300 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* TABEL */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="text-left p-4">No</th>
                <th className="text-left p-4">Tanggal Masuk</th>
                <th className="text-left p-4">Kode Barang</th>
                <th className="text-left p-4">Nama Barang</th>
                <th className="text-left p-4">Kategori</th>
                <th className="text-left p-4">Ruangan</th>
                <th className="text-left p-4">Kondisi</th>
                <th className="text-center p-4">Jumlah</th>
                <th className="text-right p-4">Nilai</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-10 text-center text-slate-500"
                  >
                    Memuat riwayat barang masuk...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-10 text-center text-slate-500"
                  >
                    Belum ada data barang masuk.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-slate-50"
                  >
                    <td className="p-4">
                      {index + 1}
                    </td>

                    <td className="p-4">
                      {formatTanggal(item.created_at)}
                    </td>

                    <td className="p-4 font-medium">
                      {item.kode_barang || "-"}
                    </td>

                    <td className="p-4 font-semibold">
                      {item.nama_barang || "-"}
                    </td>

                    <td className="p-4">
                      {item.kategori || "-"}
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
                                .toLowerCase() === "rusak ringan"
                            ? "bg-yellow-500"
                            : "bg-red-600"
                        }`}
                      >
                        {item.kondisi || "-"}
                      </span>
                    </td>

                    <td className="p-4 text-center font-semibold">
                      {item.jumlah || 0}
                    </td>

                    <td className="p-4 text-right font-bold">
                      {formatRupiah(item.nilai_perolehan)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}