"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  CheckCircle2,
    Clock3,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
  Wrench,
} from "lucide-react";

type Pengaduan = {
  id: string;
  nomor_laporan: string;
  nip_pelapor?: string | null;
  nama_pelapor: string;
  kategori: string;
  lokasi: string;
  uraian: string;
  foto_url?: string | null;
  status: string;
  catatan_petugas?: string | null;
  tindak_lanjut?: string | null;
  ditangani_oleh?: string | null;
  tanggal_diproses?: string | null;
  tanggal_selesai?: string | null;
  created_at: string;
};

type UserInfo = {
  nama?: string;
  username?: string;
  role?: string;
  jabatan?: string;
};

const ROLE_APPROVAL = [
  "admin",
  "admin umum",
  "kaur umum",
];

function normalizeRole(role?: string) {
  return String(role || "")
    .trim()
    .toLowerCase();
}

function formatTanggal(value?: string | null) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
export default function ApprovalPengaduanPage() {
  const { data: session } = useSession();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [data, setData] = useState<Pengaduan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
const [filterStatus, setFilterStatus] = 
useState("Menunggu");

  const [selected, setSelected] =
    useState<Pengaduan | null>(null);

  const [showDetail, setShowDetail] = useState(false);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [showTolak, setShowTolak] = useState(false);

  const [catatanTolak, setCatatanTolak] = useState("");
 const roleRaw =
  (session as any)?.role ||
  (session as any)?.user?.role ||
  (session as any)?.user?.jabatan ||
  user?.role ||
  user?.jabatan ||
  "";

const role = normalizeRole(roleRaw);

const bolehApproval =
  ROLE_APPROVAL.includes(role);

  /* =========================================================
     BACA USER
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        if (typeof window === "undefined") return;

        const candidates = [
          "user",
          "simasdi-user",
          "simasdiUser",
          "pengguna",
        ];

        let found: UserInfo | null = null;

        for (const key of candidates) {
          const raw = localStorage.getItem(key);

          if (!raw) continue;

          try {
            const parsed = JSON.parse(raw);

            if (
              parsed &&
              typeof parsed === "object"
            ) {
              found = parsed;
              break;
            }
          } catch {
            // lanjut
          }
        }

        if (mounted) {
          setUser(found);
        }
      } catch (error) {
        console.error(
          "Gagal membaca user:",
          error
        );
      } finally {
        if (mounted) {
          setLoadingUser(false);
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     LOAD PENGADUAN
  ========================================================= */

  async function loadData(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        "/api/pengaduan-sarpras?semua=true",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Gagal mengambil data pengaduan."
        );
      }

      const rows = Array.isArray(result.data)
        ? result.data
        : [];

      setData(rows);
    } catch (error: any) {
      console.error(
        "Gagal mengambil pengaduan:",
        error
      );

      alert(
        error?.message ||
          "Gagal mengambil data pengaduan."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!loadingUser && bolehApproval) {
      loadData();
    }
  }, [loadingUser, bolehApproval]);

  /* =========================================================
     HANYA LAPORAN MENUNGGU
  ========================================================= */
const dataTampil = useMemo(() => {
  const keyword = search.trim().toLowerCase();

  return data.filter((item) => {
    // Filter status
    if (
      filterStatus !== "Semua" &&
      item.status !== filterStatus
    ) {
      return false;
    }

    // Filter pencarian
    if (!keyword) {
      return true;
    }

    return [
      item.nomor_laporan,
      item.nama_pelapor,
      item.nip_pelapor,
      item.kategori,
      item.lokasi,
      item.uraian,
    ]
      .filter(Boolean)
      .some((value) =>
        String(value)
          .toLowerCase()
          .includes(keyword)
      );
  });
}, [data, search, filterStatus]);

  /* =========================================================
     DETAIL
  ========================================================= */

  function bukaDetail(item: Pengaduan) {
    setSelected(item);
    setShowDetail(true);
  }

  function tutupDetail() {
    if (processingId) return;

    setShowDetail(false);
    setSelected(null);
  }

  /* =========================================================
     APPROVE
  ========================================================= */

  async function approvePengaduan(
    item: Pengaduan
  ) {
    if (!bolehApproval) return;

    const yakin = window.confirm(
      `Setujui laporan ${item.nomor_laporan} dan ubah status menjadi Diproses?`
    );

    if (!yakin) return;

    try {
      setProcessingId(item.id);

      const response = await fetch(
        "/api/pengaduan-sarpras",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: item.id,
            status: "Diproses",
            catatan_petugas:
              "Laporan telah disetujui dan diproses.",
            tindak_lanjut: "",
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Gagal menyetujui pengaduan."
        );
      }

      alert(
        `Laporan ${item.nomor_laporan} berhasil disetujui dan diproses.`
      );

      setShowDetail(false);
      setSelected(null);

      await loadData();
    } catch (error: any) {
      console.error(
        "Gagal approve:",
        error
      );

      alert(
        error?.message ||
          "Gagal menyetujui pengaduan."
      );
    } finally {
      setProcessingId(null);
    }
  }
 
