"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Award,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  Printer,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

/* ============================================================
   TYPE
============================================================ */

type Pegawai = {
  id: string;
  nama: string;
  username: string;
  role: string;
  status: string;
};

type Periode = {
  id: string;
  tahun: number;
  bulan: number;
  nama_periode: string;
  status: "draft" | "dibuka" | "ditutup";
  tanggal_mulai?: string | null;
  tanggal_selesai?: string | null;
  keterangan?: string | null;
};

type Kriteria = {
  id: string;
  kode: string;
  nama_kriteria: string;
  deskripsi?: string | null;
  indikator?: string | null;
  pedoman_nilai?: string | null;
  bobot: number;
  nilai_min: number;
  nilai_max: number;
  urutan: number;
};

type Penilaian = {
  id: string;
  periode_id: string;
  pegawai_username: string;
  pegawai_nama: string;
  pegawai_nip: string;
  penilai_username: string;
  penilai_nama: string;
  penilai_role: string;
  status: string;
  catatan?: string | null;
  tanggal_dikirim?: string | null;
  created_at?: string;
  updated_at?: string;
};

type Nilai = {
  id: string;
  penilaian_id: string;
  kriteria_id: string;
  nilai: number;
  catatan?: string | null;
};

type ApiResponse = {
  success: boolean;
  message?: string;

  pengguna_login?: {
    username: string;
    nama: string;
    role: string;
  } | null;

  penilai?: {
    username: string;
    nama: string;
    role: string;
  } | null;

  periode?: Periode;

  kriteria?: Kriteria[];

  objek_penilaian?: Pegawai[];

  total_kriteria?: number;
  total_objek_penilaian?: number;
  total_penilaian?: number;

  penilaian?: Penilaian[];
  nilai?: Nilai[];
};

/* ============================================================
   ROLE
============================================================ */

const ROLE_PENGELOLA = "Pengelola Kepegawaian";

const ROLE_PENILAI = [
  "Kabapas",
  "Kasubag TU",
  "Kaur Umum",
  "Kaur Keuangan",
  "Kaur Kepegawaian",
  "Kasi BKA",
  "Kasi BKD",
  "Kasubsi Bimker Anak",
  "Kasubsi Bimker Dewasa",
  "Kasubsi Registrasi Dewasa",
  "Kasubsi Bimkemas Anak",
  "Kasubsi Bimkemas Dewasa",
  "Kasubsi Registrasi Anak",
];

/* ============================================================
   HELPER
============================================================ */

function formatNilai(nilai: number | null | undefined) {
  if (
    nilai === null ||
    nilai === undefined ||
    !Number.isFinite(Number(nilai))
  ) {
    return "-";
  }

  return Number(nilai).toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTanggal(tanggal?: string | null) {
  if (!tanggal) return "-";

  try {
    return new Date(tanggal).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return tanggal;
  }
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "draft":
      return "Draft";

    case "dibuka":
      return "Dibuka";

    case "ditutup":
      return "Ditutup";

    default:
      return status || "-";
  }
}

function getStatusClass(status?: string) {
  switch (status) {
    case "dibuka":
      return "bg-green-100 text-green-700 border-green-200";

    case "ditutup":
      return "bg-gray-100 text-gray-700 border-gray-200";

    case "draft":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";

    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function hitungNilaiAkhir(
  penilaianId: string,
  kriteria: Kriteria[],
  nilai: Nilai[]
) {
  const detail = nilai.filter(
    (item) => item.penilaian_id === penilaianId
  );

  if (detail.length === 0) {
    return null;
  }

  let total = 0;

  for (const k of kriteria) {
    const item = detail.find(
      (n) => n.kriteria_id === k.id
    );

    if (!item) continue;

    const angka = Number(item.nilai);
    const bobot = Number(k.bobot ?? 0);

    if (
      Number.isFinite(angka) &&
      Number.isFinite(bobot)
    ) {
      total += angka * (bobot / 100);
    }
  }

  return Number(total.toFixed(2));
}

function parsePedoman(text?: string | null) {
  if (!text) return [];

  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const match = item.match(/^([^:]+):\s*(.*)$/);

      if (!match) {
        return {
          range: "",
          text: item,
        };
      }

      return {
        range: match[1].trim(),
        text: match[2].trim(),
      };
    });
}

