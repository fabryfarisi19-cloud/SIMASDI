"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  User,
  RefreshCw,
} from "lucide-react";

type Gaji = {
  id: number;
  pengguna_id: number;
  bulan: number;
  tahun: number;

  gaji_pokok: number;
  tunjangan_keluarga: number;
  tunjangan_jabatan: number;
  tunjangan_lainnya: number;

  potongan_pajak: number;
  potongan_bpjs: number;
  potongan_pensiun: number;
  potongan_koperasi: number;
  potongan_arisan_dw: number;
  potongan_lainnya: number;

  total_pendapatan: number;
  total_potongan: number;
  gaji_bersih: number;
  keterangan: string | null;
};

const namaBulan = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
}

export default function RincianGajiPage() {
  const [gaji, setGaji] = useState<Gaji | null>(null);
  const [riwayat, setRiwayat] = useState<Gaji[]>([]);
  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const userStorage = localStorage.getItem("user");

      if (!userStorage) {
        setError("Data pengguna tidak ditemukan. Silakan login kembali.");
        return;
      }

      const user = JSON.parse(userStorage);

      if (!user.id) {
        setError("ID pengguna tidak ditemukan.");
        return;
      }

      setNama(user.nama || "");

      const { data, error: queryError } = await supabase
        .from("rincian_gaji")
        .select("*")
        .eq("pengguna_id", user.id)
        .order("tahun", { ascending: false })
        .order("bulan", { ascending: false });

      if (queryError) {
        console.error(queryError);
        setError("Gagal mengambil data rincian gaji.");
        return;
      }

      const dataGaji = (data || []) as Gaji[];

      setRiwayat(dataGaji);
      setGaji(dataGaji.length > 0 ? dataGaji[0] : null);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat mengambil data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <RefreshCw className="animate-spin" size={22} />
          Memuat rincian gaji...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                  <Wallet size={28} />
                </div>

                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                    Rincian Gaji Saya
                  </h1>

                  <p className="text-slate-500 mt-1">
                    Informasi penghasilan dan potongan gaji pegawai
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={loadData}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RefreshCw size={18} />
              Refresh
            </button>

          </div>
        </div>

        {/* USER */}
        <div className="mb-6 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-3 text-blue-700">
              <User size={24} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Pegawai
              </p>

              <p className="text-lg font-bold text-slate-900">
                {nama || "Pegawai"}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!error && !gaji && (
          <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center shadow-sm">
            <Wallet
              size={48}
              className="mx-auto mb-4 text-slate-300"
            />

            <h2 className="text-xl font-bold text-slate-800">
              Data gaji belum tersedia
            </h2>

            <p className="mt-2 text-slate-500">
              Belum ada rincian gaji yang terhubung dengan akun Anda.
            </p>
          </div>
        )}

        {gaji && (
          <>
            {/* PERIODE */}
            <div className="mb-6 flex items-center gap-2 text-slate-600">
              <CalendarDays size={20} />

              <span>
                Periode gaji:
                <strong className="ml-1 text-slate-900">
                  {namaBulan[gaji.bulan]} {gaji.tahun}
                </strong>
              </span>
            </div>

            {/* RINGKASAN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

              <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-xl bg-green-100 p-3 text-green-700">
                    <TrendingUp size={22} />
                  </div>

                  <span className="font-semibold text-slate-600">
                    Total Pendapatan
                  </span>
                </div>

                <p className="text-2xl font-bold text-green-700">
                  {rupiah(gaji.total_pendapatan)}
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-xl bg-red-100 p-3 text-red-700">
                    <TrendingDown size={22} />
                  </div>

                  <span className="font-semibold text-slate-600">
                    Total Potongan
                  </span>
                </div>

                <p className="text-2xl font-bold text-red-700">
                  {rupiah(gaji.total_potongan)}
                </p>
              </div>

              <div className="rounded-2xl bg-blue-700 p-6 shadow-lg text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-xl bg-white/20 p-3">
                    <Wallet size={22} />
                  </div>

                  <span className="font-semibold">
                    Gaji Bersih
                  </span>
                </div>

                <p className="text-2xl font-bold">
                  {rupiah(gaji.gaji_bersih)}
                </p>
              </div>

            </div>

            {/* DETAIL */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* PENDAPATAN */}
              <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">

                <div className="border-b border-slate-200 px-6 py-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    Pendapatan
                  </h2>
                </div>

                <div className="p-6 space-y-4">

                  <Row
                    label="Gaji Pokok"
                    value={gaji.gaji_pokok}
                  />

                  <Row
                    label="Tunjangan Keluarga"
                    value={gaji.tunjangan_keluarga}
                  />

                  <Row
                    label="Tunjangan Jabatan"
                    value={gaji.tunjangan_jabatan}
                  />

                  <Row
                    label="Tunjangan Lainnya"
                    value={gaji.tunjangan_lainnya}
                  />

                  <div className="border-t border-slate-200 pt-4">
                    <Row
                      label="Total Pendapatan"
                      value={gaji.total_pendapatan}
                      bold
                    />
                  </div>

                </div>
              </section>

              {/* POTONGAN */}
              <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">

                <div className="border-b border-slate-200 px-6 py-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    Potongan
                  </h2>
                </div>

                <div className="p-6 space-y-4">

                  <Row
                    label="Pajak"
                    value={gaji.potongan_pajak}
                  />

                  <Row
                    label="BPJS"
                    value={gaji.potongan_bpjs}
                  />

                  <Row
                    label="Pensiun"
                    value={gaji.potongan_pensiun}
                  />

                  <Row
                    label="Koperasi"
                    value={gaji.potongan_koperasi}
                  />

                  <Row
                    label="Arisan DW"
                    value={gaji.potongan_arisan_dw}
                  />

                  <Row
                    label="Potongan Lainnya"
                    value={gaji.potongan_lainnya}
                  />

                  <div className="border-t border-slate-200 pt-4">
                    <Row
                      label="Total Potongan"
                      value={gaji.total_potongan}
                      bold
                    />
                  </div>

                </div>
              </section>

            </div>

            {/* KETERANGAN */}
            {gaji.keterangan && (
              <div className="mt-6 rounded-2xl bg-blue-50 border border-blue-100 p-5">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Keterangan
                </p>

                <p className="text-blue-800">
                  {gaji.keterangan}
                </p>
              </div>
            )}

            {/* RIWAYAT */}
            <section className="mt-8 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">

              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Riwayat Gaji
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Riwayat rincian gaji Anda
                </p>
              </div>

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-6 py-4 font-semibold text-slate-600">
                        Periode
                      </th>

                      <th className="text-right px-6 py-4 font-semibold text-slate-600">
                        Pendapatan
                      </th>

                      <th className="text-right px-6 py-4 font-semibold text-slate-600">
                        Potongan
                      </th>

                      <th className="text-right px-6 py-4 font-semibold text-slate-600">
                        Gaji Bersih
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {riwayat.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {namaBulan[item.bulan]} {item.tahun}
                        </td>

                        <td className="px-6 py-4 text-right text-green-700">
                          {rupiah(item.total_pendapatan)}
                        </td>

                        <td className="px-6 py-4 text-right text-red-700">
                          {rupiah(item.total_potongan)}
                        </td>

                        <td className="px-6 py-4 text-right font-bold text-blue-700">
                          {rupiah(item.gaji_bersih)}
                        </td>
                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            </section>
          </>
        )}

      </div>
    </main>
  );
}

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          bold
            ? "font-bold text-slate-900"
            : "text-slate-600"
        }
      >
        {label}
      </span>

      <span
        className={
          bold
            ? "font-bold text-slate-900"
            : "font-medium text-slate-800"
        }
      >
        {rupiah(value)}
      </span>
    </div>
  );
}