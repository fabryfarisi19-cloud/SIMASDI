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
  const [loadingKendaraan, setLoadingKendaraan] =
    useState(true);

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
      const res = await fetch(
        "/api/auth/session",
        {
          cache: "no-store",
        }
      );

      if (!res.ok) return;

      const session = await res.json();

      const roleSession =
        session?.user?.role || "";

      setRole(
        String(roleSession).toLowerCase()
      );
    } catch (error) {
      console.error(
        "GAGAL LOAD ROLE:",
        error
      );
    }
  }

  /*
   * Yang boleh melihat seluruh pengajuan:
   * - Admin
   * - Admin Umum
   * - Kaur Umum
   * - Pimpinan
   */

  const bolehLihatSemua = [
    "admin",
    "admin umum",
    "kaur umum",
    "pimpinan",
  ].includes(role);

  /*
   * Yang boleh melakukan approve / tolak:
   * - Admin Umum
   * - Kaur Umum
   */

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

      const res = await fetch(
        "/api/peminjaman-kendaraan",
        {
          cache: "no-store",
        }
      );

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
      console.error(
        "ERROR LOAD DATA:",
        error
      );

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
      console.error(
        "ERROR LOAD KENDARAAN:",
        error
      );

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

  function ubahForm(
    field: string,
    value: string
  ) {
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
      alert(
        "Mohon lengkapi data wajib."
      );
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(
        "/api/peminjaman-kendaraan",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            kendaraan_id:
              Number(
                form.kendaraan_id
              ),
            tanggal_peminjaman:
              form.tanggal_peminjaman,
            jam_mulai:
              form.jam_mulai,
            tujuan:
              form.tujuan,
            keperluan:
              form.keperluan,
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

      alert(
        "Terjadi kesalahan."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     APPROVE / TOLAK
     ===================================================== */

  async function ubahStatus(
    item: Peminjaman,
    statusBaru:
      | "Disetujui"
      | "Ditolak",
    catatan?: string
  ) {
    try {
      setMemprosesId(item.id);

      const res = await fetch(
        "/api/peminjaman-kendaraan",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: item.id,
            status: statusBaru,
            catatan_admin:
              catatan || null,
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

  function bukaFormTolak(
    item: Peminjaman
  ) {
    setPengajuanDipilih(item);
    setCatatanTolak("");
    setBukaTolak(true);
  }

  /* =====================================================
     STATUS BADGE
     ===================================================== */

  function statusBadge(
    status: string
  ) {
    if (status === "Disetujui") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          <CheckCircle2 size={14} />
          Disetujui
        </span>
      );
    }

    if (status === "Ditolak") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          <XCircle size={14} />
          Ditolak
        </span>
      );
    }

    if (status === "Digunakan") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          <Car size={14} />
          Digunakan
        </span>
      );
    }

    if (status === "Selesai") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          <CheckCircle2 size={14} />
          Selesai
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
        <Clock3 size={14} />
        Menunggu Verifikasi
      </span>
    );
  }

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-blue-600 p-3 text-white">
                <Car size={26} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Pinjam Mobil Dinas
                </h1>

                <p className="text-sm text-slate-500">
                  Pengajuan dan peminjaman kendaraan dinas
                </p>
              </div>

            </div>
          </div>

          <div className="flex gap-2">

            <button
              onClick={loadData}
              className="flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Refresh
            </button>

            <button
              onClick={() =>
                setBukaForm(true)
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Plus size={18} />
              Ajukan Peminjaman
            </button>

          </div>
        </div>

        {/* INFO VERIFIKASI */}

        {bolehVerifikasi && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">

            <div className="rounded-xl bg-blue-600 p-2 text-white">
              <ShieldCheck size={22} />
            </div>

            <div>
              <p className="font-semibold text-blue-800">
                Mode Verifikasi
              </p>

              <p className="text-sm text-blue-700">
                Anda dapat melihat dan memproses
                pengajuan seluruh pegawai.
              </p>
            </div>

          </div>
        )}

        {role === "pimpinan" && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">

            <div className="rounded-xl bg-slate-600 p-2 text-white">
              <ShieldCheck size={22} />
            </div>

            <div>
              <p className="font-semibold text-slate-800">
                Akses Pimpinan
              </p>

              <p className="text-sm text-slate-500">
                Anda dapat melihat seluruh pengajuan,
                tetapi persetujuan dilakukan oleh
                Kaur Umum atau Admin Umum.
              </p>
            </div>

          </div>
        )}

        {/* RINGKASAN */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Total Pengajuan
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-800">
                  {data.length}
                </p>
              </div>

              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <FileText size={22} />
              </div>

            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
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

              <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600">
                <Clock3 size={22} />
              </div>

            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
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

              <div className="rounded-xl bg-green-100 p-3 text-green-600">
                <CheckCircle2 size={22} />
              </div>

            </div>
          </div>

        </div>

        {/* DAFTAR */}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          <div className="border-b px-5 py-4">

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
                  className="p-5 hover:bg-slate-50"
                >

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                    <div className="min-w-0 flex-1">

                      {/* KODE + STATUS */}

                      <div className="mb-3 flex flex-wrap items-center gap-2">

                        <span className="font-semibold text-slate-800">
                          {item.kode_pengajuan}
                        </span>

                        {statusBadge(
                          item.status
                        )}

                      </div>

                      {/* PEMOHON */}

                      {bolehLihatSemua && (
                        <div className="mb-4 rounded-xl bg-slate-50 p-3">

                          <div className="flex items-center gap-2">

                            <User
                              size={16}
                              className="text-blue-600"
                            />

                            <span className="font-semibold text-slate-800">
                              {item.nama_peminjam}
                            </span>

                          </div>

                          {item.nip && (
                            <div className="mt-1 pl-6 text-xs text-slate-500">
                              NIP: {item.nip}
                            </div>
                          )}

                        </div>
                      )}

                      {/* DETAIL */}

                      <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2 lg:grid-cols-4">

                        <div className="flex items-center gap-2">
                          <CalendarDays
                            size={16}
                            className="text-blue-600"
                          />

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
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock
                            size={16}
                            className="text-blue-600"
                          />

                          {item.jam_mulai}
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin
                            size={16}
                            className="text-blue-600"
                          />

                          {item.tujuan}
                        </div>

                        <div className="flex items-center gap-2">
                          <Car
                            size={16}
                            className="text-blue-600"
                          />

                          <span className="font-medium text-slate-700">
                            {item.kendaraan
                              ?.nama_kendaraan ||
                              "Kendaraan"}
                          </span>
                        </div>

                      </div>

                      {/* KEPERLUAN */}

                      <p className="mt-3 text-sm text-slate-700">
                        <strong>
                          Keperluan:
                        </strong>{" "}
                        {item.keperluan}
                      </p>

                      {/* NOMOR POLISI */}

                      {item.kendaraan
                        ?.nomor_polisi && (
                        <p className="mt-1 text-xs text-slate-500">
                          Nomor Polisi:{" "}
                          {
                            item.kendaraan
                              .nomor_polisi
                          }
                        </p>
                      )}

                      {/* CATATAN ADMIN */}

                      {item.catatan_admin && (
                        <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                          <strong>
                            Catatan:
                          </strong>{" "}
                          {item.catatan_admin}
                        </div>
                      )}

                    </div>

                    {/* AKSI VERIFIKASI */}

                    {bolehVerifikasi &&
                      item.status ===
                        "Menunggu Verifikasi" && (
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">

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
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
                          >

                            <CheckCircle2
                              size={17}
                            />

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
                              bukaFormTolak(
                                item
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                          >

                            <XCircle
                              size={17}
                            />

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-5 py-4">

              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Pengajuan Mobil Dinas
                </h2>

                <p className="text-xs text-slate-500">
                  Lengkapi data perjalanan
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setBukaForm(false)
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={
                submitPengajuan
              }
              className="space-y-5 p-5"
            >

              {/* KENDARAAN */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Kendaraan{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <select
                  required
                  value={
                    form.kendaraan_id
                  }
                  onChange={(e) =>
                    ubahForm(
                      "kendaraan_id",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                >

                  <option value="">
                    Pilih kendaraan
                  </option>

                  {loadingKendaraan ? (
                    <option disabled>
                      Memuat kendaraan...
                    </option>
                  ) : kendaraan.length ===
                    0 ? (
                    <option disabled>
                      Kendaraan belum tersedia
                    </option>
                  ) : (
                    kendaraan.map(
                      (k) => (
                        <option
                          key={k.id}
                          value={k.id}
                        >
                          {
                            k.nama_kendaraan
                          }

                          {k.nomor_polisi
                            ? ` - ${k.nomor_polisi}`
                            : ""}
                        </option>
                      )
                    )
                  )}

                </select>

              </div>

              {/* TANGGAL */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Tanggal Peminjaman *
                </label>

                <input
                  type="date"
                  required
                  value={
                    form.tanggal_peminjaman
                  }
                  onChange={(e) =>
                    ubahForm(
                      "tanggal_peminjaman",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

              {/* JAM */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Jam Mulai *
                </label>

                <input
                  type="time"
                  required
                  value={
                    form.jam_mulai
                  }
                  onChange={(e) =>
                    ubahForm(
                      "jam_mulai",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

              {/* TUJUAN */}

              <div>

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
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

              {/* KEPERLUAN */}

              <div>

                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Keperluan *
                </label>

                <textarea
                  required
                  rows={4}
                  value={
                    form.keperluan
                  }
                  onChange={(e) =>
                    ubahForm(
                      "keperluan",
                      e.target.value
                    )
                  }
                  placeholder="Jelaskan keperluan penggunaan kendaraan"
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

              {/* BUTTON */}

              <div className="flex justify-end gap-3 border-t pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setBukaForm(false)
                  }
                  className="rounded-xl border px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
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

      {bukaTolak &&
        pengajuanDipilih && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b px-5 py-4">

                <div>
                  <h2 className="font-bold text-slate-800">
                    Tolak Pengajuan
                  </h2>

                  <p className="text-xs text-slate-500">
                    {
                      pengajuanDipilih.kode_pengajuan
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBukaTolak(
                      false
                    );
                    setPengajuanDipilih(
                      null
                    );
                  }}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>

              </div>

              <div className="space-y-4 p-5">

                <div className="rounded-xl bg-slate-50 p-4 text-sm">

                  <p>
                    <strong>
                      Pemohon:
                    </strong>{" "}
                    {
                      pengajuanDipilih.nama_peminjam
                    }
                  </p>

                  <p className="mt-1">
                    <strong>
                      Kendaraan:
                    </strong>{" "}
                    {
                      pengajuanDipilih
                        .kendaraan
                        ?.nama_kendaraan ||
                      "Kendaraan"
                    }
                  </p>

                  <p className="mt-1">
                    <strong>
                      Tujuan:
                    </strong>{" "}
                    {
                      pengajuanDipilih.tujuan
                    }
                  </p>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Alasan Penolakan
                  </label>

                  <textarea
                    rows={4}
                    value={
                      catatanTolak
                    }
                    onChange={(e) =>
                      setCatatanTolak(
                        e.target.value
                      )
                    }
                    placeholder="Masukkan alasan penolakan"
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-red-500"
                  />

                </div>

                <div className="flex justify-end gap-3 border-t pt-4">

                  <button
                    type="button"
                    onClick={() => {
                      setBukaTolak(
                        false
                      );
                      setPengajuanDipilih(
                        null
                      );
                    }}
                    className="rounded-xl border px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
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
                    className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
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