/* ============================================================
   PAGE
============================================================ */

export default function PegawaiTeladanPage() {
  const { data: session, status: sessionStatus } =
    useSession();

  const [periode, setPeriode] =
    useState<Periode | null>(null);

  const [kriteria, setKriteria] =
    useState<Kriteria[]>([]);

  const [pegawai, setPegawai] =
    useState<Pegawai[]>([]);

  const [penilaian, setPenilaian] =
    useState<Penilaian[]>([]);

  const [nilai, setNilai] =
    useState<Nilai[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [selectedPegawai, setSelectedPegawai] =
    useState<Pegawai | null>(null);

  const [nilaiForm, setNilaiForm] =
    useState<Record<string, number>>({});

  const [catatan, setCatatan] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [search, setSearch] =
    useState("");

  /* ==========================================================
     SESSION ROLE
  ========================================================== */

  const role = String(
    (session as any)?.role ??
      (session as any)?.user?.role ??
      (session as any)?.user?.jabatan ??
      ""
  ).trim();

  const username = String(
    (session as any)?.username ??
      (session as any)?.user?.username ??
      ""
  ).trim();

  const namaUser = String(
    (session as any)?.name ??
      (session as any)?.user?.name ??
      ""
  ).trim();

  const isPengelola =
    role === ROLE_PENGELOLA;

  const isPenilai =
    ROLE_PENILAI.includes(role) ||
    role.startsWith("Kasi ") ||
    role.startsWith("Kasubsi ");

  /* ==========================================================
     AMBIL PERIODE AKTIF
  ========================================================== */

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      /* -------------------------------------------------------
         1. PERIODE
      ------------------------------------------------------- */

    const periodeResponse = await fetch(
  "/api/pegawai-teladan/periode",
  {
    method: "GET",
    cache: "no-store",
  }
);

const periodeJson = await periodeResponse.json();

console.log(
  "HASIL API PERIODE:",
  periodeJson
);

if (!periodeResponse.ok || !periodeJson.success) {
  throw new Error(
    periodeJson.message ||
      "Gagal mengambil periode."
  );
}

const daftarPeriode = Array.isArray(
  periodeJson.data
)
  ? periodeJson.data
  : [];

const periodeAktif =
  daftarPeriode.find(
    (item: any) =>
      String(item.status).toLowerCase() ===
      "dibuka"
  ) ?? null;

if (!periodeAktif) {
  throw new Error(
    "Tidak ada periode penilaian yang sedang dibuka."
  );
}

setPeriode(periodeAktif);

const penilaianResponse = await fetch(
  `/api/pegawai-teladan/penilaian?periode_id=${encodeURIComponent(
    periodeAktif.id
  )}`,
  {
    method: "GET",
    cache: "no-store",
  }
);

const penilaianJson =
  await penilaianResponse.json();

console.log(
  "HASIL API PENILAIAN:",
  penilaianJson
);

if (
  !penilaianResponse.ok ||
  !penilaianJson.success
) {
  throw new Error(
    penilaianJson.message ||
      "Gagal mengambil data penilaian."
  );
}

setKriteria(
  Array.isArray(penilaianJson.kriteria)
    ? penilaianJson.kriteria
    : []
);

setPegawai(
  Array.isArray(
    penilaianJson.objek_penilaian
  )
    ? penilaianJson.objek_penilaian
    : []
);

setPenilaian(
  Array.isArray(penilaianJson.penilaian)
    ? penilaianJson.penilaian
    : []
);

setNilai(
  Array.isArray(penilaianJson.nilai)
    ? penilaianJson.nilai
    : []
);
      /* -------------------------------------------------------
         2. PENILAIAN / REKAP
      ------------------------------------------------------- */

      const response = await fetch(
        `/api/pegawai-teladan/penilaian?periode_id=${encodeURIComponent(
          periodeAktif.id
        )}`,
        {
          cache: "no-store",
        }
      );

      const json: ApiResponse =
        await response.json();

      if (!response.ok || !json.success) {
        throw new Error(
          json.message ||
            "Gagal mengambil data Pegawai Teladan."
        );
      }

      setKriteria(
        Array.isArray(json.kriteria)
          ? json.kriteria
          : []
      );

      setPegawai(
        Array.isArray(json.objek_penilaian)
          ? json.objek_penilaian
          : []
      );

      setPenilaian(
        Array.isArray(json.penilaian)
          ? json.penilaian
          : []
      );

      setNilai(
        Array.isArray(json.nilai)
          ? json.nilai
          : []
      );
    } catch (err: any) {
      console.error(
        "Load Pegawai Teladan:",
        err
      );

      setError(
        err?.message ||
          "Terjadi kesalahan saat mengambil data."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================
     LOAD
  ========================================================== */

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    if (!session) {
      setLoading(false);
      return;
    }

    loadData();
  }, [session, sessionStatus]);

  /* ==========================================================
     DATA REKAP
  ========================================================== */

  const rekap = useMemo(() => {
    return penilaian
      .map((item) => {
        const nilaiAkhir =
          hitungNilaiAkhir(
            item.id,
            kriteria,
            nilai
          );

        return {
          ...item,
          nilaiAkhir,
        };
      })
      .filter(
        (item) =>
          item.nilaiAkhir !== null
      )
      .sort((a, b) => {
        return (
          Number(b.nilaiAkhir ?? 0) -
          Number(a.nilaiAkhir ?? 0)
        );
      });
  }, [penilaian, nilai, kriteria]);

  const sudahDinilai =
    rekap.length;

  const totalPegawai =
    pegawai.length;

  const belumDinilai = Math.max(
    totalPegawai - sudahDinilai,
    0
  );

  const rataRata = useMemo(() => {
    if (rekap.length === 0) {
      return null;
    }

    const total = rekap.reduce(
      (sum, item) =>
        sum +
        Number(item.nilaiAkhir ?? 0),
      0
    );

    return Number(
      (total / rekap.length).toFixed(2)
    );
  }, [rekap]);

  /* ==========================================================
     FILTER PEGAWAI UNTUK PENILAI
  ========================================================== */

  const filteredPegawai = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return pegawai;
    }

    return pegawai.filter(
      (item) =>
        item.nama
          .toLowerCase()
          .includes(keyword) ||
        item.username
          .toLowerCase()
          .includes(keyword) ||
        item.role
          .toLowerCase()
          .includes(keyword)
    );
  }, [pegawai, search]);

  /* ==========================================================
     CEK SUDAH DINILAI
  ========================================================== */

  function getPenilaianPegawai(
    usernamePegawai: string
  ) {
    return penilaian.find(
      (item) =>
        item.pegawai_username ===
          usernamePegawai &&
        item.status !== "dibatalkan"
    );
  }
