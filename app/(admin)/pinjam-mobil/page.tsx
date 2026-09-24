"use client";

import { useEffect, useState } from "react";
import {
  Car,
  CalendarDays,
  Clock,
  MapPin,
  FileText,
  Plus,
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock3,
  User,
  ShieldCheck,
} from "lucide-react";

type Kendaraan = {
  id: number;
  nama_kendaraan: string;
  nomor_polisi?: string | null;
  jenis_kendaraan?: string | null;
  status_kendaraan?: string | null;
};

type Peminjaman = {
  id: string;
  kode_pengajuan: string;
  nama_peminjam: string;
  nip?: string | null;

  kendaraan_id?: number;
  kendaraan?: Kendaraan;

  tanggal_peminjaman: string;
  jam_mulai: string;

  tujuan: string;
  keperluan: string;

  status: string;

  catatan_admin?: string | null;

  created_at: string;
};

export default function PinjamMobilPage() {
  const [data, setData] = useState<Peminjaman[]>([]);
  const [kendaraan, setKendaraan] = useState<Kendaraan[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingKendaraan, setLoadingKendaraan] = useState(true);

  const [bukaForm, setBukaForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [memprosesId, setMemprosesId] =
    useState<string | null>(null);

  const [bukaTolak, setBukaTolak] = useState(false);

  const [pengajuanDipilih, setPengajuanDipilih] =
    useState<Peminjaman | null>(null);

  const [catatanTolak, setCatatanTolak] =
    useState("");

  const [role, setRole] = useState("");

  const [form, setForm] = useState({
    kendaraan_id: "",
    tanggal_peminjaman: "",
    jam_mulai: "",
    tujuan: "",
    keperluan: "",
  });

  /* =====================================================
     ROLE
     ===================================================== */

  async function loadRole() {
    try {
      const res = await fetch("/api/auth/session", {
        cache: "no-store",
      });

      if (!res.ok) return;

      const session = await res.json();

      const roleSession = session?.user?.role || "";

      setRole(String(roleSession).toLowerCase());
    } catch (error) {
      console.error("GAGAL LOAD ROLE:", error);
    }
  }

  const bolehLihatSemua = [
    "admin",
    "admin umum",
    "kaur umum",
    "pimpinan",
  ].includes(role);

  const bolehVerifikasi = [
    "admin umum",
    "kaur umum",
  ].includes(role);

  /* =====================================================
     LOAD DATA
     ===================================================== */

  async function loadData() {
    try {
      setLoading(true);

      const res = await fetch("/api/peminjaman-kendaraan", {
        cache: "no-store",
      });

      const json = await res.json();

      if (json.success) {
        setData(json.data || []);
      } else {
        console.error(
          "Gagal mengambil peminjaman:",
          json.message
        );

        setData([]);
      }
    } catch (error) {
      console.error("ERROR LOAD DATA:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadKendaraan() {
    try {
      setLoadingKendaraan(true);

      const res = await fetch(
        "/api/peminjaman-kendaraan/kendaraan",
        {
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (json.success) {
        setKendaraan(json.data || []);
      } else {
        console.error(
          "Gagal mengambil kendaraan:",
          json.message
        );

        setKendaraan([]);
      }
    } catch (error) {
      console.error("ERROR LOAD KENDARAAN:", error);
      setKendaraan([]);
    } finally {
      setLoadingKendaraan(false);
    }
  }

  useEffect(() => {
    loadRole();
    loadData();
    loadKendaraan();
  }, []);

  /* =====================================================
     FORM
     ===================================================== */

  function ubahForm(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function submitPengajuan(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (
      !form.kendaraan_id ||
      !form.tanggal_peminjaman ||
      !form.jam_mulai ||
      !form.tujuan ||
      !form.keperluan
    ) {
      alert("Mohon lengkapi data wajib.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(
        "/api/peminjaman-kendaraan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kendaraan_id: Number(form.kendaraan_id),
            tanggal_peminjaman:
              form.tanggal_peminjaman,
            jam_mulai: form.jam_mulai,
            tujuan: form.tujuan,
            keperluan: form.keperluan,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        alert(
          json.message ||
            "Pengajuan gagal disimpan"
        );
        return;
      }

      alert(
        "Pengajuan peminjaman berhasil dikirim."
      );

      setForm({
        kendaraan_id: "",
        tanggal_peminjaman: "",
        jam_mulai: "",
        tujuan: "",
        keperluan: "",
      });

      setBukaForm(false);

      await loadData();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     APPROVE / TOLAK
     ===================================================== */

  async function ubahStatus(
    item: Peminjaman,
    statusBaru: "Disetujui" | "Ditolak",
    catatan?: string
  ) {
    try {
      setMemprosesId(item.id);

      const res = await fetch(
        "/api/peminjaman-kendaraan",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: item.id,
            status: statusBaru,
            catatan_admin: catatan || null,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        alert(
          json.message ||
            "Gagal mengubah status"
        );
        return;
      }

      alert(
        statusBaru === "Disetujui"
          ? "Pengajuan berhasil disetujui."
          : "Pengajuan berhasil ditolak."
      );

      setBukaTolak(false);
      setPengajuanDipilih(null);
      setCatatanTolak("");

      await loadData();
    } catch (error) {
      console.error(
        "ERROR UBAH STATUS:",
        error
      );

      alert(
        "Terjadi kesalahan saat memproses pengajuan."
      );
    } finally {
      setMemprosesId(null);
    }
  }

  function bukaFormTolak(item: Peminjaman) {
    setPengajuanDipilih(item);
    setCatatanTolak("");
    setBukaTolak(true);
  }

  /* =====================================================
     STATUS BADGE
     ===================================================== */

  function statusBadge(status: string) {
    if (status === "Disetujui") {
      return (
        <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          <CheckCircle2 size={14} />
          Disetujui
        </span>
      );
    }

    if (status === "Ditolak") {
      return (
        <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          <XCircle size={14} />
          Ditolak
        </span>
      );
    }

    if (status === "Digunakan") {
      return (
        <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          <Car size={14} />
          Digunakan
        </span>
      );
    }

    if (status === "Selesai") {
      return (
        <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          <CheckCircle2 size={14} />
          Selesai
        </span>
      );
    }

    return (
      <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
        <Clock3 size={14} />
        Menunggu Verifikasi
      </span>
    );
  }

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto w-full max-w-7xl min-w-0">

        {/* HEADER */}

        <div className="mb-5 flex min-w-0 flex-col gap-4 md:mb-6 md:flex-row md:items-center md:justify-between">

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-3">

              <div className="shrink-0 rounded-xl bg-blue-600 p-3 text-white">
                <Car size={26} />
              </div>

              <div className="min-w-0">
                <h1 className="break-words text-xl font-bold text-slate-800 sm:text-2xl">
                  Pinjam Mobil Dinas
                </h1>

                <p className="break-words text-sm text-slate-500">
                  Pengajuan dan peminjaman kendaraan dinas
                </p>
              </div>

            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">

            <button
              type="button"
              onClick={loadData}
              className="flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
            >
              <RefreshCw size={17} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setBukaForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:w-auto"
            >
              <Plus size={18} />
              Ajukan Peminjaman
            </button>

          </div>
        </div>

        {/* INFO VERIFIKASI */}

        {bolehVerifikasi && (
          <div className="mb-5 flex min-w-0 items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 sm:mb-6 sm:px-5">

            <div className="shrink-0 rounded-xl bg-blue-600 p-2 text-white">
              <ShieldCheck size={22} />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-blue-800">
                Mode Verifikasi
              </p>

              <p className="break-words text-sm text-blue-700">
                Anda dapat melihat dan memproses
                pengajuan seluruh pegawai.
              </p>
            </div>

          </div>
        )}

        {role === "pimpinan" && (
          <div className="mb-5 flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:mb-6 sm:px-5">

            <div className="shrink-0 rounded-xl bg-slate-600 p-2 text-white">
              <ShieldCheck size={22} />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-slate-800">
                Akses Pimpinan
              </p>

              <p className="break-words text-sm text-slate-500">
                Anda dapat melihat seluruh pengajuan,
                tetapi persetujuan dilakukan oleh
                Kaur Umum atau Admin Umum.
              </p>
            </div>

          </div>
        )}

        {/* RINGKASAN */}

        <div className="mb-5 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-3 sm:gap-4">

          <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">

              <div className="min-w-0">
                <p className="text-sm text-slate-500">
                  Total Pengajuan
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-800">
                  {data.length}
                </p>
              </div>

              <div className="shrink-0 rounded-xl bg-blue-100 p-3 text-blue-600">
                <FileText size={22} />
              </div>

            </div>
          </div>

          <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">

              <div className="min-w-0">
                <p className="text-sm text-slate-500">
                  Menunggu Verifikasi
                </p>

                <p className="mt-1 text-2xl font-bold text-yellow-600">
                  {
                    data.filter(
                      (x) =>
                        x.status ===
                        "Menunggu Verifikasi"
                    ).length
                  }
                </p>
              </div>

              <div className="shrink-0 rounded-xl bg-yellow-100 p-3 text-yellow-600">
                <Clock3 size={22} />
              </div>

            </div>
          </div>

          <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">

              <div className="min-w-0">
                <p className="text-sm text-slate-500">
                  Disetujui
                </p>

                <p className="mt-1 text-2xl font-bold text-green-600">
                  {
                    data.filter(
                      (x) =>
                        x.status ===
                        "Disetujui"
                    ).length
                  }
                </p>
              </div>

              <div className="shrink-0 rounded-xl bg-green-100 p-3 text-green-600">
                <CheckCircle2 size={22} />
              </div>

            </div>
          </div>

        </div>

        {/* DAFTAR */}

        <div className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm">

          <div className="border-b px-4 py-4 sm:px-5">

            <h2 className="font-semibold text-slate-800">
              {bolehLihatSemua
                ? "Daftar Pengajuan Kendaraan"
                : "Riwayat Pengajuan"}
            </h2>

            {bolehLihatSemua && (
              <p className="mt-1 text-xs text-slate-500">
                Seluruh pengajuan kendaraan dinas
              </p>
            )}

          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Memuat data...
            </div>
          ) : data.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              Belum ada pengajuan peminjaman kendaraan.
            </div>
          ) : (
            <div className="divide-y">

              {data.map((item) => (
                <div
                  key={item.id}
                  className="min-w-0 p-4 hover:bg-slate-50 sm:p-5"
                >

                  <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                    <div className="min-w-0 flex-1">

                      {/* KODE + STATUS */}

                      <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2">

                        <span className="break-all font-semibold text-slate-800">
                          {item.kode_pengajuan}
                        </span>

                        {statusBadge(item.status)}

                      </div>

                      {/* PEMOHON */}

                      {bolehLihatSemua && (
                        <div className="mb-4 min-w-0 rounded-xl bg-slate-50 p-3">

                          <div className="flex min-w-0 items-start gap-2">

                            <User
                              size={16}
                              className="mt-0.5 shrink-0 text-blue-600"
                            />

                            <span className="min-w-0 break-words font-semibold text-slate-800">
                              {item.nama_peminjam}
                            </span>

                          </div>

                          {item.nip && (
                            <div className="mt-1 break-all pl-6 text-xs text-slate-500">
                              NIP: {item.nip}
                            </div>
                          )}

                        </div>
                      )}

                      {/* DETAIL */}

                      <div className="grid min-w-0 gap-3 text-sm text-slate-600 md:grid-cols-2 lg:grid-cols-4">

                        <div className="flex min-w-0 items-start gap-2">
                          <CalendarDays
                            size={16}
                            className="mt-0.5 shrink-0 text-blue-600"
                          />

                          <span className="break-words">
                            {new Date(
                              item.tanggal_peminjaman
                            ).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>

                        <div className="flex min-w-0 items-center gap-2">
                          <Clock
                            size={16}
                            className="shrink-0 text-blue-600"
                          />

                          <span className="break-words">
                            {item.jam_mulai}
                          </span>
                        </div>

                        <div className="flex min-w-0 items-start gap-2">
                          <MapPin
                            size={16}
                            className="mt-0.5 shrink-0 text-blue-600"
                          />

                          <span className="min-w-0 break-words">
                            {item.tujuan}
                          </span>
                        </div>

                        <div className="flex min-w-0 items-start gap-2">
                          <Car
                            size={16}
                            className="mt-0.5 shrink-0 text-blue-600"
                          />

                          <span className="min-w-0 break-words font-medium text-slate-700">
                            {item.kendaraan
                              ?.nama_kendaraan ||
                              "Kendaraan"}
                          </span>
                        </div>

                      </div>

                      {/* KEPERLUAN */}

                      <p className="mt-3 break-words text-sm text-slate-700">
                        <strong>Keperluan:</strong>{" "}
                        {item.keperluan}
                      </p>

                      {/* NOMOR POLISI */}

                      {item.kendaraan?.nomor_polisi && (
                        <p className="mt-1 break-words text-xs text-slate-500">
                          Nomor Polisi:{" "}
                          {item.kendaraan.nomor_polisi}
                        </p>
                      )}

                      {/* CATATAN ADMIN */}

                      {item.catatan_admin && (
                        <div className="mt-3 min-w-0 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                          <strong>Catatan:</strong>{" "}
                          <span className="break-words">
                            {item.catatan_admin}
                          </span>
                        </div>
                      )}

                    </div>

                    {/* AKSI VERIFIKASI */}

                    {bolehVerifikasi &&
                      item.status ===
                        "Menunggu Verifikasi" && (
                        <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:w-auto lg:flex-col">

                          <button
                            type="button"
                            disabled={
                              memprosesId ===
                              item.id
                            }
                            onClick={() =>
                              ubahStatus(
                                item,
                                "Disetujui"
                              )
                            }
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50 lg:w-auto"
                          >
                            <CheckCircle2 size={17} />

                            {memprosesId ===
                            item.id
                              ? "Memproses..."
                              : "Setujui"}
                          </button>

                          <button
                            type="button"
                            disabled={
                              memprosesId ===
                              item.id
                            }
                            onClick={() =>
                              bukaFormTolak(item)
                            }
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 lg:w-auto"
                          >
                            <XCircle size={17} />
                            Tolak
                          </button>

                        </div>
                      )}

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>

      {/* =================================================
          MODAL FORM PENGAJUAN
          ================================================= */}

      {bukaForm && (
        <div
          className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4"
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >

          <div
            className="my-auto flex max-h-[calc(100vh-1.5rem)] w-full min-w-0 max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[95vh]"
          >

            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-white px-4 py-3 sm:px-5 sm:py-4">

              <div className="min-w-0">
                <h2 className="break-words text-base font-bold text-slate-800 sm:text-lg">
                  Pengajuan Mobil Dinas
                </h2>

                <p className="break-words text-xs text-slate-500">
                  Lengkapi data perjalanan
                </p>
              </div>

              <button
                type="button"
                onClick={() => setBukaForm(false)}
                className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={submitPengajuan}
              className="min-w-0 flex-1 overflow-y-auto"
            >

              <div className="space-y-4 p-4 sm:space-y-5 sm:p-5">

                {/* KENDARAAN */}

                <div className="min-w-0">

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Kendaraan{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    required
                    value={form.kendaraan_id}
                    onChange={(e) =>
                      ubahForm(
                        "kendaraan_id",
                        e.target.value
                      )
                    }
                    className="block h-12 w-full min-w-0 max-w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:px-4"
                  >
                    <option value="">
                      Pilih kendaraan
                    </option>

                    {loadingKendaraan ? (
                      <option disabled>
                        Memuat kendaraan...
                      </option>
                    ) : kendaraan.length === 0 ? (
                      <option disabled>
                        Kendaraan belum tersedia
                      </option>
                    ) : (
                      kendaraan.map((k) => (
                        <option
                          key={k.id}
                          value={k.id}
                        >
                          {k.nama_kendaraan}
                          {k.nomor_polisi
                            ? ` - ${k.nomor_polisi}`
                            : ""}
                        </option>
                      ))
                    )}
                  </select>

                </div>

                {/* TANGGAL */}

                <div className="min-w-0">

                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Tanggal Peminjaman *
                  </label>

                  <input
                    type="date"
                    required
                    value={form.tanggal_peminjaman}
                    onChange={(e) =>
                      ubahForm(
                        "tanggal_peminjaman",
                        e.target.value
                      )
                    }
                    className="block h-12 w-full min-w-0 max-w-full appearance-none rounded-xl border px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:px-4"
                  />

                </div>

                {/* JAM */}

                <div className="min-w-0">

                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Jam Mulai *
                  </label>

                  <input
                    type="time"
                    required
                    value={form.jam_mulai}
                    onChange={(e) =>
                      ubahForm(
                        "jam_mulai",
                        e.target.value
                      )
                    }
                    className="block h-12 w-full min-w-0 max-w-full appearance-none rounded-xl border px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:px-4"
                  />

                </div>

                {/* TUJUAN */}

                <div className="min-w-0">

                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Tujuan *
                  </label>

                  <input
                    type="text"
                    required
                    value={form.tujuan}
                    onChange={(e) =>
                      ubahForm(
                        "tujuan",
                        e.target.value
                      )
                    }
                    placeholder="Contoh: Kanwil Kemenimipas"
                    className="block h-12 w-full min-w-0 max-w-full rounded-xl border px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:px-4"
                  />

                </div>

                {/* KEPERLUAN */}

                <div className="min-w-0">

                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Keperluan *
                  </label>

                  <textarea
                    required
                    rows={4}
                    value={form.keperluan}
                    onChange={(e) =>
                      ubahForm(
                        "keperluan",
                        e.target.value
                      )
                    }
                    placeholder="Jelaskan keperluan penggunaan kendaraan"
                    className="block w-full min-w-0 max-w-full resize-y rounded-xl border px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:px-4"
                  />

                </div>

              </div>

              {/* BUTTON */}

              <div className="sticky bottom-0 flex shrink-0 flex-col-reverse gap-2 border-t bg-white p-4 sm:flex-row sm:justify-end sm:gap-3 sm:p-5">

                <button
                  type="button"
                  onClick={() => setBukaForm(false)}
                  className="w-full rounded-xl border px-5 py-3 font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
                >
                  {saving
                    ? "Menyimpan..."
                    : "Kirim Pengajuan"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* =================================================
          MODAL TOLAK
          ================================================= */}

      {bukaTolak && pengajuanDipilih && (
        <div className="fixed inset-0 z-[10000] flex min-h-screen items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">

          <div className="my-auto w-full min-w-0 max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5 sm:py-4">

              <div className="min-w-0">
                <h2 className="break-words font-bold text-slate-800">
                  Tolak Pengajuan
                </h2>

                <p className="break-all text-xs text-slate-500">
                  {pengajuanDipilih.kode_pengajuan}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setBukaTolak(false);
                  setPengajuanDipilih(null);
                }}
                className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            <div className="space-y-4 p-4 sm:p-5">

              <div className="min-w-0 rounded-xl bg-slate-50 p-4 text-sm">

                <p className="break-words">
                  <strong>Pemohon:</strong>{" "}
                  {pengajuanDipilih.nama_peminjam}
                </p>

                <p className="mt-1 break-words">
                  <strong>Kendaraan:</strong>{" "}
                  {pengajuanDipilih.kendaraan
                    ?.nama_kendaraan ||
                    "Kendaraan"}
                </p>

                <p className="mt-1 break-words">
                  <strong>Tujuan:</strong>{" "}
                  {pengajuanDipilih.tujuan}
                </p>

              </div>

              <div className="min-w-0">

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Alasan Penolakan
                </label>

                <textarea
                  rows={4}
                  value={catatanTolak}
                  onChange={(e) =>
                    setCatatanTolak(
                      e.target.value
                    )
                  }
                  placeholder="Masukkan alasan penolakan"
                  className="block w-full min-w-0 max-w-full resize-y rounded-xl border px-3 py-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 sm:px-4"
                />

              </div>

              <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end sm:gap-3">

                <button
                  type="button"
                  onClick={() => {
                    setBukaTolak(false);
                    setPengajuanDipilih(null);
                  }}
                  className="w-full rounded-xl border px-5 py-3 font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={
                    memprosesId ===
                    pengajuanDipilih.id
                  }
                  onClick={() =>
                    ubahStatus(
                      pengajuanDipilih,
                      "Ditolak",
                      catatanTolak
                    )
                  }
                  className="w-full rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50 sm:w-auto"
                >
                  {memprosesId ===
                  pengajuanDipilih.id
                    ? "Memproses..."
                    : "Konfirmasi Tolak"}
                </button>

              </div>

            </div>

          </div>
        </div>
      )}
    </main>
  );
}