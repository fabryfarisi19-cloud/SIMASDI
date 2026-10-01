
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ModeRekap = "hari" | "bulan" | "tahun";

type JenisPengunjung =
  | "SEMUA"
  | "KLIEN_DEWASA"
  | "KLIEN_ANAK"
  | "TAMU_DINAS";

type DataKunjungan = {
  id: string;
  nomor_kunjungan: string;
  tanggal_kunjungan: string;
  jam_kunjungan: string;
  jenis_pengunjung: string;
  nama: string;
  nik: string | null;
  no_hp: string | null;
  alamat: string | null;
  instansi: string | null;
  jabatan: string | null;
  jenis_keperluan: string;
  keperluan: string | null;
  bertemu_dengan: string | null;
  jabatan_tujuan: string | null;
};

type Statistik = {
  total: number;
  klien_dewasa: number;
  klien_anak: number;
  tamu_dinas: number;
};

type RekapResponse = {
  success: boolean;
  message?: string;
  filter?: {
    mode: ModeRekap;
    tanggal_mulai: string;
    tanggal_selesai: string;
    jenis: JenisPengunjung;
  };
  statistik?: Statistik;
  data?: DataKunjungan[];
};

function formatTanggal(tanggal: string) {
  if (!tanggal) return "-";

  const [tahun, bulan, hari] = tanggal.split("-");

  if (!tahun || !bulan || !hari) {
    return tanggal;
  }

  const namaBulan = [
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

  return `${Number(hari)} ${namaBulan[Number(bulan) - 1]} ${tahun}`;
}

function formatJam(timestamp: string) {
  if (!timestamp) return "-";

  const tanggal = new Date(timestamp);

  if (Number.isNaN(tanggal.getTime())) {
    return "-";
  }

  return tanggal.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function labelJenis(jenis: string) {
  switch (jenis) {
    case "KLIEN_DEWASA":
      return "Klien Dewasa";

    case "KLIEN_ANAK":
      return "Klien Anak";

    case "TAMU_DINAS":
      return "Tamu Dinas";

    default:
      return jenis || "-";
  }
}

export default function RekapBukuTamuPage() {
  const sekarang = new Date();

  const [mode, setMode] = useState<ModeRekap>("hari");

  const [tanggal, setTanggal] = useState(
    sekarang.toISOString().slice(0, 10)
  );

  const [bulan, setBulan] = useState(
    String(sekarang.getMonth() + 1).padStart(2, "0")
  );

  const [tahun, setTahun] = useState(
    sekarang.getFullYear().toString()
  );

  const [jenis, setJenis] =
    useState<JenisPengunjung>("SEMUA");

  const [data, setData] = useState<DataKunjungan[]>([]);

  const [statistik, setStatistik] = useState<Statistik>({
    total: 0,
    klien_dewasa: 0,
    klien_anak: 0,
    tamu_dinas: 0,
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [terakhirUpdate, setTerakhirUpdate] =
    useState<Date | null>(null);

  const loadRekap = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("mode", mode);
      params.set("jenis", jenis);

      if (mode === "hari") {
        params.set("tanggal", tanggal);
      }

      if (mode === "bulan") {
        params.set("bulan", bulan);
        params.set("tahun", tahun);
      }

      if (mode === "tahun") {
        params.set("tahun", tahun);
      }

      const response = await fetch(
        `/api/buku-tamu/rekap?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result: RekapResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Gagal mengambil data rekap Buku Tamu."
        );
      }

      setData(result.data || []);

      setStatistik(
        result.statistik || {
          total: 0,
          klien_dewasa: 0,
          klien_anak: 0,
          tamu_dinas: 0,
        }
      );

      setTerakhirUpdate(new Date());
    } catch (err) {
      console.error(
        "Gagal mengambil rekap Buku Tamu:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil rekap."
      );

      setData([]);
      setStatistik({
        total: 0,
        klien_dewasa: 0,
        klien_anak: 0,
        tamu_dinas: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [mode, tanggal, bulan, tahun, jenis]);

  useEffect(() => {
    loadRekap();
  }, [loadRekap]);

  const periodeLabel = useMemo(() => {
    if (mode === "hari") {
      return tanggal
        ? formatTanggal(tanggal)
        : "-";
    }

    if (mode === "bulan") {
      const namaBulan = [
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

      return `${
        namaBulan[Number(bulan) - 1] || "-"
      } ${tahun}`;
    }

    return tahun;
  }, [mode, tanggal, bulan, tahun]);

  const jenisLabel =
    jenis === "SEMUA"
      ? "Semua Jenis Pengunjung"
      : labelJenis(jenis);

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Rekap Buku Tamu
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Bapas Kelas I Jakarta Barat
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  window.location.href =
                    "/kiosk/buku-tamu/dashboard"
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Dashboard
              </button>

              <button
                type="button"
                onClick={() =>
                  window.location.href =
                    "/kiosk/buku-tamu"
                }
                className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Kembali ke Buku Tamu
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Cetak Rekap
              </button>
            </div>
          </div>
        </div>

        {/* FILTER */}
        <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm print:hidden">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800">
              Filter Rekap
            </h2>

            <p className="text-sm text-slate-500">
              Pilih periode dan jenis pengunjung.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* MODE */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Periode
              </label>

              <select
                value={mode}
                onChange={(e) =>
                  setMode(
                    e.target.value as ModeRekap
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="hari">
                  Per Hari
                </option>

                <option value="bulan">
                  Per Bulan
                </option>

                <option value="tahun">
                  Per Tahun
                </option>
              </select>
            </div>

            {/* TANGGAL */}
            {mode === "hari" && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Tanggal
                </label>

                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) =>
                    setTanggal(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            )}

            {/* BULAN */}
            {mode === "bulan" && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Bulan
                  </label>

                  <select
                    value={bulan}
                    onChange={(e) =>
                      setBulan(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="01">
                      Januari
                    </option>
                    <option value="02">
                      Februari
                    </option>
                    <option value="03">
                      Maret
                    </option>
                    <option value="04">
                      April
                    </option>
                    <option value="05">
                      Mei
                    </option>
                    <option value="06">
                      Juni
                    </option>
                    <option value="07">
                      Juli
                    </option>
                    <option value="08">
                      Agustus
                    </option>
                    <option value="09">
                      September
                    </option>
                    <option value="10">
                      Oktober
                    </option>
                    <option value="11">
                      November
                    </option>
                    <option value="12">
                      Desember
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Tahun
                  </label>

                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={tahun}
                    onChange={(e) =>
                      setTahun(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </>
            )}

            {/* TAHUN */}
            {mode === "tahun" && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Tahun
                </label>

                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={tahun}
                  onChange={(e) =>
                    setTahun(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            )}

            {/* JENIS */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Jenis Pengunjung
              </label>

              <select
                value={jenis}
                onChange={(e) =>
                  setJenis(
                    e.target.value as JenisPengunjung
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="SEMUA">
                  Semua Jenis
                </option>

                <option value="KLIEN_DEWASA">
                  Klien Dewasa
                </option>

                <option value="KLIEN_ANAK">
                  Klien Anak
                </option>

                <option value="TAMU_DINAS">
                  Tamu Dinas
                </option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadRekap}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Memuat..."
                : "Tampilkan Rekap"}
            </button>

            <button
              type="button"
              onClick={() => {
                const sekarangBaru = new Date();

                setMode("hari");

                setTanggal(
                  sekarangBaru
                    .toISOString()
                    .slice(0, 10)
                );

                setBulan(
                  String(
                    sekarangBaru.getMonth() + 1
                  ).padStart(2, "0")
                );

                setTahun(
                  sekarangBaru
                    .getFullYear()
                    .toString()
                );

                setJenis("SEMUA");
              }}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="font-bold">
              Gagal mengambil data
            </div>

            <div className="mt-1">
              {error}
            </div>
          </div>
        )}

        {/* PRINT HEADER */}
        <div className="mb-5 hidden print:block">
          <div className="text-center">
            <h1 className="text-xl font-bold">
              REKAP BUKU TAMU
            </h1>

            <p className="text-sm font-semibold">
              BAPAS KELAS I JAKARTA BARAT
            </p>

            <p className="mt-1 text-sm">
              Periode: {periodeLabel}
            </p>

            <p className="text-sm">
              Jenis: {jenisLabel}
            </p>
          </div>
        </div>

        {/* STATISTIK */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Kunjungan
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">
              {statistik.total}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Klien Dewasa
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {statistik.klien_dewasa}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Klien Anak
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {statistik.klien_anak}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Tamu Dinas
            </p>

            <p className="mt-2 text-3xl font-bold text-purple-600">
              {statistik.tamu_dinas}
            </p>
          </div>
        </section>

        {/* INFORMASI PERIODE */}
        <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
            <div>
              <span className="font-semibold text-slate-700">
                Periode:
              </span>{" "}
              <span className="text-slate-600">
                {periodeLabel}
              </span>
            </div>

            <div>
              <span className="font-semibold text-slate-700">
                Jenis:
              </span>{" "}
              <span className="text-slate-600">
                {jenisLabel}
              </span>
            </div>

            <div className="text-slate-500 print:hidden">
              {terakhirUpdate
                ? `Diperbarui ${terakhirUpdate.toLocaleTimeString(
                    "id-ID",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    }
                  )}`
                : ""}
            </div>
          </div>
        </section>

        {/* TABEL */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-800 text-left text-white">
                  <th className="px-4 py-3 text-center">
                    No
                  </th>

                  <th className="px-4 py-3">
                    Nomor Kunjungan
                  </th>

                  <th className="px-4 py-3">
                    Tanggal
                  </th>

                  <th className="px-4 py-3">
                    Jam
                  </th>

                  <th className="px-4 py-3">
                    Jenis Pengunjung
                  </th>

                  <th className="px-4 py-3">
                    Nama
                  </th>

                  <th className="px-4 py-3">
                    NIK
                  </th>

                  <th className="px-4 py-3">
                    Instansi
                  </th>

                  <th className="px-4 py-3">
                    Keperluan
                  </th>

                  <th className="px-4 py-3">
                    Bertemu Dengan
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Memuat data rekap...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Tidak ada data kunjungan pada
                      periode dan filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-center">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {item.nomor_kunjungan}
                      </td>

                      <td className="px-4 py-3">
                        {formatTanggal(
                          item.tanggal_kunjungan
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatJam(
                          item.jam_kunjungan
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {labelJenis(
                          item.jenis_pengunjung
                        )}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {item.nama || "-"}
                      </td>

                      <td className="px-4 py-3">
                        {item.nik || "-"}
                      </td>

                      <td className="px-4 py-3">
                        {item.instansi || "-"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {item.jenis_keperluan ||
                            "-"}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {item.keperluan || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {item.bertemu_dengan ||
                            "-"}
                        </div>

                        {item.jabatan_tujuan && (
                          <div className="mt-1 text-xs text-slate-500">
                            {item.jabatan_tujuan}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 px-4 py-4 text-sm text-slate-500">
            Menampilkan{" "}
            <span className="font-semibold text-slate-700">
              {data.length}
            </span>{" "}
            data kunjungan.
          </div>
        </section>

        {/* FOOTER PRINT */}
        <div className="mt-8 hidden print:block">
          <div className="flex justify-end">
            <div className="w-64 text-center text-sm">
              <p>
                Jakarta Barat,{" "}
                {formatTanggal(
                  new Date()
                    .toISOString()
                    .slice(0, 10)
                )}
              </p>

              <p className="mt-16 font-semibold">
                Petugas Buku Tamu
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 12mm;
          }

          body {
            background: white !important;
          }

          body * {
            visibility: visible;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }

          table {
            font-size: 9px !important;
          }

          th,
          td {
            padding: 5px !important;
          }

          .shadow-sm {
            box-shadow: none !important;
          }

          main {
            padding: 0 !important;
          }
        }
      `}</style>
    </main>
  );
}

