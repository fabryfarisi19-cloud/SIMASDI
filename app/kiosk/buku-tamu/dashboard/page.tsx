"use client";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  Users,
  UserRound,
  Baby,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  ArrowLeft,
   FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Statistik = {
  total_hari_ini: number;
  klien_dewasa: number;
  klien_anak: number;
  tamu_dinas: number;
  total_bulan_ini: number;
  total_tahun_ini: number;
};

type Kunjungan = {
  id: string;
  nomor_kunjungan: string;
  tanggal_kunjungan: string;
  jam_kunjungan: string;
  jenis_pengunjung: string;
  nama: string;
  nik: string | null;
  no_hp: string | null;
  instansi: string | null;
  jabatan: string | null;
  jenis_keperluan: string;
  keperluan: string | null;
  bertemu_dengan: string | null;
  jabatan_tujuan: string | null;
};

export default function DashboardBukuTamuPage() {
  const { data: session, status } = useSession();

const sessionData = session as any;
const user = sessionData?.user as any;

const roleAsli =
  sessionData?.role ||
  user?.role ||
  user?.jabatan ||
  "";

const role = String(roleAsli).trim().toLowerCase();

const bolehAkses =
  role === "admin" ||
  role === "petugas";
  const router = useRouter();

  const [statistik, setStatistik] = useState<Statistik>({
    total_hari_ini: 0,
    klien_dewasa: 0,
    klien_anak: 0,
    tamu_dinas: 0,
    total_bulan_ini: 0,
    total_tahun_ini: 0,
  });

  const [kunjungan, setKunjungan] = useState<Kunjungan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = useCallback(async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true);
      }

      const response = await fetch(
        "/api/buku-tamu/dashboard",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil data dashboard"
        );
      }

      setStatistik(result.statistik);
      setKunjungan(result.kunjungan_terbaru || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        "Gagal memuat dashboard Buku Tamu:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  const formatJam = (tanggal: string) => {
    if (!tanggal) return "-";

    return new Date(tanggal).toLocaleTimeString(
      "id-ID",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatTanggal = (tanggal: string) => {
    if (!tanggal) return "-";

    return new Date(
      `${tanggal}T00:00:00`
    ).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const labelJenis = (jenis: string) => {
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
  };

  const badgeClass = (jenis: string) => {
    switch (jenis) {
      case "KLIEN_DEWASA":
        return "bg-blue-50 text-blue-700 ring-blue-200";

      case "KLIEN_ANAK":
        return "bg-purple-50 text-purple-700 ring-purple-200";

      case "TAMU_DINAS":
        return "bg-emerald-50 text-emerald-700 ring-emerald-200";

      default:
        return "bg-gray-50 text-gray-700 ring-gray-200";
    }
  };

  const statCards = [
    {
      title: "Total Hari Ini",
      value: statistik.total_hari_ini,
      icon: Users,
      description: "Seluruh kunjungan",
      className:
        "bg-slate-900 text-white",
      iconClass:
        "bg-white/10 text-white",
    },
    {
      title: "Klien Dewasa",
      value: statistik.klien_dewasa,
      icon: UserRound,
      description: "Kunjungan hari ini",
      className:
        "bg-white border border-blue-100",
      iconClass:
        "bg-blue-50 text-blue-600",
    },
    {
      title: "Klien Anak",
      value: statistik.klien_anak,
      icon: Baby,
      description: "Kunjungan hari ini",
      className:
        "bg-white border border-purple-100",
      iconClass:
        "bg-purple-50 text-purple-600",
    },
    {
      title: "Tamu Dinas",
      value: statistik.tamu_dinas,
      icon: BriefcaseBusiness,
      description: "Kunjungan hari ini",
      className:
        "bg-white border border-emerald-100",
      iconClass:
        "bg-emerald-50 text-emerald-600",
    },
  ];
if (status === "loading") {
  return null;
}

if (!bolehAkses) {
  router.replace("/dashboard");
  return null;
}
  return (
    <main className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                  <Users size={23} />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                    Buku Tamu
                  </h1>

                  <p className="text-sm text-slate-500">
                    Bapas Kelas I Jakarta Barat
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {lastUpdated && (
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  <Clock3 size={14} />

                  <span>
                    Diperbarui{" "}
                    {lastUpdated.toLocaleTimeString(
                      "id-ID",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      }
                    )}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                {refreshing
                  ? "Memuat..."
                  : "Refresh"}
              </button>
<button
  type="button"
  onClick={() =>
    router.push("/kiosk/buku-tamu/rekap")
  }
  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
>
  <FileText size={16} />

  Rekap Buku Tamu
</button>
             
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* TITLE */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            Dashboard Kunjungan
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Rekap kunjungan Buku Tamu secara realtime.
            Dashboard diperbarui otomatis setiap 30 detik.
          </p>
        </div>

        {/* STATISTIK UTAMA */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className={`rounded-2xl p-5 shadow-sm ${card.className}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        card.title === "Total Hari Ini"
                          ? "text-white/70"
                          : "text-slate-500"
                      }`}
                    >
                      {card.title}
                    </p>

                    <p
                      className={`mt-2 text-4xl font-bold ${
                        card.title === "Total Hari Ini"
                          ? "text-white"
                          : "text-slate-900"
                      }`}
                    >
                      {loading ? "..." : card.value}
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconClass}`}
                  >
                    <Icon size={21} />
                  </div>
                </div>

                <p
                  className={`mt-4 text-xs ${
                    card.title === "Total Hari Ini"
                      ? "text-white/60"
                      : "text-slate-400"
                  }`}
                >
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* PERIODE */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <CalendarDays size={21} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Bulan Ini
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {loading
                    ? "..."
                    : statistik.total_bulan_ini}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <CalendarDays size={21} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Tahun Ini
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {loading
                    ? "..."
                    : statistik.total_tahun_ini}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TABEL */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-slate-900">
                  Kunjungan Terbaru
                </h3>

                <p className="text-xs text-slate-500">
                  50 kunjungan terakhir.
                </p>
              </div>

              <div className="text-xs text-slate-400">
                Auto-refresh: 30 detik
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-left">
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Nomor
                  </th>

                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Waktu
                  </th>

                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Pengunjung
                  </th>

                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Jenis
                  </th>

                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Bertemu Dengan
                  </th>

                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Keperluan
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      Memuat data...
                    </td>
                  </tr>
                ) : kunjungan.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <Users
                          size={35}
                          className="text-slate-300"
                        />

                        <p className="mt-3 font-medium text-slate-500">
                          Belum ada data kunjungan
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Data akan muncul setelah ada
                          pengunjung yang melakukan registrasi.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  kunjungan.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-900">
                          {item.nomor_kunjungan}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="font-medium text-slate-800">
                          {formatJam(item.jam_kunjungan)}
                        </div>

                        <div className="text-xs text-slate-400">
                          {formatTanggal(
                            item.tanggal_kunjungan
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {item.nama}
                        </div>

                        {item.nik && (
                          <div className="text-xs text-slate-400">
                            NIK: {item.nik}
                          </div>
                        )}

                        {item.instansi && (
                          <div className="text-xs text-slate-400">
                            {item.instansi}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badgeClass(
                            item.jenis_pengunjung
                          )}`}
                        >
                          {labelJenis(
                            item.jenis_pengunjung
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          {item.bertemu_dengan || "-"}
                        </div>

                        {item.jabatan_tujuan && (
                          <div className="text-xs text-slate-400">
                            {item.jabatan_tujuan}
                          </div>
                        )}
                      </td>

                      <td className="max-w-[250px] px-5 py-4">
                        <div className="font-medium text-slate-800">
                          {item.jenis_keperluan || "-"}
                        </div>

                        {item.keperluan && (
                          <div className="truncate text-xs text-slate-400">
                            {item.keperluan}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-5 flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            SIMASDI — Buku Tamu Digital
          </span>

          <span>
            Pembaruan otomatis setiap 30 detik
          </span>
        </div>
      </div>
    </main>
  );
}