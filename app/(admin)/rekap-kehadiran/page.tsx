"use client";

import { useEffect, useMemo, useState } from "react";

type RekapItem = {
  id: string;
  pengguna_id: number;
  tanggal: string;

  jam_masuk: string | null;
  jam_pulang: string | null;

  latitude_masuk: number | null;
  longitude_masuk: number | null;
  akurasi_masuk: number | null;
  jarak_masuk: number | null;

  latitude_pulang: number | null;
  longitude_pulang: number | null;
  akurasi_pulang: number | null;
  jarak_pulang: number | null;

  status: string;
  keterangan: string | null;

  nama: string;
  username: string;
  role: string;
};

type Statistik = {
  total: number;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  tidak_hadir: number;
};

export default function RekapKehadiranPage() {
  const sekarang = new Date();

const formatterIndonesia = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const tanggalIndonesia = formatterIndonesia.formatToParts(sekarang);

const tahunIndonesia =
  tanggalIndonesia.find((item) => item.type === "year")?.value ||
  String(sekarang.getFullYear());

const bulanIndonesia =
  tanggalIndonesia.find((item) => item.type === "month")?.value ||
  String(sekarang.getMonth() + 1).padStart(2, "0");

const [bulan, setBulan] = useState(bulanIndonesia);

const [tahun, setTahun] = useState(tahunIndonesia);

  const [data, setData] = useState<RekapItem[]>([]);
  const [statistik, setStatistik] = useState<Statistik>({
    total: 0,
    hadir: 0,
    terlambat: 0,
    izin: 0,
    sakit: 0,
    tidak_hadir: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [detail, setDetail] = useState<RekapItem | null>(
    null
  );

  // =====================================================
  // Nama bulan
  // =====================================================
  const namaBulan = useMemo(() => {
    const daftar = [
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

    return daftar[Number(bulan) - 1] || "";
  }, [bulan]);

  // =====================================================
  // Format jam
  // =====================================================
  function formatJam(value: string | null) {
    if (!value) return "-";

    const date = new Date(value);

    return date.toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  // =====================================================
  // Format tanggal
  // =====================================================
  function formatTanggal(value: string) {
    if (!value) return "-";

    const date = new Date(`${value}T00:00:00`);

    return date.toLocaleDateString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  // =====================================================
  // Status badge
  // =====================================================
  function statusBadge(status: string) {
    const normalized = String(status || "")
      .trim()
      .toLowerCase();

    if (normalized === "hadir") {
      return (
        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          HADIR
        </span>
      );
    }

    if (normalized === "terlambat") {
      return (
        <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
          TERLAMBAT
        </span>
      );
    }

    if (normalized === "izin") {
      return (
        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          IZIN
        </span>
      );
    }

    if (normalized === "sakit") {
      return (
        <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
          SAKIT
        </span>
      );
    }

    if (normalized === "tidak hadir") {
      return (
        <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          TIDAK HADIR
        </span>
      );
    }

    return (
      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        {status || "-"}
      </span>
    );
  }

  // =====================================================
  // Ambil data API
  // =====================================================
  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const tanggalMulai = `${tahun}-${bulan}-01`;

      const tanggalTerakhir = new Date(
        Number(tahun),
        Number(bulan),
        0
      ).getDate();

      const tanggalSelesai = `${tahun}-${bulan}-${String(
        tanggalTerakhir
      ).padStart(2, "0")}`;

      const response = await fetch(
        `/api/rekap-kehadiran?tanggal_mulai=${tanggalMulai}&tanggal_selesai=${tanggalSelesai}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Gagal mengambil rekap kehadiran."
        );
      }

      setData(result.data || []);

      setStatistik(
        result.statistik || {
          total: 0,
          hadir: 0,
          terlambat: 0,
          izin: 0,
          sakit: 0,
          tidak_hadir: 0,
        }
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Terjadi kesalahan saat mengambil data."
      );

      setData([]);
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // Load awal
  // =====================================================
  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // Filter pencarian
  // =====================================================
  const filteredData = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) return data;

    return data.filter((item) => {
      return (
        item.nama
          ?.toLowerCase()
          .includes(keyword) ||
        item.username
          ?.toLowerCase()
          .includes(keyword) ||
        item.tanggal
          ?.toLowerCase()
          .includes(keyword) ||
        item.status
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [data, search]);

  // =====================================================
  // Export CSV
  // =====================================================
  function exportCSV() {
    if (filteredData.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    const header = [
      "Tanggal",
      "NIP",
      "Nama",
      "Role",
      "Jam Masuk",
      "Jam Pulang",
      "Jarak Masuk (m)",
      "Jarak Pulang (m)",
      "Akurasi Masuk (m)",
      "Akurasi Pulang (m)",
      "Status",
      "Keterangan",
    ];

    const rows = filteredData.map((item) => [
      item.tanggal,
      item.username,
      item.nama,
      item.role,
      formatJam(item.jam_masuk),
      formatJam(item.jam_pulang),
      item.jarak_masuk ?? "",
      item.jarak_pulang ?? "",
      item.akurasi_masuk ?? "",
      item.akurasi_pulang ?? "",
      item.status,
      item.keterangan ?? "",
    ]);

    const csv = [
      header,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      ["\ufeff" + csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
      `rekap-kehadiran-${tahun}-${bulan}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  // =====================================================
  // Render
  // =====================================================
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px]">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Rekap Kehadiran
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Rekap absensi pegawai berdasarkan lokasi kantor.
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {namaBulan} {tahun}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {loading
                ? "Memuat..."
                : "🔄 Refresh"}
            </button>

            <button
              onClick={exportCSV}
              disabled={filteredData.length === 0}
              className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              📊 Export CSV
            </button>
          </div>
        </div>

        {/* FILTER */}
        <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Bulan
              </label>

              <select
                value={bulan}
                onChange={(e) =>
                  setBulan(e.target.value)
                }
                className="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-slate-500"
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
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tahun
              </label>

              <select
                value={tahun}
                onChange={(e) =>
                  setTahun(e.target.value)
                }
                className="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-slate-500"
              >
                {Array.from(
                  {
                    length: 6,
                  },
                  (_, index) =>
                    sekarang.getFullYear() -
                    2 +
                    index
                ).map((value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Cari Pegawai
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Cari nama, NIP, tanggal, atau status..."
                className="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <button
            onClick={loadData}
            className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            🔍 Tampilkan Rekap
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            ❌ {error}
          </div>
        )}

        {/* STATISTIK */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard
            title="Total"
            value={statistik.total}
            icon="📋"
          />

          <StatCard
            title="Hadir"
            value={statistik.hadir}
            icon="✅"
          />

          <StatCard
            title="Terlambat"
            value={statistik.terlambat}
            icon="⏰"
          />

          <StatCard
            title="Izin"
            value={statistik.izin}
            icon="📝"
          />

          <StatCard
            title="Sakit"
            value={statistik.sakit}
            icon="🤒"
          />

          <StatCard
            title="Tidak Hadir"
            value={statistik.tidak_hadir}
            icon="❌"
          />
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold text-slate-800">
                  Data Kehadiran
                </h2>

                <p className="text-xs text-slate-500">
                  Menampilkan {filteredData.length} data
                </p>
              </div>

              <div className="text-xs text-slate-400">
                Periode {namaBulan} {tahun}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    No
                  </th>

                  <th className="px-4 py-3 text-left">
                    Tanggal
                  </th>

                  <th className="px-4 py-3 text-left">
                    Pegawai
                  </th>

                  <th className="px-4 py-3 text-left">
                    NIP
                  </th>

                  <th className="px-4 py-3 text-center">
                    Masuk
                  </th>

                  <th className="px-4 py-3 text-center">
                    Pulang
                  </th>

                  <th className="px-4 py-3 text-center">
                    Jarak
                  </th>

                  <th className="px-4 py-3 text-center">
                    Status
                  </th>

                  <th className="px-4 py-3 text-center">
                    Detail
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      Memuat data kehadiran...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      Belum ada data kehadiran pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredData.map(
                    (item, index) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          {index + 1}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatTanggal(
                            item.tanggal
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">
                            {item.nama}
                          </div>

                          <div className="text-xs text-slate-400">
                            {item.role}
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          {item.username}
                        </td>

                        <td className="px-4 py-3 text-center font-medium">
                          {formatJam(
                            item.jam_masuk
                          )}
                        </td>

                        <td className="px-4 py-3 text-center font-medium">
                          {formatJam(
                            item.jam_pulang
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="text-xs">
                            <div>
                              M:{" "}
                              {item.jarak_masuk ??
                                "-"}{" "}
                              m
                            </div>

                            <div>
                              P:{" "}
                              {item.jarak_pulang ??
                                "-"}{" "}
                              m
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center">
                          {statusBadge(
                            item.status
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              setDetail(item)
                            }
                            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            👁 Detail
                          </button>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL DETAIL */}
        {detail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Detail Kehadiran
                  </h2>

                  <p className="text-sm text-slate-500">
                    {detail.nama}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setDetail(null)
                  }
                  className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-5 p-5">
                {/* IDENTITAS */}
                <div>
                  <h3 className="mb-3 font-semibold text-slate-800">
                    Identitas
                  </h3>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <DetailItem
                      label="Nama"
                      value={detail.nama}
                    />

                    <DetailItem
                      label="NIP"
                      value={detail.username}
                    />

                    <DetailItem
                      label="Jabatan / Role"
                      value={detail.role}
                    />

                    <DetailItem
                      label="Tanggal"
                      value={formatTanggal(
                        detail.tanggal
                      )}
                    />

                    <DetailItem
                      label="Status"
                      value={detail.status}
                    />

                    <DetailItem
                      label="Keterangan"
                      value={
                        detail.keterangan ||
                        "-"
                      }
                    />
                  </div>
                </div>

                {/* MASUK */}
                <div className="rounded-xl bg-green-50 p-4">
                  <h3 className="mb-3 font-semibold text-green-800">
                    🟢 Absen Masuk
                  </h3>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <DetailItem
                      label="Jam"
                      value={formatJam(
                        detail.jam_masuk
                      )}
                    />

                    <DetailItem
                      label="Jarak dari kantor"
                      value={
                        detail.jarak_masuk !==
                        null
                          ? `${detail.jarak_masuk} meter`
                          : "-"
                      }
                    />

                    <DetailItem
                      label="Latitude"
                      value={
                        detail.latitude_masuk !==
                        null
                          ? String(
                              detail.latitude_masuk
                            )
                          : "-"
                      }
                    />

                    <DetailItem
                      label="Longitude"
                      value={
                        detail.longitude_masuk !==
                        null
                          ? String(
                              detail.longitude_masuk
                            )
                          : "-"
                      }
                    />

                    <DetailItem
                      label="Akurasi GPS"
                      value={
                        detail.akurasi_masuk !==
                        null
                          ? `± ${Math.round(
                              detail.akurasi_masuk
                            )} meter`
                          : "-"
                      }
                    />
                  </div>
                </div>

                {/* PULANG */}
                <div className="rounded-xl bg-blue-50 p-4">
                  <h3 className="mb-3 font-semibold text-blue-800">
                    🔵 Absen Pulang
                  </h3>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <DetailItem
                      label="Jam"
                      value={formatJam(
                        detail.jam_pulang
                      )}
                    />

                    <DetailItem
                      label="Jarak dari kantor"
                      value={
                        detail.jarak_pulang !==
                        null
                          ? `${detail.jarak_pulang} meter`
                          : "-"
                      }
                    />

                    <DetailItem
                      label="Latitude"
                      value={
                        detail.latitude_pulang !==
                        null
                          ? String(
                              detail.latitude_pulang
                            )
                          : "-"
                      }
                    />

                    <DetailItem
                      label="Longitude"
                      value={
                        detail.longitude_pulang !==
                        null
                          ? String(
                              detail.longitude_pulang
                            )
                          : "-"
                      }
                    />

                    <DetailItem
                      label="Akurasi GPS"
                      value={
                        detail.akurasi_pulang !==
                        null
                          ? `± ${Math.round(
                              detail.akurasi_pulang
                            )} meter`
                          : "-"
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t p-5">
                <button
                  onClick={() =>
                    setDetail(null)
                  }
                  className="w-full rounded-xl bg-slate-800 px-4 py-3 font-semibold text-white hover:bg-slate-700"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// COMPONENT STAT CARD
// =====================================================
function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          {title}
        </span>

        <span className="text-lg">
          {icon}
        </span>
      </div>

      <div className="mt-2 text-2xl font-bold text-slate-800">
        {value}
      </div>
    </div>
  );
}

// =====================================================
// COMPONENT DETAIL ITEM
// =====================================================
function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-white/70 p-3">
      <div className="text-xs text-slate-500">
        {label}
      </div>

      <div className="mt-1 break-all text-sm font-medium text-slate-800">
        {value}
      </div>
    </div>
  );
}