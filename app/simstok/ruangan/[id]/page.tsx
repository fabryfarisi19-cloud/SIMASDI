"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Search,
  Eye,
  Pencil,
  QrCode,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function DetailRuanganPage() {
  const params = useParams();
  const router = useRouter();

  const [ruangan, setRuangan] = useState<any>(null);
  const [bmn, setBmn] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterKondisi, setFilterKondisi] = useState("");

  useEffect(() => {
    if (params?.id) {
      loadRuangan();
    }
  }, [params?.id]);

  useEffect(() => {
    if (ruangan) {
      loadBmn();
    }
  }, [ruangan]);

  async function loadRuangan() {
    setLoading(true);

    const { data, error } = await supabase
      .from("ruangan")
      .select("id, nama_ruangan, kode_ruangan, lantai")
      .eq("id", Number(params.id))
      .single();

    if (error) {
      console.error("ERROR RUANGAN:", error.message);
      setLoading(false);
      return;
    }

    setRuangan(data);
    setLoading(false);
  }

  async function loadBmn() {
    if (!ruangan) return;

    const { data, error } = await supabase
      .from("barang")
      .select(`
        id,
        kode_barang,
        nup,
        nama_barang,
        kondisi,
        jumlah,
        nilai_perolehan,
        ruangan
      `)
      .eq("ruangan", ruangan.nama_ruangan)
      .order("id", { ascending: false });

    if (error) {
      console.error("ERROR BMN:", error.message);
      setBmn([]);
      return;
    }

    setBmn(data || []);
  }

  const bmnFilter = bmn.filter((item) => {
    const keyword = search.toLowerCase();

    const cocokSearch =
      item.nama_barang?.toLowerCase().includes(keyword) ||
      item.kode_barang?.toLowerCase().includes(keyword) ||
      String(item.nup || "").toLowerCase().includes(keyword);

    const cocokKondisi =
      filterKondisi === "" ||
      item.kondisi === filterKondisi;

    return cocokSearch && cocokKondisi;
  });

  const totalUnit = bmn.reduce(
    (total, item) => total + Number(item.jumlah || 0),
    0
  );

  if (loading) {
    return (
      <main className="p-6">
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          Memuat data ruangan...
        </div>
      </main>
    );
  }

  if (!ruangan) {
    return (
      <main className="p-6">
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <h1 className="text-xl font-bold text-slate-800">
            Data ruangan tidak ditemukan
          </h1>

          <button
            onClick={() => router.back()}
            className="mt-4 bg-slate-700 text-white px-5 py-2 rounded-lg"
          >
            Kembali
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 md:p-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">

        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-700 mb-3"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>

          <h1 className="text-3xl font-bold text-slate-800">
            {ruangan.nama_ruangan}
          </h1>

          <p className="text-slate-500 mt-1">
            Data BMN pada ruangan
          </p>
        </div>

        <Link
          href={`/simstok/data-bmn/tambah?ruangan=${ruangan.id}`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <Plus size={19} />
          Tambah BMN
        </Link>

      </div>

      {/* INFORMASI RUANGAN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-sm text-slate-500">
            Kode Ruangan
          </p>

          <p className="text-xl font-bold text-slate-800 mt-1">
            {ruangan.kode_ruangan || "-"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-sm text-slate-500">
            Lantai
          </p>

          <p className="text-xl font-bold text-slate-800 mt-1">
            {ruangan.lantai || "-"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-sm text-slate-500">
            Total Unit BMN
          </p>

          <p className="text-xl font-bold text-blue-700 mt-1">
            {totalUnit}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            {bmn.length} jenis/data barang
          </p>
        </div>

      </div>

      {/* DAFTAR BMN */}
      <div className="bg-white rounded-3xl shadow p-5">

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-5">

          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Daftar BMN
            </h2>

            <p className="text-sm text-slate-500">
              BMN yang tercatat pada {ruangan.nama_ruangan}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">

            {/* SEARCH */}
            <div className="relative">

              <Search
                size={18}
                className="absolute left-3 top-3 text-slate-400"
              />

              <input
                type="text"
                placeholder="Cari BMN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded-xl pl-10 pr-4 py-2.5 w-full md:w-64"
              />

            </div>

            {/* FILTER */}
            <select
              value={filterKondisi}
              onChange={(e) => setFilterKondisi(e.target.value)}
              className="border rounded-xl px-4 py-2.5"
            >
              <option value="">Semua Kondisi</option>
              <option value="Baik">Baik</option>
              <option value="Rusak Ringan">
                Rusak Ringan
              </option>
              <option value="Rusak Berat">
                Rusak Berat
              </option>
            </select>

          </div>

        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">

          <table className="min-w-[1000px] w-full border-collapse">

            <thead className="bg-slate-100">

              <tr>

                <th className="border p-3 text-left">
                  Kode
                </th>

                <th className="border p-3 text-left">
                  NUP
                </th>

                <th className="border p-3 text-left">
                  Nama Barang
                </th>

                <th className="border p-3 text-center">
                  Kondisi
                </th>

                <th className="border p-3 text-center">
                  Jumlah
                </th>

                <th className="border p-3 text-right">
                  Nilai Perolehan
                </th>

                <th className="border p-3 text-center">
                  Aksi
                </th>

              </tr>

            </thead>

            <tbody>

              {bmnFilter.length > 0 ? (

                bmnFilter.map((item) => (

                  <tr
                    key={item.id}
                    className="hover:bg-slate-50"
                  >

                    <td className="border p-3 font-medium">
                      {item.kode_barang || "-"}
                    </td>

                    <td className="border p-3">
                      {item.nup || "-"}
                    </td>

                    <td className="border p-3 font-semibold">
                      {item.nama_barang || "-"}
                    </td>

                    <td className="border p-3 text-center">

                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          item.kondisi === "Baik"
                            ? "bg-green-100 text-green-700"
                            : item.kondisi === "Rusak Ringan"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >

                        {item.kondisi || "-"}

                      </span>

                    </td>

                    <td className="border p-3 text-center font-bold">
                      {item.jumlah || 0}
                    </td>

                    <td className="border p-3 text-right">
                      Rp{" "}
                      {Number(
                        item.nilai_perolehan || 0
                      ).toLocaleString("id-ID")}
                    </td>

                    <td className="border p-3">

                      <div className="flex justify-center gap-2">

                        {/* DETAIL */}
                        <Link
                          href={`/simstok/bmn/${item.id}`}
                          className="p-2 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200"
                          title="Detail"
                        >
                          <Eye size={17} />
                        </Link>

                        {/* EDIT */}
                        <Link
                          href={`/simstok/data-bmn/edit/${item.id}`}
                          className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200"
                          title="Edit"
                        >
                          <Pencil size={17} />
                        </Link>

                        {/* QR */}
                        <Link
                          href={`/simstok/bmn/${item.id}`}
                          className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
                          title="QR Code"
                        >
                          <QrCode size={17} />
                        </Link>

                      </div>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan={7}
                    className="border p-8 text-center text-gray-500"
                  >
                    {search || filterKondisi
                      ? "Tidak ada BMN yang sesuai dengan filter."
                      : "Belum ada BMN pada ruangan ini."}
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </main>
  );
}