const penilaianSaya = useMemo(() => {
  if (!periode || !username) {
    return null;
  }

  return (
    penilaian.find(
      (item) =>
        item.periode_id === periode.id &&
        item.penilai_username === username &&
        item.status !== "dibatalkan"
    ) ?? null
  );
}, [penilaian, periode, username]);

const sudahMemilihPegawai =
  isPenilai && !!penilaianSaya;
  /* ==========================================================
     PILIH PEGAWAI
  ========================================================== */

  function selectPegawai(
    item: Pegawai
  ) {
    if (penilaianSaya) {
  setError(
    `Anda sudah memberikan penilaian kepada ${penilaianSaya.pegawai_nama} pada periode ${periode?.nama_periode || "ini"}.`
  );
  return;
}
    setSelectedPegawai(item);
    setCatatan("");

    const existing =
      penilaian.find(
        (p) =>
          p.pegawai_username ===
            item.username &&
          p.status !== "dibatalkan"
      );

    const form: Record<
      string,
      number
    > = {};

    if (existing) {
      const detail = nilai.filter(
        (n) =>
          n.penilaian_id ===
          existing.id
      );

      for (const n of detail) {
        form[n.kriteria_id] =
          Number(n.nilai);
      }

      setCatatan(
        existing.catatan || ""
      );
    }

    setNilaiForm(form);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* ==========================================================
     UPDATE NILAI
  ========================================================== */

  function updateScore(
    kriteriaId: string,
    value: string
  ) {
    setNilaiForm((prev) => ({
      ...prev,
      [kriteriaId]:
        value === ""
          ? 0
          : Number(value),
    }));
  }

  /* ==========================================================
     NILAI AKHIR FORM
  ========================================================== */

  const nilaiAkhirForm = useMemo(() => {
    if (!selectedPegawai) {
      return 0;
    }

    let total = 0;

    for (const k of kriteria) {
      const angka =
        Number(
          nilaiForm[k.id] ?? 0
        );

      const bobot =
        Number(k.bobot ?? 0);

      if (
        Number.isFinite(angka) &&
        Number.isFinite(bobot)
      ) {
        total +=
          angka *
          (bobot / 100);
      }
    }

    return Number(
      total.toFixed(2)
    );
  }, [
    selectedPegawai,
    nilaiForm,
    kriteria,
  ]);

  /* ==========================================================
     SUBMIT PENILAIAN
  ========================================================== */

  async function submitPenilaian() {
    if (!selectedPegawai) {
      setError(
        "Silakan pilih pegawai yang akan dinilai."
      );
      return;
    }

    if (!periode) {
      setError(
        "Periode penilaian tidak ditemukan."
      );
      return;
    }

    if (periode.status !== "dibuka") {
      setError(
        "Periode penilaian tidak sedang dibuka."
      );
      return;
    }
    if (!catatan.trim()) {
  setError(
    "Catatan Penilai wajib diisi sebelum penilaian dikirim."
  );
  return;
}

    /**
     * Pengaman tambahan di frontend.
     * Pengelola tidak boleh mengirim nilai.
     */
    if (isPengelola) {
      setError(
        "Pengelola Kepegawaian hanya dapat melihat rekap dan mencetak hasil."
      );
      return;
    }

    const values = kriteria.map(
      (k) => ({
        kriteria_id: k.id,
        nilai: Number(
          nilaiForm[k.id]
        ),
        catatan: "",
      })
    );

    const invalid = values.find(
      (item) => {
        const k =
          kriteria.find(
            (x) =>
              x.id ===
              item.kriteria_id
          );

        if (!k) return true;

        if (
          !Number.isFinite(
            item.nilai
          )
        ) {
          return true;
        }

        return (
          item.nilai <
            Number(k.nilai_min) ||
          item.nilai >
            Number(k.nilai_max)
        );
      }
    );

    if (invalid) {
      setError(
        "Pastikan seluruh nilai kriteria sudah diisi dan berada dalam rentang yang diperbolehkan."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          "/api/pegawai-teladan/penilaian",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              periode_id:
                periode.id,
              pegawai_username:
                selectedPegawai.username,
              nilai: values,
              catatan,
            }),
          }
        );

      const json =
        await response.json();

      if (
        !response.ok ||
        !json.success
      ) {
        throw new Error(
          json.message ||
            "Gagal menyimpan penilaian."
        );
      }

      setSuccess(
        "Penilaian Pegawai Teladan berhasil disimpan."
      );

      setSelectedPegawai(null);
      setNilaiForm({});
      setCatatan("");

      await loadData();
    } catch (err: any) {
      console.error(
        "Submit penilaian:",
        err
      );

      setError(
        err?.message ||
          "Terjadi kesalahan saat menyimpan penilaian."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ==========================================================
     PRINT
  ========================================================== */

  function cetakRekap() {
    if (!periode) {
      setError(
        "Periode belum tersedia."
      );
      return;
    }

    const url =
      `/pegawai-teladan/rekap/cetak?periode_id=${encodeURIComponent(
        periode.id
      )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /* ==========================================================
     LOADING SESSION
  ========================================================== */

  if (
    sessionStatus === "loading" ||
    loading
  ) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">
            Memuat Pegawai Teladan...
          </p>
        </div>
      </div>
    );
  }

  /* ==========================================================
     BELUM LOGIN
  ========================================================== */

  if (!session) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          Anda belum login.
        </div>
      </div>
    );
  }

  /* ==========================================================
     TAMPILAN UTAMA
  ========================================================== */

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
                <Award className="h-7 w-7" />
              </div>

              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Pegawai Teladan
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Penilaian dan rekapitulasi
                  Pegawai Teladan Bapas Kelas I
                  Jakarta Barat.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">

                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                    <UserCheck className="h-3.5 w-3.5" />
                    {namaUser || username}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {role}
                  </span>

                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
  {isPenilai && (
    <button
      type="button"
      onClick={loadData}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
    >
      <ClipboardList className="h-4 w-4" />
      Muat Ulang
    </button>
  )}
</div>
          </div>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="text-sm">
              <div className="font-semibold">
                Terjadi kesalahan
              </div>

              <div className="mt-1">
                {error}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="text-sm">
              {success}
            </div>
          </div>
        )}

        {/* ==================================================
            PERIODE
        ================================================== */}

        {!periode ? (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-center">
            <FileText className="mx-auto h-10 w-10 text-yellow-600" />

            <h2 className="mt-3 text-lg font-bold text-gray-800">
              Belum Ada Periode Aktif
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Belum tersedia periode Pegawai
              Teladan untuk ditampilkan.
            </p>
          </div>
        ) : (
          <>
            {/* ==============================================
                INFO PERIODE
            ============================================== */}

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Periode Aktif
                  </div>

                  <h2 className="mt-1 text-xl font-bold text-gray-900">
                    {periode.nama_periode}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500">

                    {periode.tanggal_mulai && (
                      <span>
                        Mulai:{" "}
                        {formatTanggal(
                          periode.tanggal_mulai
                        )}
                      </span>
                    )}

                    {periode.tanggal_selesai && (
                      <span>
                        • Selesai:{" "}
                        {formatTanggal(
                          periode.tanggal_selesai
                        )}
                      </span>
                    )}

                  </div>

                  {periode.keterangan && (
                    <p className="mt-2 text-sm text-gray-500">
                      {periode.keterangan}
                    </p>
                  )}
                </div>

                <span
                  className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClass(
                    periode.status
                  )}`}
                >
                  {getStatusLabel(
                    periode.status
                  )}
                </span>

              </div>
            </div>

            {/* ==============================================
                STATISTIK
            ============================================== */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">
                      Total Pegawai
                    </div>

                    <div className="mt-1 text-3xl font-bold text-gray-900">
                      {totalPegawai}
                    </div>
                  </div>

                  <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">
                      Sudah Dinilai
                    </div>

                    <div className="mt-1 text-3xl font-bold text-green-600">
                      {sudahDinilai}
                    </div>
                  </div>

                  <div className="rounded-xl bg-green-100 p-3 text-green-700">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">
                      Belum Dinilai
                    </div>

                    <div className="mt-1 text-3xl font-bold text-orange-600">
                      {belumDinilai}
                    </div>
                  </div>

                  <div className="rounded-xl bg-orange-100 p-3 text-orange-700">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">
                      Rata-rata Nilai
                    </div>

                    <div className="mt-1 text-3xl font-bold text-purple-600">
                      {rataRata !== null
                        ? formatNilai(
                            rataRata
                          )
                        : "-"}
                    </div>
                  </div>

                  <div className="rounded-xl bg-purple-100 p-3 text-purple-700">
                    <Award className="h-6 w-6" />
                  </div>
                </div>
              </div>

            </div>

            {/* ==================================================
                KHUSUS PENGELOLA KEPEGAWAIAN
            ================================================== */}

            {isPengelola && (
              <div className="space-y-5">

                {/* ------------------------------------------
                    HEADER REKAP
                ------------------------------------------ */}

                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

                  <div className="border-b border-gray-200 p-5">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          Rekapitulasi Penilaian
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                          Daftar pegawai yang telah
                          memperoleh penilaian pada
                          periode ini.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={cetakRekap}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                      >
                        <Printer className="h-4 w-4" />
                        Cetak Rekap
                      </button>

                    </div>

                  </div>

                  {/* ----------------------------------------
                      TABLE REKAP
                  ---------------------------------------- */}

                  {rekap.length === 0 ? (
                    <div className="p-10 text-center">

                      <ClipboardList className="mx-auto h-10 w-10 text-gray-300" />

                      <h3 className="mt-3 font-semibold text-gray-700">
                        Belum ada penilaian
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Belum ada pegawai yang
                        memperoleh penilaian pada
                        periode ini.
                      </p>

                    </div>
                  ) : (
                    <div className="overflow-x-auto">

                      <table className="w-full min-w-[900px] text-sm">

                        <thead>
                          <tr className="border-b bg-gray-50 text-left">

                            <th className="px-5 py-3 font-semibold text-gray-600">
                              No
                            </th>

                            <th className="px-5 py-3 font-semibold text-gray-600">
                              Pegawai
                            </th>

                            <th className="px-5 py-3 font-semibold text-gray-600">
                              NIP
                            </th>

                            <th className="px-5 py-3 font-semibold text-gray-600">
                              Jabatan / Role
                            </th>

                            <th className="px-5 py-3 font-semibold text-gray-600">
                              Penilai
                            </th>

                            <th className="px-5 py-3 text-right font-semibold text-gray-600">
                              Nilai Akhir
                            </th>

                          </tr>
                        </thead>

                        <tbody>

                          {rekap.map(
                            (
                              item,
                              index
                            ) => (
                              <tr
                                key={
                                  item.id
                                }
                                className="border-b last:border-0 hover:bg-gray-50"
                              >

                                <td className="px-5 py-4 text-gray-500">
                                  {index +
                                    1}
                                </td>

                                <td className="px-5 py-4">
                                  <div className="font-semibold text-gray-900">
                                    {
                                      item.pegawai_nama
                                    }
                                  </div>
                                </td>

                                <td className="px-5 py-4 font-mono text-xs text-gray-600">
                                  {
                                    item.pegawai_nip
                                  }
                                </td>

                                <td className="px-5 py-4 text-gray-600">
                                  {
                                    item.penilai_role ===
                                    item.pegawai_nama
                                      ? "-"
                                      : (
                                          pegawai.find(
                                            (
                                              p
                                            ) =>
                                              p.username ===
                                              item.pegawai_username
                                          )?.role ||
                                          "-"
                                        )
                                  }
                                </td>

                                <td className="px-5 py-4">

                                  <div className="font-medium text-gray-800">
                                    {
                                      item.penilai_nama
                                    }
                                  </div>

                                  <div className="text-xs text-gray-500">
                                    {
                                      item.penilai_role
                                    }
                                  </div>

                                </td>

                                <td className="px-5 py-4 text-right">

                                  <span className="inline-flex min-w-[80px] items-center justify-center rounded-lg bg-green-50 px-3 py-1.5 font-bold text-green-700">
                                    {formatNilai(
                                      item.nilaiAkhir
                                    )}
                                  </span>

                                </td>

                              </tr>
                            )
                          )}

                        </tbody>

                      </table>

                    </div>
                  )}

                </div>

                {/* ------------------------------------------
                    RINGKASAN
                ------------------------------------------ */}

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

                  <div className="flex items-start gap-3">

                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

                    <div>
                      <div className="font-semibold text-blue-900">
                        Akses Pengelola Kepegawaian
                      </div>

                      <p className="mt-1 text-sm leading-6 text-blue-800">
                        Akun Pengelola Kepegawaian
                        hanya memiliki akses untuk
                        melihat rekapitulasi dan
                        mencetak hasil Pegawai
                        Teladan. Akun ini tidak
                        dapat memberikan atau
                        mengubah nilai penilaian.
                      </p>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* ==================================================
                FORM PENILAIAN KHUSUS PENILAI
            ================================================== */}

            {isPenilai && !isPengelola && (
              <div className="space-y-5">

                {/* ------------------------------------------
                    PILIH PEGAWAI
                ------------------------------------------ */}

                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

                  <div className="border-b border-gray-200 p-5">

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          Daftar Pegawai
                        </h2>
{sudahMemilihPegawai && penilaianSaya && (
  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
    <div className="font-semibold text-amber-800">
      Anda sudah memilih pegawai untuk periode ini
    </div>

    <div className="mt-1 text-sm text-amber-700">
      Pegawai yang dinilai:{" "}
      <span className="font-semibold">
        {penilaianSaya.pegawai_nama}
      </span>
    </div>

    <div className="mt-1 text-xs text-amber-600">
      Setiap penilai hanya diperbolehkan memilih 1 pegawai
      dalam 1 periode.
    </div>
  </div>
)}
                        <p className="mt-1 text-sm text-gray-500">
                          Pilih pegawai yang akan
                          dinilai.
                        </p>
                      </div>

                      <div className="relative w-full md:w-80">

                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                        <input
                          type="text"
                          value={search}
                          onChange={(e) =>
                            setSearch(
                              e.target.value
                            )
                          }
                          placeholder="Cari nama / NIP / role..."
                          className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                      </div>

                    </div>

                  </div>

                  <div className="p-5">

                    {filteredPegawai.length ===
                    0 ? (
                      <div className="py-10 text-center">

                        <Users className="mx-auto h-10 w-10 text-gray-300" />

                        <p className="mt-3 text-sm text-gray-500">
                          Pegawai tidak ditemukan.
                        </p>

                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">

                        {filteredPegawai.map(
                          (item) => {
                            const existing =
                              getPenilaianPegawai(
                                item.username
                              );

                            const isSelected =
                              selectedPegawai?.username ===
                              item.username;

                            return (
                              <button
                                key={
                                  item.id
                                }
                                type="button"
                            onClick={() => {
  if (!existing && !sudahMemilihPegawai) {
    selectPegawai(item);
  }
}}
disabled={!!existing || sudahMemilihPegawai}
                                
                                className={`rounded-xl border p-4 text-left transition ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                                    : existing
                                    ? "cursor-not-allowed border-green-200 bg-green-50"
                                    : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                                }`}
                              >

                                <div className="flex items-start justify-between gap-3">

                                  <div className="min-w-0">

                                    <div className="truncate font-semibold text-gray-900">
                                      {
                                        item.nama
                                      }
                                    </div>

                                    <div className="mt-1 font-mono text-xs text-gray-500">
                                      {
                                        item.username
                                      }
                                    </div>

                                    <div className="mt-2 text-xs text-gray-600">
                                      {
                                        item.role
                                      }
                                    </div>

                                  </div>

                                  {existing ? (
                                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                                  ) : (
                                    <UserCheck className="h-5 w-5 shrink-0 text-gray-400" />
                                  )}

                                </div>

                                {existing && (
                                  <div className="mt-3 rounded-lg bg-green-100 px-3 py-2 text-xs font-medium text-green-700">
                                    Sudah dinilai
                                  </div>
                                )}

                              </button>
                            );
                          }
                        )}

                      </div>
                    )}

                  </div>

                </div>

                {/* ------------------------------------------
                    FORM NILAI
                ------------------------------------------ */}

                {selectedPegawai && (
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

                    <div className="border-b border-gray-200 p-5">

                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Pegawai yang Dinilai
                          </div>

                          <h2 className="mt-1 text-xl font-bold text-gray-900">
                            {
                              selectedPegawai.nama
                            }
                          </h2>

                          <div className="mt-1 text-sm text-gray-500">
                            {
                              selectedPegawai.username
                            }
                            {" • "}
                            {
                              selectedPegawai.role
                            }
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPegawai(
                              null
                            )
                          }
                          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                        >
                          Batal
                        </button>

                      </div>

                    </div>

                    <div className="p-5 space-y-5">

                      {/* ------------------------------------
                          KRITERIA
                      ------------------------------------ */}

                      {kriteria.map(
                        (k, index) => {

                          const pedoman =
                            parsePedoman(
                              k.pedoman_nilai
                            );

                          return (
                            <div
                              key={
                                k.id
                              }
                              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                            >

                              <div className="flex flex-col gap-4 md:flex-row md:items-start">

                                <div className="flex-1">

                                  <div className="flex items-start gap-3">

                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
                                      {index +
                                        1}
                                    </div>

                                    <div>
                                      <h3 className="font-bold text-gray-900">
                                        {
                                          k.nama_kriteria
                                        }
                                      </h3>

                                      {k.deskripsi && (
                                        <p className="mt-1 text-sm text-gray-600">
                                          {
                                            k.deskripsi
                                          }
                                        </p>
                                      )}

                                      <div className="mt-2 flex flex-wrap gap-2">

                                        <span className="rounded-full bg-white border px-2.5 py-1 text-xs text-gray-600">
                                          Bobot{" "}
                                          {
                                            k.bobot
                                          }
                                          %
                                        </span>

                                        <span className="rounded-full bg-white border px-2.5 py-1 text-xs text-gray-600">
                                          Nilai{" "}
                                          {
                                            k.nilai_min
                                          }{" "}
                                          -
                                          {
                                            k.nilai_max
                                          }
                                        </span>

                                      </div>
                                    </div>

                                  </div>

                                  {k.indikator && (
                                    <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
                                      <div className="text-xs font-bold text-blue-700">
                                        Indikator
                                      </div>

                                      <div className="mt-1 whitespace-pre-line text-sm text-blue-900">
                                        {
                                          k.indikator
                                        }
                                      </div>
                                    </div>
                                  )}

                                  {pedoman.length >
                                    0 && (
                                    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
                                      <div className="text-xs font-bold text-gray-600">
                                        Pedoman Nilai
                                      </div>

                                      <div className="mt-2 space-y-1">

                                        {pedoman.map(
                                          (
                                            p,
                                            pIndex
                                          ) => (
                                            <div
                                              key={
                                                pIndex
                                              }
                                              className="flex gap-3 text-xs text-gray-600"
                                            >
                                              {p.range && (
                                                <span className="w-24 shrink-0 font-semibold text-gray-800">
                                                  {
                                                    p.range
                                                  }
                                                </span>
                                              )}

                                              <span>
                                                {
                                                  p.text
                                                }
                                              </span>
                                            </div>
                                          )
                                        )}

                                      </div>
                                    </div>
                                  )}

                                </div>

                                <div className="w-full md:w-40">

        <label className="mb-2 block text-sm font-semibold text-gray-700">
  Catatan Penilai <span className="text-red-600">*</span>
</label>

                                  <input
                                    type="number"
                                    min={
                                      k.nilai_min
                                    }
                                    max={
                                      k.nilai_max
                                    }
                                    step="0.01"
                                    value={
                                      nilaiForm[
                                        k.id
                                      ] ??
                                      ""
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      updateScore(
                                        k.id,
                                        e.target
                                          .value
                                      )
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-lg font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                  />

                                  <div className="mt-1 text-center text-xs text-gray-400">
                                    {
                                      k.nilai_min
                                    }{" "}
                                    s.d.{" "}
                                    {
                                      k.nilai_max
                                    }
                                  </div>

                                </div>

                              </div>

                            </div>
                          );
                        }
                      )}

                      {/* ------------------------------------
                          NILAI AKHIR
                      ------------------------------------ */}

                      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

                        <div className="flex items-center justify-between gap-4">

                          <div>
                            <div className="text-sm font-semibold text-blue-700">
                              Nilai Akhir
                            </div>

                            <div className="mt-1 text-xs text-blue-600">
                              Nilai dihitung berdasarkan
                              bobot masing-masing kriteria.
                            </div>
                          </div>

                          <div className="text-3xl font-bold text-blue-800">
                            {formatNilai(
                              nilaiAkhirForm
                            )}
                          </div>

                        </div>

                      </div>

                      {/* ------------------------------------
                          CATATAN
                      ------------------------------------ */}

                      <div>

                      <label className="mb-2 block text-sm font-semibold text-gray-700">
  Catatan Penilai <span className="text-red-600">*</span>
</label>

<textarea
  value={catatan}
  onChange={(e) => setCatatan(e.target.value)}
  rows={4}
  placeholder="Catatan Penilai wajib diisi..."
  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
/>

                      </div>

                      {/* ------------------------------------
                          SUBMIT
                      ------------------------------------ */}

                      <div className="flex justify-end">

                        <button
                          type="button"
                          onClick={
                            submitPenilaian
                          }
                          disabled={
                            submitting ||
                            periode.status !==
                              "dibuka"
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Menyimpan...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Kirim Penilaian
                            </>
                          )}

                        </button>

                      </div>

                      {periode.status !==
                        "dibuka" && (
                        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                          Periode penilaian saat
                          ini tidak sedang dibuka.
                        </div>
                      )}

                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ==================================================
                JIKA ROLE TIDAK SESUAI
            ================================================== */}

            {!isPengelola &&
              !isPenilai && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

                  <div className="flex items-start gap-3">

                    <XCircle className="mt-0.5 h-6 w-6 text-red-600" />

                    <div>
                      <h2 className="font-bold text-red-800">
                        Akses Tidak Tersedia
                      </h2>

                      <p className="mt-1 text-sm text-red-700">
                        Role{" "}
                        <strong>
                          {role || "-"}
                        </strong>{" "}
                        tidak memiliki kewenangan
                        untuk mengakses modul
                        Pegawai Teladan.
                      </p>
                    </div>

                  </div>

                </div>
              )}

          </>
        )}

      </div>
    </div>
  );
}