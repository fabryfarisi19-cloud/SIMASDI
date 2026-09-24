"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Upload,
  User,
  Wrench,
  X,
  XCircle,
} from "lucide-react";

type Pengaduan = {
  id: string;
  nomor_laporan: string;
  pengguna_id?: number | null;
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
  updated_at?: string;
};

type UserInfo = {
  nama?: string;
  username?: string;
  role?: string;
  penggunaId?: number | string;
};

const KATEGORI = [
  "Komputer/Laptop",
  "Printer",
  "AC",
  "Listrik/Penerangan",
  "Toilet/Sanitasi",
  "Meubelair",
  "Kendaraan",
  "Gedung/Ruangan",
  "Jaringan/Internet",
  "BMN",
  "Lainnya",
];

const STATUS = [
  "Menunggu",
  "Diproses",
  "Menunggu Perbaikan/Pihak Ketiga",
  "Selesai",
  "Ditolak",
];

const ROLE_KELOLA = ["admin umum", "kaur umum"];

const ROLE_LIHAT_SEMUA = [
  "admin",
  "admin umum",
  "kaur umum",
  "pimpinan",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

function statusClass(status: string) {
  switch (status) {
    case "Menunggu":
      return "bg-amber-100 text-amber-700 border-amber-200";

    case "Diproses":
      return "bg-blue-100 text-blue-700 border-blue-200";

    case "Menunggu Perbaikan/Pihak Ketiga":
      return "bg-orange-100 text-orange-700 border-orange-200";

    case "Selesai":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";

    case "Ditolak":
      return "bg-red-100 text-red-700 border-red-200";

    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function StatusIcon({ status }: { status: string }) {
  if (status === "Selesai") {
    return <CheckCircle2 size={14} />;
  }

  if (status === "Ditolak") {
    return <XCircle size={14} />;
  }

  if (status === "Diproses") {
    return <Wrench size={14} />;
  }

  if (status === "Menunggu Perbaikan/Pihak Ketiga") {
    return <Clock3 size={14} />;
  }

  return <AlertCircle size={14} />;
}

function getStatusSummary(data: Pengaduan[], status: string) {
  if (status === "Semua") return data.length;
  return data.filter((item) => item.status === status).length;
}

export default function PengaduanSarprasPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [data, setData] = useState<Pengaduan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterKategori, setFilterKategori] = useState("Semua");

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const [selected, setSelected] = useState<Pengaduan | null>(null);

  const [kategori, setKategori] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [uraian, setUraian] = useState("");

  const [foto, setFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [statusEdit, setStatusEdit] = useState("");
  const [catatanPetugas, setCatatanPetugas] = useState("");
  const [tindakLanjut, setTindakLanjut] = useState("");

  const [savingDetail, setSavingDetail] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const role = normalizeRole(user?.role);

  const bolehKelola = ROLE_KELOLA.includes(role);
  const bolehLihatSemua = ROLE_LIHAT_SEMUA.includes(role);

  /* =========================================================
     BACA USER
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        /**
         * Mengambil user dari localStorage.
         * Dibuat aman agar tidak error saat SSR.
         */
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

            if (parsed && typeof parsed === "object") {
              found = parsed;
              break;
            }
          } catch {
            // lanjut ke key berikutnya
          }
        }

        if (mounted) {
          setUser(found);
        }
      } catch (error) {
        console.error("Gagal membaca user:", error);
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
     LOAD DATA
  ========================================================= */

  async function loadData(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch("/api/pengaduan-sarpras", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil data pengaduan."
        );
      }

      const rows = Array.isArray(result.data) ? result.data : [];

      setData(rows);
    } catch (error: any) {
      console.error("Gagal mengambil pengaduan:", error);
      alert(error?.message || "Gagal mengambil data pengaduan.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!loadingUser) {
      loadData();
    }
  }, [loadingUser]);

  /* =========================================================
     FILTER DATA
  ========================================================= */

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return data.filter((item) => {
      const cocokStatus =
        filterStatus === "Semua" ||
        item.status === filterStatus;

      const cocokKategori =
        filterKategori === "Semua" ||
        item.kategori === filterKategori;

      const cocokSearch =
        !keyword ||
        [
          item.nomor_laporan,
          item.nama_pelapor,
          item.nip_pelapor,
          item.kategori,
          item.lokasi,
          item.uraian,
          item.status,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(keyword)
          );

      return cocokStatus && cocokKategori && cocokSearch;
    });
  }, [data, search, filterStatus, filterKategori]);

  /* =========================================================
     FORM FOTO
  ========================================================= */

  function handleFotoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("File foto harus berupa gambar.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("Ukuran foto maksimal 10 MB.");
      event.target.value = "";
      return;
    }

    setFoto(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewFoto(objectUrl);
  }

  function removeFoto() {
    setFoto(null);
    setPreviewFoto(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function resetForm() {
    setKategori("");
    setLokasi("");
    setUraian("");
    removeFoto();
  }

  /* =========================================================
     UPLOAD FOTO
  ========================================================= */

  async function uploadFoto(file: File) {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch(
      "/api/pengaduan-sarpras/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Gagal mengunggah foto."
      );
    }

    /**
     * Mendukung beberapa kemungkinan format response
     * dari API upload.
     */
    const fotoUrl =
      result.foto_url ||
      result.url ||
      result.data?.foto_url ||
      result.data?.url;

    if (!fotoUrl) {
      throw new Error(
        "Foto berhasil diunggah tetapi URL foto tidak ditemukan."
      );
    }

    return fotoUrl;
  }

  /* =========================================================
     SUBMIT PENGADUAN
  ========================================================= */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!kategori) {
      alert("Kategori wajib dipilih.");
      return;
    }

    if (!lokasi.trim()) {
      alert("Lokasi wajib diisi.");
      return;
    }

    if (!uraian.trim()) {
      alert("Uraian pengaduan wajib diisi.");
      return;
    }

    if (!foto) {
      alert("Foto bukti wajib diunggah.");
      return;
    }

    if (!user) {
      alert("Data pengguna belum tersedia. Silakan login kembali.");
      return;
    }

    try {
      setSubmitting(true);

      const fotoUrl = await uploadFoto(foto);

      const payload = {
        kategori,
        lokasi: lokasi.trim(),
        uraian: uraian.trim(),
        foto_url: fotoUrl,
        pengguna_id:
          user.penggunaId !== undefined
            ? Number(user.penggunaId)
            : null,
        nip_pelapor: user.username || null,
        nama_pelapor:
          user.nama ||
          user.username ||
          "Pengguna SIMASDI",
      };

      const response = await fetch(
        "/api/pengaduan-sarpras",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal membuat pengaduan."
        );
      }

      alert(
        `Pengaduan berhasil dibuat.\nNomor laporan: ${
          result.data?.nomor_laporan || "-"
        }`
      );

      resetForm();
      setShowForm(false);

      await loadData();
    } catch (error: any) {
      console.error("Gagal membuat pengaduan:", error);

      alert(
        error?.message ||
          "Terjadi kesalahan saat membuat pengaduan."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =========================================================
     DETAIL
  ========================================================= */

  function bukaDetail(item: Pengaduan) {
    setSelected(item);

    setStatusEdit(item.status);
    setCatatanPetugas(item.catatan_petugas || "");
    setTindakLanjut(item.tindak_lanjut || "");

    setShowDetail(true);
  }

  function tutupDetail() {
    if (savingDetail) return;

    setShowDetail(false);
    setSelected(null);
  }

  /* =========================================================
     UPDATE DETAIL
  ========================================================= */

  async function handleUpdate() {
    if (!selected) return;

    if (!bolehKelola) return;

    if (!statusEdit) {
      alert("Status wajib dipilih.");
      return;
    }

    try {
      setSavingDetail(true);

      const response = await fetch(
        "/api/pengaduan-sarpras",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: selected.id,
            status: statusEdit,
            catatan_petugas: catatanPetugas.trim(),
            tindak_lanjut: tindakLanjut.trim(),
            ditangani_oleh:
              user?.nama ||
              user?.username ||
              null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Gagal memperbarui pengaduan."
        );
      }

      alert("Pengaduan berhasil diperbarui.");

      setShowDetail(false);
      setSelected(null);

      await loadData();
    } catch (error: any) {
      console.error("Gagal update pengaduan:", error);

      alert(
        error?.message ||
          "Gagal memperbarui pengaduan."
      );
    } finally {
      setSavingDetail(false);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loadingUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2
            className="animate-spin"
            size={24}
          />
          <span>Memuat pengguna...</span>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="w-full space-y-6 pb-10">
      {/* HEADER */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-5 text-white shadow-lg md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-blue-200">
              <ShieldCheck size={20} />
              <span className="text-sm font-medium">
                Layanan Sarana dan Prasarana
              </span>
            </div>

            <h1 className="text-2xl font-bold md:text-3xl">
              Pengaduan / Permintaan Perbaikan Sarpras
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
              Laporkan kerusakan atau kebutuhan perbaikan
              sarana dan prasarana secara digital.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-slate-200">
              <User size={14} />
              Role:{" "}
              <span className="font-semibold text-white">
                {user?.role || "-"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 shadow-md transition hover:bg-slate-100 active:scale-[0.98]"
          >
            <FileText size={18} />
            Buat Pengaduan
          </button>
        </div>
      </div>

      {/* STATISTIK */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          title="Total"
          value={getStatusSummary(data, "Semua")}
          icon={<FileText size={20} />}
          className="border-slate-200 bg-white"
        />

        <StatCard
          title="Menunggu"
          value={getStatusSummary(data, "Menunggu")}
          icon={<Clock3 size={20} />}
          className="border-amber-200 bg-amber-50"
        />

        <StatCard
          title="Diproses"
          value={getStatusSummary(data, "Diproses")}
          icon={<Wrench size={20} />}
          className="border-blue-200 bg-blue-50"
        />

        <StatCard
          title="Selesai"
          value={getStatusSummary(data, "Selesai")}
          icon={<CheckCircle2 size={20} />}
          className="border-emerald-200 bg-emerald-50"
        />
      </div>

      {/* FILTER */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Filter
              size={19}
              className="text-slate-500"
            />
            <h2 className="font-semibold text-slate-800">
              Filter dan Pencarian
            </h2>
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "animate-spin" : ""
              }
            />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative md:col-span-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Cari laporan, lokasi, uraian..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <SelectField
            value={filterStatus}
            onChange={setFilterStatus}
            options={["Semua", ...STATUS]}
          />

          <SelectField
            value={filterKategori}
            onChange={setFilterKategori}
            options={["Semua", ...KATEGORI]}
          />
        </div>
      </div>

      {/* DAFTAR */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 md:p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Daftar Pengaduan
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Menampilkan{" "}
                <span className="font-semibold text-slate-700">
                  {filteredData.length}
                </span>{" "}
                laporan
              </p>
            </div>

            <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
              {bolehLihatSemua
                ? "Monitoring seluruh laporan"
                : "Laporan saya"}
            </div>
          </div>
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
        ) : filteredData.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center px-5 text-center">
            <div className="mb-3 rounded-full bg-slate-100 p-4">
              <FileText
                size={30}
                className="text-slate-400"
              />
            </div>

            <h3 className="font-semibold text-slate-700">
              Belum ada laporan
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              Belum ada pengaduan yang sesuai dengan
              filter atau pencarian Anda.
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE CARD */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredData.map((item) => (
                <MobileReportCard
                  key={item.id}
                  item={item}
                  onDetail={() => bukaDetail(item)}
                />
              ))}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">
                      Laporan
                    </th>
                    <th className="px-5 py-3">
                      Kategori
                    </th>
                    <th className="px-5 py-3">
                      Lokasi
                    </th>
                    <th className="px-5 py-3">
                      Pelapor
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
                  {filteredData.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold text-slate-800">
                          {item.nomor_laporan}
                        </div>

                        <div className="mt-1 max-w-[240px] truncate text-sm text-slate-500">
                          {item.uraian}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {formatTanggal(
                            item.created_at
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {item.kategori}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex max-w-[180px] items-start gap-1.5 text-sm text-slate-600">
                          <MapPin
                            size={15}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />
                          <span>
                            {item.lokasi}
                          </span>
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
                        {item.foto_url ? (
                          <a
                            href={item.foto_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            <ImageIcon size={14} />
                            Foto laporan
                          </a>
                        ) : (
                          <span className="text-xs text-red-500">
                            Tidak ada foto
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <StatusBadge
                          status={item.status}
                        />
                      </td>

                      <td className="px-5 py-4 text-right align-top">
                        <button
                          type="button"
                          onClick={() =>
                            bukaDetail(item)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                        >
                          <Eye size={14} />
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* =====================================================
          MODAL BUAT PENGADUAN
      ===================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm md:items-center md:p-5">
          <div className="flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl md:max-w-2xl md:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Buat Pengaduan Sarpras
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Lengkapi data dan unggah foto bukti.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  !submitting && setShowForm(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto p-5"
            >
              <div className="space-y-5">
                {/* KATEGORI */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Kategori{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <select
                      value={kategori}
                      onChange={(e) =>
                        setKategori(e.target.value)
                      }
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">
                        Pilih kategori
                      </option>

                      {KATEGORI.map((item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* LOKASI */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Lokasi{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <MapPin
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={lokasi}
                      onChange={(e) =>
                        setLokasi(e.target.value)
                      }
                      placeholder="Contoh: Ruang Kaur Umum"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* URAIAN */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Uraian Pengaduan{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <textarea
                    value={uraian}
                    onChange={(e) =>
                      setUraian(e.target.value)
                    }
                    rows={5}
                    placeholder="Jelaskan kerusakan atau kebutuhan perbaikan secara jelas..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* FOTO */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-700">
                      Foto Bukti{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <span className="text-xs text-slate-400">
                      Maks. 10 MB
                    </span>
                  </div>

                  {!previewFoto ? (
                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50"
                    >
                      <div className="mb-3 rounded-full bg-blue-100 p-3">
                        <Camera
                          size={24}
                          className="text-blue-600"
                        />
                      </div>

                      <div className="text-sm font-semibold text-slate-700">
                        Upload foto bukti
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        Klik untuk memilih foto
                      </div>
                    </button>
                  ) : (
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <img
                        src={previewFoto}
                        alt="Preview foto pengaduan"
                        className="max-h-[300px] w-full object-contain"
                      />

                      <button
                        type="button"
                        onClick={removeFoto}
                        className="absolute right-3 top-3 rounded-full bg-red-600 p-2 text-white shadow-lg hover:bg-red-700"
                      >
                        <X size={17} />
                      </button>

                      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <ImageIcon
                            size={16}
                            className="shrink-0 text-emerald-600"
                          />

                          <span className="truncate text-xs text-slate-600">
                            {foto?.name}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            fileInputRef.current?.click()
                          }
                          className="ml-3 shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Ganti foto
                        </button>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    Foto wajib dilampirkan sebagai bukti
                    kondisi sarana/prasarana.
                  </p>
                </div>
              </div>

              {/* FOOTER FORM */}
              <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    setShowForm(false)
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send size={17} />
                      Kirim Pengaduan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL DETAIL
      ===================================================== */}

      {showDetail && selected && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm md:items-center md:p-5">
          <div className="flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl md:max-w-3xl md:rounded-2xl">
            {/* HEADER */}
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-800">
                    {selected.nomor_laporan}
                  </h2>

                  <StatusBadge
                    status={selected.status}
                  />
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Dibuat{" "}
                  {formatTanggal(
                    selected.created_at
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={tutupDetail}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* BODY */}
            <div className="overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* FOTO */}
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ImageIcon size={17} />
                    Foto Laporan
                  </div>

                  {selected.foto_url ? (
                    <a
                      href={selected.foto_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <img
                        src={selected.foto_url}
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

                {/* INFORMASI */}
                <div className="space-y-4">
                  <InfoItem
                    icon={<User size={16} />}
                    label="Pelapor"
                    value={
                      selected.nama_pelapor
                    }
                  />

                  <InfoItem
                    icon={<FileText size={16} />}
                    label="Kategori"
                    value={selected.kategori}
                  />

                  <InfoItem
                    icon={<MapPin size={16} />}
                    label="Lokasi"
                    value={selected.lokasi}
                  />

                  <InfoItem
                    icon={<MessageSquare size={16} />}
                    label="Uraian"
                    value={selected.uraian}
                  />

                  {selected.ditangani_oleh && (
                    <InfoItem
                      icon={<ShieldCheck size={16} />}
                      label="Ditangani oleh"
                      value={
                        selected.ditangani_oleh
                      }
                    />
                  )}
                </div>
              </div>

              {/* CATATAN */}
              {(selected.catatan_petugas ||
                selected.tindak_lanjut) && (
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {selected.catatan_petugas && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <MessageSquare
                          size={16}
                        />
                        Catatan Petugas
                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {selected.catatan_petugas}
                      </p>
                    </div>
                  )}

                  {selected.tindak_lanjut && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Wrench size={16} />
                        Tindak Lanjut
                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {selected.tindak_lanjut}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* AREA PENGELOLA */}
              {bolehKelola && (
                <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 md:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck
                      size={19}
                      className="text-blue-600"
                    />

                    <div>
                      <h3 className="font-bold text-slate-800">
                        Pengelolaan Pengaduan
                      </h3>

                      <p className="text-xs text-slate-500">
                        Hanya Kaur Umum dan Admin Umum
                        yang dapat memperbarui laporan.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* STATUS */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Status
                      </label>

                      <div className="relative">
                        <select
                          value={statusEdit}
                          onChange={(e) =>
                            setStatusEdit(
                              e.target.value
                            )
                          }
                          className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          {STATUS.map((item) => (
                            <option
                              key={item}
                              value={item}
                            >
                              {item}
                            </option>
                          ))}
                        </select>

                        <ChevronDown
                          size={18}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                      </div>
                    </div>

                    {/* CATATAN */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Catatan Petugas
                      </label>

                      <textarea
                        value={catatanPetugas}
                        onChange={(e) =>
                          setCatatanPetugas(
                            e.target.value
                          )
                        }
                        rows={3}
                        placeholder="Tambahkan catatan petugas..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* TINDAK LANJUT */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Tindak Lanjut
                      </label>

                      <textarea
                        value={tindakLanjut}
                        onChange={(e) =>
                          setTindakLanjut(
                            e.target.value
                          )
                        }
                        rows={3}
                        placeholder="Contoh: Sudah dikoordinasikan dengan pihak ketiga..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MONITOR PIMPINAN */}
              {!bolehKelola &&
                role === "pimpinan" && (
                  <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <Eye
                        size={19}
                        className="mt-0.5 text-slate-500"
                      />

                      <div>
                        <div className="font-semibold text-slate-700">
                          Mode Monitoring
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Anda dapat melihat detail
                          pengaduan, tetapi perubahan
                          status dan tindak lanjut hanya
                          dapat dilakukan oleh Kaur Umum
                          atau Admin Umum.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* FOOTER DETAIL */}
            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={tutupDetail}
                disabled={savingDetail}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Tutup
              </button>

              {bolehKelola && (
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={savingDetail}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingDetail ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   COMPONENT STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
  className = "",
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-500">
          {title}
        </div>

        <div className="text-slate-500">
          {icon}
        </div>
      </div>

      <div className="mt-2 text-2xl font-bold text-slate-800 md:text-3xl">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((item) => (
          <option
            key={item}
            value={item}
          >
            {item}
          </option>
        ))}
      </select>

      <ChevronDown
        size={17}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
        status
      )}`}
    >
      <StatusIcon status={status} />
      {status}
    </span>
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

/* =========================================================
   MOBILE CARD
========================================================= */

function MobileReportCard({
  item,
  onDetail,
}: {
  item: Pengaduan;
  onDetail: () => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold text-slate-800">
            {item.nomor_laporan}
          </div>

          <div className="mt-1 text-xs text-slate-400">
            {formatTanggal(item.created_at)}
          </div>
        </div>

        <StatusBadge status={item.status} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Kategori
          </div>

          <div className="mt-1 text-sm font-medium text-slate-700">
            {item.kategori}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Lokasi
          </div>

          <div className="mt-1 flex items-start gap-1.5 text-sm text-slate-600">
            <MapPin
              size={15}
              className="mt-0.5 shrink-0 text-slate-400"
            />

            <span>{item.lokasi}</span>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Uraian
          </div>

          <div className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">
            {item.uraian}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {item.foto_url && (
            <a
              href={item.foto_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
            >
              <ImageIcon size={14} />
              Foto
            </a>
          )}

          <button
            type="button"
            onClick={onDetail}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
          >
            <Eye size={14} />
            Detail
          </button>
        </div>
      </div>
    </div>
  );
}