/* =========================================================
   KIRIM KE TEKNISI / PIHAK KETIGA
========================================================= */

async function kirimKeTeknisi(item: Pengaduan) {
  if (!bolehApproval) return;

  const yakin = window.confirm(
    `Kirim laporan ${item.nomor_laporan} ke Teknisi / Pihak Ketiga?`
  );

  if (!yakin) return;

  try {
    setProcessingId(item.id);

    const response = await fetch(
      "/api/pengaduan-sarpras",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.id,
          status: "Menunggu Perbaikan/Pihak Ketiga",
          catatan_petugas:
            "Laporan diteruskan kepada Teknisi / Pihak Ketiga untuk penanganan.",
          tindak_lanjut:
            "Menunggu penanganan Teknisi / Pihak Ketiga.",
        }),
      }
    );

    const result = await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          "Gagal mengirim laporan ke Teknisi / Pihak Ketiga."
      );
    }

    alert(
      `Laporan ${item.nomor_laporan} berhasil dikirim ke Teknisi / Pihak Ketiga.`
    );

    setShowDetail(false);
    setSelected(null);

    await loadData();
  } catch (error: any) {
    console.error(
      "Gagal mengirim ke teknisi:",
      error
    );

    alert(
      error?.message ||
        "Gagal mengirim laporan ke Teknisi / Pihak Ketiga."
    );
  } finally {
    setProcessingId(null);
  }
}
async function tandaiSelesai(item: Pengaduan) {
  if (!bolehApproval) return;

  const yakin = window.confirm(
    `Tandai laporan ${item.nomor_laporan} sebagai Selesai?`
  );

  if (!yakin) return;

  try {
    setProcessingId(item.id);

    const response = await fetch(
      "/api/pengaduan-sarpras",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.id,
          status: "Selesai",
          catatan_petugas:
            "Perbaikan/penanganan telah selesai.",
          tindak_lanjut:
            "Pengaduan telah selesai ditangani.",
        }),
      }
    );

    const result = await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          "Gagal menandai pengaduan sebagai selesai."
      );
    }

    alert(
      `Laporan ${item.nomor_laporan} berhasil ditandai sebagai Selesai.`
    );

    setShowDetail(false);
    setSelected(null);

    await loadData();
  } catch (error: any) {
    console.error(
      "Gagal menandai selesai:",
      error
    );

    alert(
      error?.message ||
        "Gagal menandai pengaduan sebagai selesai."
    );
  } finally {
    setProcessingId(null);
  }
}
  /* =========================================================
     TOLAK
  ========================================================= */

  function bukaTolak(item: Pengaduan) {
    setSelected(item);
    setCatatanTolak("");
    setShowTolak(true);
  }

  function tutupTolak() {
    if (processingId) return;

    setShowTolak(false);
    setCatatanTolak("");
  }

  async function tolakPengaduan() {
    if (!selected) return;

    if (!catatanTolak.trim()) {
      alert(
        "Catatan penolakan wajib diisi."
      );
      return;
    }

    try {
      setProcessingId(selected.id);

      const response = await fetch(
        "/api/pengaduan-sarpras",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: selected.id,
            status: "Ditolak",
            catatan_petugas:
              catatanTolak.trim(),
            tindak_lanjut: "",
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Gagal menolak pengaduan."
        );
      }

      alert(
        `Laporan ${selected.nomor_laporan} telah ditolak.`
      );

      setShowTolak(false);
      setShowDetail(false);
      setSelected(null);
      setCatatanTolak("");

      await loadData();
    } catch (error: any) {
      console.error(
        "Gagal menolak:",
        error
      );

      alert(
        error?.message ||
          "Gagal menolak pengaduan."
      );
    } finally {
      setProcessingId(null);
    }
  }

  /* =========================================================
     LOADING USER
  ========================================================= */

  if (loadingUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2
            size={24}
            className="animate-spin"
          />
          Memuat pengguna...
        </div>
      </div>
    );
  }

  /* =========================================================
     AKSES DITOLAK
  ========================================================= */

  if (!bolehApproval) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-5">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <XCircle
            size={42}
            className="mx-auto text-red-500"
          />

          <h1 className="mt-4 text-xl font-bold text-red-700">
            Akses Ditolak
          </h1>

          <p className="mt-2 text-sm text-red-600">
            Halaman Approval Pengaduan hanya
            dapat diakses oleh Admin, Admin Umum,
            dan Kaur Umum.
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  const PILIHAN_STATUS = [
  {
    value: "Menunggu",
    label: "Menunggu Approval",
    icon: Clock3,
  },
  {
    value: "Diproses",
    label: "Diproses",
    icon: Wrench,
  },
  {
    value: "Menunggu Perbaikan/Pihak Ketiga",
    label: "Menunggu Teknisi / Pihak Ketiga",
    icon: RefreshCw,
  },
  {
    value: "Selesai",
    label: "Selesai",
    icon: CheckCircle2,
  },
  {
    value: "Ditolak",
    label: "Ditolak",
    icon: XCircle,
  },
  {
    value: "Semua",
    label: "Semua Pengaduan",
    icon: FileText,
  },
];
  return (
    <div className="w-full space-y-6 pb-10">

      {/* HEADER */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-5 text-white shadow-lg md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-2 text-blue-200">
              <ShieldCheck size={20} />

              <span className="text-sm font-medium">
                Pengelolaan Sarana dan Prasarana
              </span>
            </div>

            <h1 className="text-2xl font-bold md:text-3xl">
              Approval Pengaduan Sarpras
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
              Periksa laporan pengaduan sebelum
              diproses atau ditolak.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-slate-200">
              <ShieldCheck size={14} />

              Role:
              <span className="font-semibold text-white">
                {user?.role || "-"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
            <Clock3 size={20} />

            <div>
              <div className="text-xs text-blue-200">
                Menunggu Approval
              </div>

              <div className="text-2xl font-bold">
                {data.filter(
                  (item) =>
                    item.status ===
                    "Menunggu"
                ).length}
              </div>
            </div>
          </div>
        </div>
      </div>
{/* PILIHAN STATUS */}
<div className="mt-4 flex flex-wrap gap-2">
  {PILIHAN_STATUS.map((item) => {
    const Icon = item.icon;
    const aktif =
      filterStatus === item.value;

    return (
      <button
        key={item.value}
        type="button"
        onClick={() =>
          setFilterStatus(item.value)
        }
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
          aktif
            ? "bg-blue-600 text-white shadow-md"
            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        <Icon size={16} />
        {item.label}

        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            aktif
              ? "bg-white/20 text-white"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {item.value === "Semua"
            ? data.length
            : data.filter(
                (x) =>
                  x.status === item.value
              ).length}
        </span>
      </button>
    );
  })}
</div>
      {/* FILTER */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <div className="relative w-full md:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Cari nomor, pelapor, kategori, lokasi..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              loadData(true)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>
      </div>

      {/* DAFTAR */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 p-4 md:p-5">
          <h2 className="text-lg font-bold text-slate-800">
            Laporan {filterStatus === "Semua" ? "" : filterStatus}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {dataTampil.length} laporan
            {filterStatus === "Semua" ? "" : ` ${filterStatus.toLowerCase()}`}.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <div className="flex items-center gap-3 text-slate-500">
              <Loader2
                size={22}
                className="animate-spin"
              />
              Memuat data...
            </div>
          </div>
        ) : dataTampil.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">
            <div className="mb-3 rounded-full bg-emerald-100 p-4">
              <CheckCircle2
                size={32}
                className="text-emerald-600"
              />
            </div>

            <h3 className="font-semibold text-slate-700">
              Tidak ada laporan {filterStatus === "Semua" ? "" : filterStatus.toLowerCase()}
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              Semua pengaduan sudah diproses
              atau belum ada laporan baru.
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE */}
            <div className="divide-y divide-slate-100 md:hidden">
              {dataTampil.map(
                (item) => (
                  <div
                    key={item.id}
                    className="p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-800">
                          {item.nomor_laporan}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {formatTanggal(
                            item.created_at
                          )}
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                       <AlertCircle
  size={13}
/>
{item.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">

                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Pelapor
                        </div>

                        <div className="mt-1 text-sm font-medium text-slate-700">
                          {item.nama_pelapor}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Kategori
                        </div>

                        <div className="mt-1 text-sm text-slate-700">
                          {item.kategori}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Lokasi
                        </div>

                        <div className="mt-1 flex gap-1.5 text-sm text-slate-600">
                          <MapPin
                            size={15}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />
                          {item.lokasi}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">

                        <button
                          type="button"
                          onClick={() =>
                            bukaDetail(
                              item
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                        >
                          <Eye size={14} />
                          Detail
                        </button>
{item.status === "Menunggu" && (
  <>
    <button
      type="button"
      disabled={processingId === item.id}
      onClick={() =>
        approvePengaduan(item)
      }
      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
    >
      <CheckCircle2 size={14} />
      Setujui
    </button>

   
  </>
)}

{item.status === "Diproses" && (
  <button
    type="button"
    disabled={processingId === item.id}
    onClick={() =>
      kirimKeTeknisi(item)
    }
    className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
  >
    <Wrench size={14} />
    Kirim ke Teknisi
  </button>
)}

{item.status === "Menunggu Perbaikan/Pihak Ketiga" && (
  <button
    type="button"
    disabled={processingId === item.id}
    onClick={() => tandaiSelesai(item)}
    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
  >
    <CheckCircle2 size={14} />
    Tandai Selesai
  </button>
)}

                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* DESKTOP */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">
                      Laporan
                    </th>

                    <th className="px-5 py-3">
                      Pelapor
                    </th>

                    <th className="px-5 py-3">
                      Kategori
                    </th>

                    <th className="px-5 py-3">
                      Lokasi
                    </th>

                    <th className="px-5 py-3">
                      Foto
                    </th>

                    <th className="px-5 py-3">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {dataTampil.map(
                    (item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 align-top">
                          <div className="font-semibold text-slate-800">
                            {item.nomor_laporan}
                          </div>

                          <div className="mt-1 max-w-[220px] truncate text-sm text-slate-500">
                            {item.uraian}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {formatTanggal(
                              item.created_at
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="text-sm font-medium text-slate-700">
                            {item.nama_pelapor}
                          </div>

                          {item.nip_pelapor && (
                            <div className="mt-1 text-xs text-slate-400">
                              {item.nip_pelapor}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {item.kategori}
                          </span>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="flex max-w-[180px] gap-1.5 text-sm text-slate-600">
                            <MapPin
                              size={15}
                              className="mt-0.5 shrink-0 text-slate-400"
                            />

                            {item.lokasi}
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top">
                          {item.foto_url ? (
                            <a
                              href={
                                item.foto_url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              <ImageIcon
                                size={14}
                              />
                              Foto
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          <AlertCircle size={13} />
{item.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right align-top">
                         <div className="flex justify-end gap-2">

  <button
    type="button"
    onClick={() =>
      bukaDetail(item)
    }
    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
  >
    <Eye size={14} />
    Detail
  </button>

  {item.status === "Menunggu" && (
    <>
      <button
        type="button"
        disabled={processingId === item.id}
        onClick={() =>
          approvePengaduan(item)
        }
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        <CheckCircle2 size={14} />
        Setujui
      </button>

      <button
        type="button"
        disabled={processingId === item.id}
        onClick={() =>
          bukaTolak(item)
        }
        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        <XCircle size={14} />
        Tolak
      </button>
    </>
  )}

  {item.status === "Diproses" && (
    <button
      type="button"
      disabled={processingId === item.id}
      onClick={() =>
        kirimKeTeknisi(item)
      }
      className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
    >
      <Wrench size={14} />
      Kirim ke Teknisi
    </button>
  )}

  {item.status === "Menunggu Perbaikan/Pihak Ketiga" && (
    <button
      type="button"
      disabled={processingId === item.id}
      onClick={() =>
        tandaiSelesai(item)
      }
      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
    >
      <CheckCircle2 size={14} />
      Tandai Selesai
    </button>
  )}

</div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* =====================================================
          MODAL DETAIL
      ===================================================== */}

      {showDetail && selected && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm md:items-center md:p-5">

          <div className="flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl md:max-w-3xl md:rounded-2xl">

            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">

              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {selected.nomor_laporan}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {formatTanggal(
                    selected.created_at
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={tutupDetail}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            <div className="overflow-y-auto p-5">

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ImageIcon size={17} />
                    Foto Laporan
                  </div>

                  {selected.foto_url ? (
                    <a
                      href={
                        selected.foto_url
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <img
                        src={
                          selected.foto_url
                        }
                        alt={`Foto ${selected.nomor_laporan}`}
                        className="max-h-[360px] w-full object-contain"
                      />
                    </a>
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">
                      Tidak ada foto
                    </div>
                  )}
                </div>

                <div className="space-y-4">

                  <InfoItem
                    icon={
                      <FileText
                        size={16}
                      />
                    }
                    label="Nomor Laporan"
                    value={
                      selected.nomor_laporan
                    }
                  />

                  <InfoItem
                    icon={
                      <ShieldCheck
                        size={16}
                      />
                    }
                    label="Pelapor"
                    value={
                      selected.nama_pelapor
                    }
                  />

                  <InfoItem
                    icon={
                      <FileText
                        size={16}
                      />
                    }
                    label="Kategori"
                    value={
                      selected.kategori
                    }
                  />

                  <InfoItem
                    icon={
                      <MapPin
                        size={16}
                      />
                    }
                    label="Lokasi"
                    value={
                      selected.lokasi
                    }
                  />

                  <InfoItem
                    icon={
                      <MessageSquare
                        size={16}
                      />
                    }
                    label="Uraian"
                    value={
                      selected.uraian
                    }
                  />

                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
{selected.status === "Menunggu" && (
  <>
    <button
      type="button"
      disabled={!!processingId}
      onClick={() => approvePengaduan(selected)}
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
    >
      <CheckCircle2 size={17} />
      Setujui & Proses
    </button>

    <button
      type="button"
      disabled={!!processingId}
      onClick={() => bukaTolak(selected)}
      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
    >
      <XCircle size={17} />
      Tolak
    </button>
  </>
)}

{selected.status === "Diproses" && (
  <button
    type="button"
    disabled={!!processingId}
    onClick={() => kirimKeTeknisi(selected)}
    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
  >
    <Wrench size={17} />
    Kirim ke Teknisi
  </button>
)}

{selected.status === "Menunggu Perbaikan/Pihak Ketiga" && (
  <button
    type="button"
    disabled={!!processingId}
    onClick={() => tandaiSelesai(selected)}
    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
  >
    <CheckCircle2 size={17} />
    Tandai Selesai
  </button>
)}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL TOLAK
      ===================================================== */}

      {showTolak && selected && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/60 p-5 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>
                <h2 className="font-bold text-slate-800">
                  Tolak Pengaduan
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {selected.nomor_laporan}
                </p>
              </div>

              <button
                type="button"
                onClick={tutupTolak}
                disabled={
                  !!processingId
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            <div className="p-5">

              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex gap-3">

                  <XCircle
                    size={20}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <div>
                    <div className="font-semibold text-red-700">
                      Laporan akan ditolak
                    </div>

                    <p className="mt-1 text-sm leading-6 text-red-600">
                      Berikan alasan penolakan
                      agar pelapor mengetahui
                      alasan laporan tidak dapat
                      diproses.
                    </p>
                  </div>

                </div>
              </div>

              <div className="mt-5">

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Catatan Penolakan
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <textarea
                  value={
                    catatanTolak
                  }
                  onChange={(e) =>
                    setCatatanTolak(
                      e.target.value
                    )
                  }
                  rows={5}
                  placeholder="Contoh: Laporan belum dapat diproses karena..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />

              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={tutupTolak}
                disabled={
                  !!processingId
                }
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={
                  tolakPengaduan
                }
                disabled={
                  !!processingId
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {processingId ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Menolak...
                  </>
                ) : (
                  <>
                    <XCircle
                      size={17}
                    />
                    Tolak Pengaduan
                  </>
                )}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>

      <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {value || "-"}
      </div>
    </div>
  );
}