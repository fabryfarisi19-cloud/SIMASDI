"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Periode = {
  id: string;
  tahun: number;
  bulan: number;
  nama_periode: string;
  status: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  keterangan: string | null;
};

type RekapItem = {
  pegawai_id: string;
  pegawai_username: string;
  pegawai_nama: string;
  pegawai_nip: string;
  pegawai_role: string;

  sudah_dinilai: boolean;

  jumlah_penilai: number;

  nilai_rata_rata: number | null;
  nilai_terendah: number | null;
  nilai_tertinggi: number | null;
};

type Ringkasan = {
  total_objek: number;
  sudah_dinilai: number;
  belum_dinilai: number;
  total_penilai: number;
  total_detail_penilaian: number;
};

type ApiResponse = {
  success: boolean;
  message?: string;

  periode?: Periode;

  ringkasan?: Ringkasan;

  rekap_pegawai?: RekapItem[];

  detail_penilaian?: any[];

  rekap_bulanan?: any[];
};

// =========================================================
// TYPE DETAIL PENILAIAN
// =========================================================

type DetailPenilaian = {
  penilaian_id: string;
  periode_id: string;

  tahun: number;
  bulan: number;
  nama_periode: string;

  status_periode: string;

  pegawai_username: string;
  pegawai_nama: string;
  pegawai_nip: string;

  penilai_username: string;
  penilai_nama: string;
  penilai_role: string;

  status_penilaian: string;

  kode_kriteria: string;
  nama_kriteria: string;

  deskripsi: string | null;

  indikator: string | null;
  pedoman_nilai: string | null;

  bobot: number;
  nilai: number;
  nilai_berbobot: number;

  nilai_min: number;
  nilai_max: number;

  urutan: number | null;

  catatan_kriteria: string | null;
  catatan_penilaian: string | null;

  tanggal_dikirim: string;
  created_at: string;
  updated_at: string;
};

type DetailResponse = {
  success: boolean;
  message?: string;

  periode?: Periode;

  pegawai?: {
    id: number;
    nama: string;
    username: string;
    role: string;
    status: string;
  };

  penilaian?: any[];

  detail?: DetailPenilaian[];

  kriteria?: any[];

  jumlah_penilaian?: number;
  jumlah_detail?: number;
};

