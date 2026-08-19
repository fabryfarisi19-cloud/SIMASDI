"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Eye,
  Search,
  Wrench,
   Trash2,
} from "lucide-react";

export default function RiwayatPemeliharaanPage() {
  const [data, setData] = useState<any[]>([]);
  const [barangMap, setBarangMap] = useState<Record<number, any>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRiwayat();
  }, []);

  async function loadRiwayat() {
    setLoading(true);

    const { data: pemeliharaan, error } = await supabase
      .from("pemeliharaan_bmn")
      .select("*")
      .order("tanggal_mulai", {
        ascending: false,
      })
      .order("id", {
        ascending: false,
      });

    if (error) {
      console.error(
        "ERROR RIWAYAT PEMELIHARAAN:",
        error.message
      );
      setLoading(false);
      return;
    }

    setData(pemeliharaan || []);

    const barangIds = [
      ...new Set(
        (pemeliharaan || []).map(
          (item: any) => item.barang_id
        )
      ),
    ];

    if (barangIds.length > 0) {
      const { data: barangData, error: barangError } =
        await supabase
          .from("barang")
          .select(
            "id, kode_barang, nama_barang, nup"
          )
          .in("id", barangIds);

      if (barangError) {
        console.error(
          "ERROR DATA BARANG:",
          barangError.message
        );
      } else {
        const map: Record<number, any> = {};

        (barangData || []).forEach(
          (barang: any) => {
            map[barang.id] = barang;
          }
        );

        setBarangMap(map);
      }
    }

    setLoading(false);
  }
async function hapusPemeliharaan(id: number) {
  const yakin = window.confirm(
    "Yakin ingin menghapus data pemeliharaan ini?"
  );

  if (!yakin) return;

  const { error } = await supabase
    .from("pemeliharaan_bmn")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "ERROR HAPUS PEMELIHARAAN:",
      error.message
    );

    alert(
      "Gagal menghapus data:\n\n" +
        error.message
    );

    return;
  }

  alert("Data pemeliharaan berhasil dihapus.");

  await loadRiwayat();
}
  const dataFilter = data.filter((item) => {
    const teks = search.toLowerCase();
    const barang = barangMap[item.barang_id];

    return (
      String(
        barang?.nama_barang || ""
      )
        .toLowerCase()
        .includes(teks) ||
      String(
        barang?.kode_barang || ""
      )
        .toLowerCase()
        .includes(teks) ||
      String(
        barang?.nup || ""
      )
        .toLowerCase()
        .includes(teks) ||
      String(
        item.jenis_pemeliharaan || ""
      )
        .toLowerCase()
        .includes(teks) ||
      String(
        item.vendor || ""
      )
        .toLowerCase()
        .includes(teks) ||
      String(
        item.status || ""
      )
        .toLowerCase()
        .includes(teks)
    );
  });

  const formatTanggal = (tanggal: string) => {
    if (!tanggal) return "-";

    return new Date(
      `${tanggal}T00:00:00`
    ).toLocaleDateString("id-ID");
  };

  const formatRupiah = (nilai: number) => {
    return new Intl.NumberFormat(
      "id-ID",
      {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }
    ).format(nilai || 0);
  };

  return (
    <main>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

        <div>
          <h1 className="text-4xl font-bold text-blue-900">
            Riwayat Pemeliharaan BMN
          </h1>

          <p className="text-slate-500 mt-2">
            Daftar riwayat pemeliharaan Barang Milik Negara
          </p>
        </div>

        <Link
          href="/simstok/pemeliharaan"
          className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 px-5 py-3 rounded-xl"
        >
          <ArrowLeft size={18} />
          Pemeliharaan BMN
        </Link>

      </div>

      {/* INFO */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="bg-orange-100 text-orange-600 p-3 rounded-xl">
              <Wrench size={24} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Total Riwayat Pemeliharaan
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {data.length}
              </p>
            </div>

          </div>

          {/* SEARCH */}
          <div className="relative w-full md:w-96">

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
              className="w-full border border-slate-300 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

        </div>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1200px]">

            <thead className="bg-blue-600 text-white">

              <tr>

                <th className="px-4 py-4 text-center">
                  No
                </th>

                <th className="px-4 py-4 text-left">
                  Tanggal
                </th>

                <th className="px-4 py-4 text-left">
                  Barang
                </th>

                <th className="px-4 py-4 text-left">
                  Jenis
                </th>

                <th className="px-4 py-4 text-left">
                  Vendor / Teknisi
                </th>

                <th className="px-4 py-4 text-right">
                  Biaya
                </th>

                <th className="px-4 py-4 text-left">
                  Status
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
                    colSpan={9}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Memuat riwayat pemeliharaan...
                  </td>
                </tr>

              ) : dataFilter.length === 0 ? (

                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Belum ada riwayat pemeliharaan.
                  </td>
                </tr>

              ) : (

                dataFilter.map(
                  (item, index) => {

                    const barang =
                      barangMap[
                        item.barang_id
                      ];

                    return (
                      <tr
                        key={item.id}
                        className="border-b hover:bg-slate-50"
                      >

                        <td className="px-4 py-4 text-center">
                          {index + 1}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          {formatTanggal(
                            item.tanggal_mulai
                          )}
                        </td>

                        <td className="px-4 py-4">

                          <div className="font-semibold text-slate-800">
                            {barang?.nama_barang || "-"}
                          </div>

                          <div className="text-sm text-slate-500">
                            {barang?.kode_barang || "-"}
                            {" "}
                            | NUP:{" "}
                            {barang?.nup || "-"}
                          </div>

                        </td>

                        <td className="px-4 py-4">
                          <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                            {item.jenis_pemeliharaan || "-"}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          {item.vendor || "-"}
                        </td>

                        <td className="px-4 py-4 text-right font-semibold whitespace-nowrap">
                          {formatRupiah(
                            item.biaya
                          )}
                        </td>

                        <td className="px-4 py-4">

                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              item.status ===
                              "Selesai"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {item.status || "-"}
                          </span>

                        </td>

                        <td className="px-4 py-4 max-w-[250px]">
                          {item.keterangan || "-"}
                        </td>

                        <td className="px-4 py-4 text-center">

  <div className="flex items-center justify-center gap-2">

    <Link
      href={`/simstok/pemeliharaan/riwayat/${item.id}`}
      className="inline-flex p-2 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200"
      title="Detail Pemeliharaan"
    >
      <Eye size={18} />
    </Link>

    <button
      type="button"
      onClick={() => hapusPemeliharaan(item.id)}
      className="inline-flex p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
      title="Hapus Pemeliharaan"
    >
      <Trash2 size={18} />
    </button>

  </div>

</td>
                      </tr>
                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </main>
  );
}