export default function RekapPegawaiTeladanPage() {
  const [periode, setPeriode] =
    useState<Periode | null>(null);

  const [ringkasan, setRingkasan] =
    useState<Ringkasan | null>(null);

  const [data, setData] =
    useState<RekapItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filterStatus, setFilterStatus] =
    useState<"semua" | "sudah" | "belum">(
      "semua"
    );

  // =========================================================
  // DETAIL MODAL
  // =========================================================

  const [showDetail, setShowDetail] =
    useState(false);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [detailError, setDetailError] =
    useState("");

  const [detailData, setDetailData] =
    useState<DetailResponse | null>(null);

  // =========================================================
  // LOAD DATA REKAP
  // =========================================================

  async function loadRekap() {
    try {
      setLoading(true);
      setError("");

      const periodeId =
        "fdc3c3b0-c78c-4985-aa88-df6dcb6eb23e";

      const response = await fetch(
        `/api/pegawai-teladan/rekap?periode_id=${periodeId}`,
        {
          cache: "no-store",
        }
      );

      const result: ApiResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Gagal mengambil rekap penilaian."
        );
      }

      setPeriode(result.periode ?? null);

      setRingkasan(
        result.ringkasan ?? null
      );

      setData(
        result.rekap_pegawai ?? []
      );
    } catch (err: any) {
      console.error(
        "Error load rekap:",
        err
      );

      setError(
        err?.message ||
          "Terjadi kesalahan saat mengambil data rekap."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRekap();
  }, []);

  // =========================================================
  // LOAD DETAIL PEGAWAI
  // =========================================================

  async function bukaDetail(
    item: RekapItem
  ) {
    if (!item.sudah_dinilai) {
      return;
    }

    try {
      setShowDetail(true);

      setDetailLoading(true);

      setDetailError("");

      setDetailData(null);

      const periodeId =
        "fdc3c3b0-c78c-4985-aa88-df6dcb6eb23e";

      const response = await fetch(
        `/api/pegawai-teladan/rekap/detail?periode_id=${periodeId}&pegawai_username=${encodeURIComponent(
          item.pegawai_username
        )}`,
        {
          cache: "no-store",
        }
      );

      const result: DetailResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Gagal mengambil detail penilaian."
        );
      }

      setDetailData(result);
    } catch (err: any) {
      console.error(
        "Error load detail:",
        err
      );

      setDetailError(
        err?.message ||
          "Terjadi kesalahan saat mengambil detail penilaian."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  // =========================================================
  // TUTUP DETAIL
  // =========================================================

  function tutupDetail() {
    setShowDetail(false);

    setDetailData(null);

    setDetailError("");
  }

  // =========================================================
  // FILTER
  // =========================================================

  const filteredData = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return data.filter((item) => {
      const cocokSearch =
        !keyword ||
        item.pegawai_nama
          .toLowerCase()
          .includes(keyword) ||
        item.pegawai_username
          .toLowerCase()
          .includes(keyword) ||
        item.pegawai_role
          .toLowerCase()
          .includes(keyword);

      const cocokStatus =
        filterStatus === "semua" ||
        (filterStatus === "sudah" &&
          item.sudah_dinilai) ||
        (filterStatus === "belum" &&
          !item.sudah_dinilai);

      return (
        cocokSearch &&
        cocokStatus
      );
    });
  }, [
    data,
    search,
    filterStatus,
  ]);

  // =========================================================
  // FORMAT NILAI
  // =========================================================

  function formatNilai(
    nilai: number | null | undefined
  ) {
    if (
      nilai === null ||
      nilai === undefined
    ) {
      return "-";
    }

    return new Intl.NumberFormat(
      "id-ID",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    ).format(Number(nilai));
  }

  // =========================================================
  // FORMAT TANGGAL
  // =========================================================

  function formatTanggal(
    tanggal: string | null | undefined
  ) {
    if (!tanggal) {
      return "-";
    }

    try {
      return new Intl.DateTimeFormat(
        "id-ID",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      ).format(new Date(tanggal));
    } catch {
      return tanggal;
    }
  }

  // =========================================================
  // FORMAT PEDOMAN NILAI
  // =========================================================
  //
  // Database menyimpan pedoman menggunakan <br>.
  // Kita pecah menjadi beberapa baris agar lebih mudah dibaca.
  //

  function formatPedoman(
    pedoman: string | null | undefined
  ) {
    if (!pedoman) {
      return [];
    }

    return pedoman
      .replace(/<br\s*\/?>/gi, "\n")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />

              <span className="text-sm text-slate-600">
                Memuat rekap penilaian...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-700">
              Gagal Memuat Rekap
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={loadRekap}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <Link
                  href="/pegawai-teladan"
                  className="text-sm text-slate-500 hover:text-slate-800"
                >
                  ← Penilaian
                </Link>
              </div>

              <h1 className="mt-2 text-2xl font-bold text-slate-800">
                Rekap Penilaian Pegawai Teladan
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Rekapitulasi penilaian pegawai berdasarkan periode.
              </p>
            </div>

            <button
              onClick={loadRekap}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* PERIODE */}
        {/* ================================================= */}

        {periode && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Periode Penilaian
                </div>

                <div className="mt-1 text-xl font-bold text-blue-900">
                  {periode.nama_periode}
                </div>

                <div className="mt-1 text-sm text-blue-700">
                  {periode.keterangan}
                </div>
              </div>

              <div
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                  periode.status === "dibuka"
                    ? "bg-green-100 text-green-700"
                    : periode.status === "ditutup"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {periode.status.toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* RINGKASAN */}
        {/* ================================================= */}
<div className="mb-4 flex justify-end">
  <button
    type="button"
    onClick={() => {
      if (!periode) {
        alert("Data periode belum tersedia.");
        return;
      }

      window.open(
        `/pegawai-teladan/rekap/cetak?periode_id=${encodeURIComponent(
          periode.id
        )}`,
        "_blank"
      );
    }}
    disabled={!periode}
    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
  >
    🖨 Cetak Rekap
  </button>
</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Total Objek
            </div>

            <div className="mt-2 text-3xl font-bold text-slate-800">
              {ringkasan?.total_objek ?? 0}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              Pegawai yang menjadi objek penilaian
            </div>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <div className="text-sm font-medium text-green-700">
              Sudah Dinilai
            </div>

            <div className="mt-2 text-3xl font-bold text-green-800">
              {ringkasan?.sudah_dinilai ?? 0}
            </div>

            <div className="mt-1 text-xs text-green-700">
              Telah menerima penilaian
            </div>
          </div>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
            <div className="text-sm font-medium text-yellow-700">
              Belum Dinilai
            </div>

            <div className="mt-2 text-3xl font-bold text-yellow-800">
              {ringkasan?.belum_dinilai ?? 0}
            </div>

            <div className="mt-1 text-xs text-yellow-700">
              Masih menunggu penilaian
            </div>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
            <div className="text-sm font-medium text-purple-700">
              Penilai
            </div>

            <div className="mt-2 text-3xl font-bold text-purple-800">
              {ringkasan?.total_penilai ?? 0}
            </div>

            <div className="mt-1 text-xs text-purple-700">
              Penilai yang sudah memberikan nilai
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* FILTER */}
        {/* ================================================= */}

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">

            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Cari Pegawai
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Cari nama, NIP, atau jabatan..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="w-full lg:w-56">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>

              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(
                    e.target.value as
                      | "semua"
                      | "sudah"
                      | "belum"
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="semua">
                  Semua Pegawai
                </option>

                <option value="sudah">
                  Sudah Dinilai
                </option>

                <option value="belum">
                  Belum Dinilai
                </option>
              </select>
            </div>

          </div>
        </div>

        {/* ================================================= */}
        {/* TABEL */}
        {/* ================================================= */}

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          <div className="border-b px-5 py-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="font-semibold text-slate-800">
                  Daftar Pegawai
                </h2>

                <p className="text-sm text-slate-500">
                  Menampilkan {filteredData.length} dari{" "}
                  {data.length} pegawai.
                </p>
              </div>

              <div className="text-xs text-slate-500">
                Total penilaian masuk:{" "}
                {ringkasan?.total_detail_penilaian ?? 0}
              </div>

            </div>
          </div>

          <div className="overflow-x-auto">

            <table className="min-w-full text-sm">

              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    No
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Pegawai
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    NIP
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Jabatan
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-slate-600">
                    Penilai
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-slate-600">
                    Nilai
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">

                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Tidak ada data yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredData.map(
                    (item, index) => (
                      <tr
                        key={
                          item.pegawai_username
                        }
                        className="hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-4 py-3">
                          {item.sudah_dinilai ? (
                            <button
                              type="button"
                              onClick={() =>
                                bukaDetail(item)
                              }
                              className="text-left"
                              title="Klik untuk melihat detail penilaian"
                            >
                              <div className="font-semibold text-blue-700 hover:text-blue-900 hover:underline">
                                {
                                  item.pegawai_nama
                                }
                              </div>

                              <div className="mt-0.5 text-xs text-slate-400">
                                {
                                  item.pegawai_username
                                }
                              </div>
                            </button>
                          ) : (
                            <>
                              <div className="font-semibold text-slate-800">
                                {
                                  item.pegawai_nama
                                }
                              </div>

                              <div className="mt-0.5 text-xs text-slate-400">
                                {
                                  item.pegawai_username
                                }
                              </div>
                            </>
                          )}
                        </td>

                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {item.pegawai_nip}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {item.pegawai_role}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {item.jumlah_penilai >
                          0 ? (
                            <span className="font-semibold text-slate-700">
                              {
                                item.jumlah_penilai
                              }
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              0
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {item.sudah_dinilai ? (
                            <button
                              type="button"
                              onClick={() =>
                                bukaDetail(item)
                              }
                              className="text-lg font-bold text-blue-700 hover:text-blue-900 hover:underline"
                              title="Lihat detail nilai"
                            >
                              {formatNilai(
                                item.nilai_rata_rata
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-400">
                              -
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {item.sudah_dinilai ? (
                            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              ✓ SUDAH DINILAI
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                              BELUM DINILAI
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>
          </div>
        </div>

      </div>

      {/* ===================================================== */}
      {/* MODAL DETAIL PENILAIAN */}
      {/* ===================================================== */}

      {showDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              tutupDetail();
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* ================================================= */}
            {/* MODAL HEADER */}
            {/* ================================================= */}

            <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-4">

              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Detail Penilaian Pegawai Teladan
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Rincian penilaian berdasarkan 6 kriteria
                </p>
              </div>

              <button
                type="button"
                onClick={tutupDetail}
                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                title="Tutup"
              >
                ×
              </button>

            </div>

            {/* ================================================= */}
            {/* MODAL CONTENT */}
            {/* ================================================= */}

            <div className="max-h-[calc(92vh-73px)] overflow-y-auto p-5">

              {/* LOADING DETAIL */}

              {detailLoading && (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />

                    <span className="text-sm text-slate-600">
                      Memuat detail penilaian...
                    </span>
                  </div>
                </div>
              )}

              {/* ERROR DETAIL */}

              {!detailLoading &&
                detailError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                    <div className="font-semibold text-red-700">
                      Gagal Memuat Detail
                    </div>

                    <div className="mt-1 text-sm text-red-600">
                      {detailError}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          detailData?.pegawai
                        ) {
                          const item =
                            data.find(
                              (pegawai) =>
                                pegawai.pegawai_username ===
                                detailData.pegawai
                                  ?.username
                            );

                          if (item) {
                            bukaDetail(item);
                          }
                        }
                      }}
                      className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      Coba Lagi
                    </button>
                  </div>
                )}

              {/* DETAIL DATA */}

              {!detailLoading &&
                !detailError &&
                detailData && (
                  <div className="space-y-5">

                    {/* ========================================= */}
                    {/* IDENTITAS PEGAWAI */}
                    {/* ========================================= */}

                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                            Pegawai yang Dinilai
                          </div>

                          <div className="mt-1 text-2xl font-bold text-blue-950">
                            {
                              detailData
                                .pegawai
                                ?.nama
                            }
                          </div>

                          <div className="mt-1 font-mono text-sm text-blue-800">
                            NIP:{" "}
                            {
                              detailData
                                .pegawai
                                ?.username
                            }
                          </div>

                          <div className="mt-1 text-sm text-blue-800">
                            {
                              detailData
                                .pegawai
                                ?.role
                            }
                          </div>
                        </div>

                        <div className="rounded-xl bg-white px-5 py-4 text-center shadow-sm">
                          <div className="text-xs text-slate-500">
                            Nilai Akhir
                          </div>

                          <div className="mt-1 text-3xl font-bold text-blue-700">
                            {formatNilai(
                              detailData
                                .penilaian?.[0]
                                ?.nilai_akhir
                            )}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            dari 100
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* ========================================= */}
                    {/* INFORMASI PENILAIAN */}
                    {/* ========================================= */}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                      <div className="rounded-xl border bg-white p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Periode
                        </div>

                        <div className="mt-1 font-semibold text-slate-800">
                          {
                            detailData
                              .periode
                              ?.nama_periode
                          }
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {
                            detailData
                              .periode
                              ?.keterangan
                          }
                        </div>
                      </div>

                      <div className="rounded-xl border bg-white p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Penilai
                        </div>

                        <div className="mt-1 font-semibold text-slate-800">
                          {
                            detailData
                              .penilaian?.[0]
                              ?.penilai_nama
                          }
                        </div>

                        <div className="mt-1 text-sm text-slate-600">
                          {
                            detailData
                              .penilaian?.[0]
                              ?.penilai_role
                          }
                        </div>

                        <div className="mt-1 font-mono text-xs text-slate-400">
                          {
                            detailData
                              .penilaian?.[0]
                              ?.penilai_username
                          }
                        </div>
                      </div>

                    </div>

                    {/* ========================================= */}
                    {/* TANGGAL */}
                    {/* ========================================= */}

                    <div className="rounded-xl border bg-slate-50 p-4">

                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Tanggal Penilaian
                          </div>

                          <div className="mt-1 text-sm font-medium text-slate-800">
                            {formatTanggal(
                              detailData
                                .penilaian?.[0]
                                ?.tanggal_dikirim
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            ✓{" "}
                            {String(
                              detailData
                                .penilaian?.[0]
                                ?.status ?? ""
                            ).toUpperCase()}
                          </span>
                        </div>

                      </div>

                    </div>

                    {/* ========================================= */}
                    {/* RINCIAN KRITERIA */}
                    {/* ========================================= */}

                    <div>
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-800">
                          Rincian 6 Kriteria Penilaian
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Setiap kriteria menampilkan indikator,
                          pedoman pemberian nilai, bobot, dan
                          hasil penilaian.
                        </p>
                      </div>

                      <div className="space-y-4">

                        {(
                          detailData.detail ?? []
                        ).map(
                          (
                            item,
                            index
                          ) => {
                            const pedoman =
                              formatPedoman(
                                item.pedoman_nilai
                              );

                            return (
                              <div
                                key={`${item.penilaian_id}-${item.kode_kriteria}`}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                              >

                                {/* HEADER KRITERIA */}

                                <div className="border-b bg-slate-50 px-5 py-4">

                                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">

                                    <div className="flex gap-3">

                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                                        {index + 1}
                                      </div>

                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">

                                          <span className="inline-flex rounded-lg bg-slate-200 px-2.5 py-1 font-mono text-xs font-bold text-slate-700">
                                            {
                                              item.kode_kriteria
                                            }
                                          </span>

                                          <h4 className="text-base font-bold text-slate-800">
                                            {
                                              item.nama_kriteria
                                            }
                                          </h4>

                                        </div>

                                        {item.deskripsi && (
                                          <p className="mt-1 text-xs text-slate-500">
                                            {
                                              item.deskripsi
                                            }
                                          </p>
                                        )}
                                      </div>

                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">

                                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
                                        Bobot{" "}
                                        {formatNilai(
                                          item.bobot
                                        )}
                                        %
                                      </span>

                                      <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700">
                                        Nilai{" "}
                                        {formatNilai(
                                          item.nilai
                                        )}
                                      </span>

                                    </div>

                                  </div>

                                </div>

                                {/* ISI KRITERIA */}

                                <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">

                                  {/* INDIKATOR */}

                                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                                    <div className="flex items-center gap-2">

                                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
                                        I
                                      </div>

                                      <div className="text-xs font-bold uppercase tracking-wide text-blue-700">
                                        Indikator Penilaian
                                      </div>

                                    </div>

                                    <div className="mt-3 text-sm leading-6 text-blue-950">
                                      {item.indikator ||
                                        "Indikator belum tersedia."}
                                    </div>

                                  </div>

                                  {/* PEDOMAN NILAI */}

                                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">

                                    <div className="flex items-center gap-2">

                                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-700">
                                        P
                                      </div>

                                      <div className="text-xs font-bold uppercase tracking-wide text-amber-700">
                                        Pedoman Pemberian Nilai
                                      </div>

                                    </div>

                                    <div className="mt-3 space-y-2">

                                      {pedoman.length >
                                      0 ? (
                                        pedoman.map(
                                          (
                                            baris,
                                            pedomanIndex
                                          ) => (
                                            <div
                                              key={`${item.kode_kriteria}-pedoman-${pedomanIndex}`}
                                              className="flex gap-2 text-sm leading-5 text-amber-950"
                                            >
                                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />

                                              <span>
                                                {
                                                  baris
                                                }
                                              </span>
                                            </div>
                                          )
                                        )
                                      ) : (
                                        <div className="text-sm text-amber-800">
                                          Pedoman nilai belum tersedia.
                                        </div>
                                      )}

                                    </div>

                                  </div>

                                </div>

                                {/* HASIL NILAI */}

                                <div className="border-t bg-slate-50 px-5 py-4">

                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                                    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">

                                      <div className="text-xs text-slate-500">
                                        Nilai
                                      </div>

                                      <div className="mt-1 text-xl font-bold text-blue-700">
                                        {formatNilai(
                                          item.nilai
                                        )}
                                      </div>

                                    </div>

                                    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">

                                      <div className="text-xs text-slate-500">
                                        Bobot
                                      </div>

                                      <div className="mt-1 text-xl font-bold text-slate-700">
                                        {formatNilai(
                                          item.bobot
                                        )}
                                        %
                                      </div>

                                    </div>

                                    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">

                                      <div className="text-xs text-slate-500">
                                        Nilai Berbobot
                                      </div>

                                      <div className="mt-1 text-xl font-bold text-green-700">
                                        {formatNilai(
                                          item.nilai_berbobot
                                        )}
                                      </div>

                                    </div>

                                  </div>

                                  {item.catatan_kriteria && (
                                    <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3">

                                      <div className="text-xs font-semibold uppercase tracking-wide text-yellow-700">
                                        Catatan Kriteria
                                      </div>

                                      <div className="mt-1 whitespace-pre-wrap text-sm text-yellow-900">
                                        {
                                          item.catatan_kriteria
                                        }
                                      </div>

                                    </div>
                                  )}

                                </div>

                              </div>
                            );
                          }
                        )}

                      </div>
                    </div>

                    {/* ========================================= */}
                    {/* TOTAL NILAI */}
                    {/* ========================================= */}

                    <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                            Nilai Akhir Pegawai
                          </div>

                          <div className="mt-1 text-sm text-blue-800">
                            Jumlah seluruh nilai berbobot dari
                            6 kriteria.
                          </div>
                        </div>

                        <div className="text-left sm:text-right">

                          <div className="text-4xl font-bold text-blue-700">
                            {formatNilai(
                              detailData
                                .penilaian?.[0]
                                ?.nilai_akhir
                            )}
                          </div>

                          <div className="text-xs text-blue-700">
                            dari 100
                          </div>

                        </div>

                      </div>

                    </div>

                    {/* ========================================= */}
                    {/* CATATAN PENILAIAN */}
                    {/* ========================================= */}

                    {detailData
                      .penilaian?.[0]
                      ?.catatan_penilaian && (
                      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">

                        <div className="text-xs font-semibold uppercase tracking-wide text-yellow-700">
                          Catatan Penilaian
                        </div>

                        <div className="mt-2 whitespace-pre-wrap text-sm text-yellow-900">
                          {
                            detailData
                              .penilaian?.[0]
                              ?.catatan_penilaian
                          }
                        </div>

                      </div>
                    )}

                  </div>
                )}

            </div>

            {/* ================================================= */}
            {/* MODAL FOOTER */}
            {/* ================================================= */}

            <div className="flex items-center justify-end border-t bg-slate-50 px-5 py-4">

              <button
                type="button"
                onClick={tutupDetail}
                className="rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Tutup
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}