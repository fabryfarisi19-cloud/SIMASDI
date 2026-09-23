"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Archive,
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  ChevronRight,
  CircleUserRound,
  ClipboardCheck,
  Download,
  Eye,
  FileArchive,
  FileBadge,
  FileCheck,
  FileText,
  GraduationCap,
  Heart,
  IdCard,
  Landmark,
  Loader2,
  Medal,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  Users,
  WalletCards,
  X,
} from "lucide-react";

type SubKategori = {
  nama: string;
  deskripsi: string;
  icon: any;
  kategoriSimpan?: string;
  aliases?: string[];
  legacyOnly?: boolean;
};

type KategoriArsip = {
  nama: string;
  deskripsi: string;
  icon: any;
  items: SubKategori[];
};

type Arsip = {
  id: string;
  pengguna_id?: string | null;
  nip: string;
  nama_pegawai?: string | null;
  kategori?: string | null;
  jenis_dokumen?: string | null;
  nama_dokumen?: string | null;
  nomor_dokumen?: string | null;
  tanggal_dokumen?: string | null;
  tahun?: string | number | null;
  nama_file?: string | null;
  file_path?: string | null;
  keterangan?: string | null;
  uploaded_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  file_url?: string | null;
  file_tersedia?: boolean;
  signed_url_berhasil?: boolean;
};

type Pegawai = {
  id: string;
  nama: string;
  username: string;
  role?: string | null;
  status?: string | null;
};

const ROLE_ADMIN_KEPEGAWAIAN = [
  "pengelola kepegawaian",
  "kaur kepegawaian",
  "admin kepegawaian",
  "admin",
];

function normalizeKategori(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function formatTanggal(value: string | null | undefined) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getKategoriValue(item: SubKategori) {
  return item.kategoriSimpan ?? item.nama;
}

function kategoriCocok(
  arsip: Arsip,
  item: SubKategori
): boolean {
  const kategori = normalizeKategori(arsip.kategori);

  const namaDokumen = normalizeText(
    arsip.nama_dokumen
  );

  const jenisDokumen = normalizeText(
    arsip.jenis_dokumen
  );

  const namaFile = normalizeText(arsip.nama_file);

  const namaItem = normalizeKategori(item.nama);

  const teks = `
    ${namaDokumen}
    ${jenisDokumen}
    ${namaFile}
  `.toLowerCase();

  /*
   * =========================================================
   * 1. PANGKAT
   * =========================================================
   */
  if (namaItem === "PANGKAT") {
    if (
      kategori !== "SK PANGKAT/GOLONGAN" &&
      kategori !== "SK PANGKAT//GOLONGAN"
    ) {
      return false;
    }

    if (
      teks.includes("sk pangkat pns") ||
      teks.includes("sk pangkat cpns") ||
      teks.includes("pangkat pns") ||
      teks.includes("pangkat cpns")
    ) {
      return false;
    }

    if (
      teks.includes("sk iib") ||
      teks.includes("sk iic") ||
      teks.includes("sk iiia") ||
      teks.includes("sk iiib") ||
      teks.includes("sk iiic")
    ) {
      return true;
    }

    return false;
  }

  /*
   * =========================================================
   * 2. SK CPNS
   * =========================================================
   */
  if (namaItem === "SK CPNS") {
    if (
      kategori === "SK CPNS" ||
      kategori === "SK" ||
      kategori === "SK PANGKAT/GOLONGAN"
    ) {
      return (
        teks.includes("sk cpns") ||
        teks.includes("pangkat cpns")
      );
    }

    return false;
  }

  /*
   * =========================================================
   * 3. SK PNS
   * =========================================================
   */
  if (namaItem === "SK PNS") {
    if (
      kategori === "SK PNS" ||
      kategori === "SK" ||
      kategori === "SK PANGKAT/GOLONGAN"
    ) {
      if (
        teks.includes("sk cpns") ||
        teks.includes("pangkat cpns")
      ) {
        return false;
      }

      return (
        teks.includes("sk pns") ||
        teks.includes("pangkat pns") ||
        teks.includes("pengangkatan pns")
      );
    }

    return false;
  }

  /*
   * =========================================================
   * 4. SK JABATAN
   * =========================================================
   */
  if (namaItem === "SK JABATAN") {
    if (kategori === "SK JABATAN") {
      return true;
    }

    if (kategori === "SK") {
      return teks.includes("jabatan");
    }

    return false;
  }

  /*
   * =========================================================
   * 5. KATEGORI NORMAL
   * =========================================================
   */
  const values = [
    getKategoriValue(item),
    item.nama,
    ...(item.aliases ?? []),
  ]
    .filter(Boolean)
    .map(normalizeKategori);

  if (values.includes(kategori)) {
    return true;
  }

  return false;
}

function semuaSubKategori() {
  return kategoriArsip.flatMap((group) => group.items);
}

function cariSubKategori(
  value: string
): SubKategori | undefined {
  const target = normalizeKategori(value);

  return semuaSubKategori().find((item) => {
    const values = [
      item.nama,
      item.kategoriSimpan,
      ...(item.aliases ?? []),
    ]
      .filter(Boolean)
      .map(normalizeKategori);

    return values.includes(target);
  });
}

/*
 * =========================================================
 * DATA KATEGORI ARSIP
 * =========================================================
 */
const kategoriArsip: KategoriArsip[] = [
  {
    nama: "Dasar",
    deskripsi: "Dokumen identitas dasar pegawai",
    icon: IdCard,
    items: [
      {
        nama: "Pas Foto",
        deskripsi: "Pas foto pegawai",
        icon: Camera,
      },
      {
        nama: "Akta Lahir",
        deskripsi: "Dokumen akta kelahiran pegawai",
        icon: FileBadge,
      },
      {
        nama: "Kartu Keluarga",
        deskripsi: "Kartu Keluarga",
        icon: Users,
        aliases: ["KK"],
      },
      {
        nama: "KTP",
        deskripsi: "Kartu Tanda Penduduk",
        icon: IdCard,
      },
      {
        nama: "BPJS",
        deskripsi: "Dokumen BPJS",
        icon: ShieldCheck,
      },
    ],
  },

  {
    nama: "Pendidikan",
    deskripsi:
      "Dokumen pendidikan dan pengembangan kompetensi",
    icon: GraduationCap,
    items: [
      {
        nama: "Ijazah Sekolah Formal",
        deskripsi: "Ijazah pendidikan formal",
        icon: GraduationCap,
        aliases: ["Pendidikan"],
      },
      {
        nama: "Sertifikat Bahasa Asing",
        deskripsi:
          "Sertifikat kemampuan bahasa asing",
        icon: BookOpen,
      },
      {
        nama:
          "Sertifikat Seminar / Workshop / Lokakarya / Sosialisasi",
        deskripsi:
          "Sertifikat kegiatan seminar, workshop, lokakarya atau sosialisasi",
        icon: FileCheck,
      },
      {
        nama: "STTP Diklat",
        deskripsi:
          "Surat Tanda Tamat Pendidikan dan Pelatihan",
        icon: FileBadge,
        aliases: ["Sertifikat Diklat"],
      },
      {
        nama: "Sertifikat Kursus",
        deskripsi:
          "Sertifikat kursus atau pelatihan",
        icon: BookOpen,
      },
      {
        nama: "Tugas Belajar",
        deskripsi: "Dokumen tugas belajar",
        icon: GraduationCap,
      },
      {
        nama: "Izin Belajar",
        deskripsi: "Dokumen izin belajar",
        icon: GraduationCap,
      },
      {
        nama: "Pencantuman Gelar",
        deskripsi:
          "Dokumen pencantuman gelar",
        icon: FileBadge,
      },
      {
        nama: "Sertifikat Diklat (Arsip Lama)",
        deskripsi:
          "Arsip sertifikat diklat lama",
        icon: Archive,
        kategoriSimpan: "Sertifikat Diklat",
        legacyOnly: true,
      },
    ],
  },

  {
    nama: "Keluarga",
    deskripsi: "Dokumen keluarga pegawai",
    icon: Users,
    items: [
      {
        nama: "Kartu Keluarga",
        deskripsi: "Kartu Keluarga",
        icon: Users,
        aliases: ["KK"],
      },
      {
        nama: "Pas Foto Pasangan",
        deskripsi: "Pas foto pasangan",
        icon: Camera,
      },
      {
        nama: "Riwayat Pernikahan",
        deskripsi: "Dokumen pernikahan",
        icon: Heart,
        aliases: ["Buku Nikah"],
      },
      {
        nama: "Karis / Karsu",
        deskripsi:
          "Kartu istri atau kartu suami",
        icon: Heart,
      },
      {
        nama: "Akte Lahir Anak",
        deskripsi:
          "Dokumen akta kelahiran anak",
        icon: Users,
        aliases: [
          "Anak & Istri",
          "Anak & Istri/Suami",
        ],
      },
    ],
  },

  {
    nama: "Kepegawaian",
    deskripsi:
      "Dokumen administrasi kepegawaian",
    icon: BriefcaseBusiness,
    items: [
      {
        nama: "SK CPNS",
        deskripsi:
          "Surat keputusan pengangkatan CPNS",
        icon: FileText,
      },
      {
        nama: "SK PNS",
        deskripsi:
          "Surat keputusan pengangkatan PNS",
        icon: FileText,
      },
      {
        nama: "Karpeg",
        deskripsi: "Kartu pegawai",
        icon: IdCard,
      },
      {
        nama: "KPE",
        deskripsi:
          "Kartu Pegawai Elektronik",
        icon: IdCard,
      },
      {
        nama: "Kartu ASN Virtual",
        deskripsi:
          "Kartu ASN Virtual",
        icon: IdCard,
      },
      {
        nama: "DRH",
        deskripsi:
          "Daftar Riwayat Hidup",
        icon: FileText,
      },
      {
        nama: "DRP",
        deskripsi:
          "Daftar Riwayat Pekerjaan",
        icon: FileText,
      },
      {
        nama: "Pangkat",
        deskripsi:
          "Dokumen administrasi pangkat",
        icon: FileBadge,
      },
      {
        nama: "Ujian Dinas",
        deskripsi:
          "Dokumen ujian dinas",
        icon: ClipboardCheck,
      },
      {
        nama: "SK PPNPN",
        deskripsi:
          "Surat keputusan PPNPN",
        icon: FileText,
      },
      {
        nama: "SK PMK",
        deskripsi:
          "Surat keputusan masa kerja",
        icon: FileText,
      },
      {
        nama: "Pakta Integritas",
        deskripsi:
          "Dokumen pakta integritas",
        icon: ShieldCheck,
      },
      {
        nama: "Surat Pernyataan Lainnya",
        deskripsi:
          "Surat pernyataan kepegawaian",
        icon: FileText,
      },
    ],
  },

  {
    nama: "Keuangan",
    deskripsi:
      "Dokumen administrasi keuangan",
    icon: WalletCards,
    items: [
      {
        nama: "NPWP",
        deskripsi: "Dokumen NPWP",
        icon: WalletCards,
      },
      {
        nama: "Buku Tabungan",
        deskripsi:
          "Buku rekening atau tabungan",
        icon: WalletCards,
      },
      {
        nama: "LHKPN",
        deskripsi:
          "Laporan Harta Kekayaan Penyelenggara Negara",
        icon: FileText,
      },
      {
        nama: "LHKAN",
        deskripsi:
          "Laporan Harta Kekayaan Aparatur Negara",
        icon: FileText,
      },
      {
        nama: "KGB",
        deskripsi:
          "Kenaikan Gaji Berkala",
        icon: WalletCards,
      },
    ],
  },

  {
    nama: "Jabatan",
    deskripsi:
      "Dokumen jabatan dan pelaksanaan tugas",
    icon: Landmark,
    items: [
      {
        nama: "SK Jabatan",
        deskripsi:
          "Surat keputusan kepegawaian",
        icon: FileBadge,
      },
      {
        nama: "SK Pindah Instansi",
        deskripsi:
          "Surat keputusan pindah instansi",
        icon: FileText,
      },
      {
        nama:
          "Pelantikan dan Pengambilan Sumpah",
        deskripsi:
          "Dokumen pelantikan dan sumpah jabatan",
        icon: Landmark,
      },
      {
        nama: "SPP",
        deskripsi:
          "Surat Perintah Pelaksanaan",
        icon: FileText,
      },
      {
        nama: "SPMT",
        deskripsi:
          "Surat Pernyataan Melaksanakan Tugas",
        icon: FileText,
      },
      {
        nama: "SPMJ",
        deskripsi:
          "Surat Pernyataan Melaksanakan Jabatan",
        icon: FileText,
      },
      {
        nama: "SPMMJ",
        deskripsi:
          "Surat Pernyataan Melaksanakan Masa Jabatan",
        icon: FileText,
      },
      {
        nama: "Uji Kompetensi",
        deskripsi:
          "Dokumen uji kompetensi",
        icon: ClipboardCheck,
      },
      {
        nama: "Ujian Dinas",
        deskripsi:
          "Dokumen ujian dinas",
        icon: ClipboardCheck,
      },
    ],
  },

  {
    nama: "Penilaian",
    deskripsi:
      "Dokumen penilaian dan penghargaan",
    icon: Medal,
    items: [
      {
        nama: "SKP",
        deskripsi:
          "Sasaran Kinerja Pegawai",
        icon: ClipboardCheck,
      },
      {
        nama: "PAK",
        deskripsi:
          "Penetapan Angka Kredit",
        icon: ClipboardCheck,
      },
      {
        nama: "Penghargaan",
        deskripsi:
          "Dokumen penghargaan pegawai",
        icon: Medal,
      },
      {
        nama: "Bebas Hukdis",
        deskripsi:
          "Surat bebas hukuman disiplin",
        icon: ShieldCheck,
      },
      {
        nama: "Hukdis",
        deskripsi:
          "Dokumen hukuman disiplin",
        icon: FileText,
      },
    ],
  },

  {
    nama: "Persiapan Pensiun",
    deskripsi:
      "Dokumen persiapan dan administrasi pensiun",
    icon: Landmark,
    items: [
      {
        nama: "Taspen",
        deskripsi: "Dokumen Taspen",
        icon: FileBadge,
      },
      {
        nama: "DPCP",
        deskripsi:
          "Data Perorangan Calon Penerima Pensiun",
        icon: FileText,
      },
      {
        nama: "SK Pensiun",
        deskripsi:
          "Surat keputusan pensiun",
        icon: FileBadge,
      },
    ],
  },
];

/*
 * =========================================================
 * CARD DOKUMEN
 * =========================================================
 */
function DokumenCard({
  item,
  onDelete,
}: {
  item: Arsip;
  isAdmin: boolean;
  onDelete: (item: Arsip) => void;
}) {
  const [deleting, setDeleting] =
    useState(false);

  const namaDokumen =
    item.nama_dokumen ||
    item.jenis_dokumen ||
    "Dokumen";

  const namaFile =
    item.nama_file ||
    "File tidak diketahui";

  const lihat = () => {
    if (!item.file_url) {
      alert(
        "File belum tersedia atau URL file gagal dibuat."
      );
      return;
    }

    window.open(
      item.file_url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const print = () => {
    if (!item.file_url) {
      alert("File belum tersedia.");
      return;
    }

    const printWindow = window.open(
      item.file_url,
      "_blank"
    );

    if (!printWindow) {
      alert(
        "Browser memblokir jendela baru. Silakan izinkan pop-up untuk SIMASDI."
      );
      return;
    }

    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch {
        // Browser tertentu tidak mengizinkan print otomatis.
      }
    }, 1500);
  };

  const download = () => {
    if (!item.file_url) {
      alert("File belum tersedia.");
      return;
    }

    const link =
      document.createElement("a");

    link.href = item.file_url;
    link.download =
      item.nama_file ||
      "dokumen-arsip";

    link.target = "_blank";
    link.rel =
      "noopener noreferrer";

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDelete = async () => {
    if (deleting) return;

    const yakin = window.confirm(
      `Hapus dokumen "${namaDokumen}"?\n\nFile akan dihapus dari arsip SIMASDI.`
    );

    if (!yakin) return;

    setDeleting(true);

    try {
      const response =
        await fetch(
          `/api/arsip-kepegawaian?id=${encodeURIComponent(
            item.id
          )}`,
          {
            method: "DELETE",
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
            "Dokumen gagal dihapus."
        );
      }

      onDelete(item);
    } catch (error: any) {
      alert(
        error?.message ||
          "Terjadi kesalahan saat menghapus dokumen."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-12 sm:w-12">
          <FileText
            size={22}
            className="sm:h-6 sm:w-6"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="break-words text-sm font-bold leading-5 text-slate-800 sm:text-base">
            {namaDokumen}
          </h4>

          <p className="mt-1 break-all text-xs leading-5 text-slate-500 sm:text-sm">
            File: {namaFile}
          </p>

          {item.nomor_dokumen && (
            <p className="mt-1 break-words text-xs text-slate-400">
              Nomor:{" "}
              {item.nomor_dokumen}
            </p>
          )}

          {item.tanggal_dokumen && (
            <p className="mt-1 text-xs text-slate-400">
              Tanggal:{" "}
              {formatTanggal(
                item.tanggal_dokumen
              )}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 sm:flex sm:flex-wrap">
        <button
          type="button"
          onClick={lihat}
          disabled={!item.file_url}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          <Eye size={15} />
          Lihat
        </button>

        <button
          type="button"
          onClick={print}
          disabled={!item.file_url}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          <Printer size={15} />
          Print
        </button>

        <button
          type="button"
          onClick={download}
          disabled={!item.file_url}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          <Download size={15} />
          Download
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          {deleting ? (
            <Loader2
              size={15}
              className="animate-spin"
            />
          ) : (
            <Trash2 size={15} />
          )}

          Hapus
        </button>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * CARD KATEGORI
 * =========================================================
 */
function KategoriCard({
  item,
  jumlah,
  aktif,
  onClick,
}: {
  item: SubKategori;
  jumlah: number;
  aktif: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full min-w-0 overflow-hidden rounded-2xl border p-4 text-left transition sm:p-5 ${
        aktif
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${
            aktif
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700"
          }`}
        >
          <Icon
            size={21}
            className="sm:h-[23px] sm:w-[23px]"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <h3 className="break-words text-sm font-bold leading-5 text-slate-800">
              {item.nama}
            </h3>

            <ChevronRight
              size={18}
              className={`mt-0.5 shrink-0 ${
                aktif
                  ? "text-blue-600"
                  : "text-slate-400"
              }`}
            />
          </div>

          <p className="mt-1 break-words text-xs leading-5 text-slate-500">
            {item.deskripsi}
          </p>

          {jumlah > 0 && (
            <div className="mt-3">
              <span className="inline-flex max-w-full items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                {jumlah} dokumen
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/*
 * =========================================================
 * HALAMAN UTAMA
 * =========================================================
 */
export default function ArsipKepegawaianPage() {
  const {
    data: session,
    status,
  } = useSession();

  const [nipDipilih, setNipDipilih] =
    useState("");

  const [nama, setNama] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [role, setRole] =
    useState("");

  const [
    daftarPegawai,
    setDaftarPegawai,
  ] = useState<Pegawai[]>([]);

  const [
    pencarian,
    setPencarian,
  ] = useState("");

  const [
    loadingPegawai,
    setLoadingPegawai,
  ] = useState(false);

  const [
    arsipPegawai,
    setArsipPegawai,
  ] = useState<Arsip[]>([]);

  const [
    loadingArsip,
    setLoadingArsip,
  ] = useState(false);

  const [
    kategoriUtama,
    setKategoriUtama,
  ] = useState("Semua");

  const [
    kategoriDipilih,
    setKategoriDipilih,
  ] = useState("");

  const [
    showUpload,
    setShowUpload,
  ] = useState(false);

  const [
    uploadFile,
    setUploadFile,
  ] = useState<File | null>(null);

  const [
    namaDokumen,
    setNamaDokumen,
  ] = useState("");

  const [
    nomorDokumen,
    setNomorDokumen,
  ] = useState("");

  const [
    tanggalDokumen,
    setTanggalDokumen,
  ] = useState("");

  const [
    tahunDokumen,
    setTahunDokumen,
  ] = useState(
    String(new Date().getFullYear())
  );

  const [
    keteranganDokumen,
    setKeteranganDokumen,
  ] = useState("");

  const [
    uploadLoading,
    setUploadLoading,
  ] = useState(false);

  const [pesan, setPesan] =
    useState("");

  const roleNormal =
    role.trim().toLowerCase();

  const isAdminKepegawaian =
    ROLE_ADMIN_KEPEGAWAIAN.includes(
      roleNormal
    );

  /*
   * =========================================================
   * SESSION
   * =========================================================
   */
  useEffect(() => {
    if (!session?.user) return;

    const user =
      session.user as any;

    const sessionNama =
      String(
        user.nama ??
          user.name ??
          ""
      ).trim();

    const sessionUsername =
      String(
        user.username ?? ""
      ).trim();

    const sessionRole =
      String(
        user.role ?? ""
      ).trim();

    setNama(sessionNama);
    setUsername(sessionUsername);
    setRole(sessionRole);

    if (
      !ROLE_ADMIN_KEPEGAWAIAN.includes(
        sessionRole.toLowerCase()
      )
    ) {
      setNipDipilih(
        sessionUsername
      );
    }

    if (
      ROLE_ADMIN_KEPEGAWAIAN.includes(
        sessionRole.toLowerCase()
      )
    ) {
      try {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const nipURL =
          params.get("nip")?.trim() ||
          "";

        if (nipURL) {
          setNipDipilih(
            nipURL
          );
        } else {
          setNipDipilih(
            sessionUsername
          );
        }
      } catch {
        setNipDipilih(
          sessionUsername
        );
      }
    }
  }, [session]);

  /*
   * =========================================================
   * DAFTAR PEGAWAI ADMIN
   * =========================================================
   */
  useEffect(() => {
    if (
      status !==
        "authenticated" ||
      !isAdminKepegawaian
    ) {
      return;
    }

    let aktif = true;

    const loadPegawai =
      async () => {
        setLoadingPegawai(
          true
        );

        try {
          const response =
            await fetch(
              "/api/arsip-kepegawaian?mode=pegawai",
              {
                cache: "no-store",
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
                "Gagal mengambil daftar pegawai."
            );
          }

          if (aktif) {
            const data =
              Array.isArray(
                result.data
              )
                ? result.data
                : [];

            setDaftarPegawai(
              data
            );
          }
        } catch (error: any) {
          console.error(error);

          if (aktif) {
            setPesan(
              error?.message ||
                "Gagal mengambil daftar pegawai."
            );
          }
        } finally {
          if (aktif) {
            setLoadingPegawai(
              false
            );
          }
        }
      };

    loadPegawai();

    return () => {
      aktif = false;
    };
  }, [
    status,
    isAdminKepegawaian,
  ]);

  /*
   * =========================================================
   * AMBIL ARSIP
   * =========================================================
   */
  useEffect(() => {
    if (
      status !==
        "authenticated" ||
      !nipDipilih
    ) {
      return;
    }

    let aktif = true;

    const loadArsip =
      async () => {
        setLoadingArsip(
          true
        );
        setPesan("");

        try {
          const response =
            await fetch(
              `/api/arsip-kepegawaian?nip=${encodeURIComponent(
                nipDipilih
              )}`,
              {
                cache: "no-store",
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
                "Gagal mengambil arsip."
            );
          }

          if (aktif) {
            setArsipPegawai(
              Array.isArray(
                result.data
              )
                ? result.data
                : []
            );
          }
        } catch (error: any) {
          console.error(error);

          if (aktif) {
            setArsipPegawai(
              []
            );

            setPesan(
              error?.message ||
                "Gagal mengambil arsip kepegawaian."
            );
          }
        } finally {
          if (aktif) {
            setLoadingArsip(
              false
            );
          }
        }
      };

    loadArsip();

    return () => {
      aktif = false;
    };
  }, [
    status,
    nipDipilih,
  ]);

  /*
   * =========================================================
   * PEGAWAI AKTIF
   * =========================================================
   */
  const pegawaiAktif =
    useMemo(() => {
      return daftarPegawai.find(
        (item) =>
          String(
            item.username
          ).trim() ===
          String(
            nipDipilih
          ).trim()
      );
    }, [
      daftarPegawai,
      nipDipilih,
    ]);

  const namaPegawaiAktif =
    pegawaiAktif?.nama ||
    (nipDipilih ===
    username
      ? nama
      : "") ||
    nipDipilih;

  /*
   * =========================================================
   * FILTER PEGAWAI
   * =========================================================
   */
  const pegawaiTerfilter =
    useMemo(() => {
      const kata =
        pencarian
          .trim()
          .toLowerCase();

      if (!kata) {
        return daftarPegawai;
      }

      return daftarPegawai.filter(
        (item) => {
          return (
            String(
              item.nama ?? ""
            )
              .toLowerCase()
              .includes(kata) ||
            String(
              item.username ?? ""
            )
              .toLowerCase()
              .includes(kata) ||
            String(
              item.role ?? ""
            )
              .toLowerCase()
              .includes(kata)
          );
        }
      );
    }, [
      daftarPegawai,
      pencarian,
    ]);

  /*
   * =========================================================
   * JUMLAH KATEGORI
   * =========================================================
   */
  const jumlahKategori = (
    item: SubKategori
  ) => {
    return arsipPegawai.filter(
      (arsip) =>
        kategoriCocok(
          arsip,
          item
        )
    ).length;
  };

  /*
   * Legacy hanya muncul jika ada dokumen.
   */
  const kategoriUntukTampilan =
    kategoriArsip.map(
      (group) => ({
        ...group,
        items:
          group.items.filter(
            (item) =>
              !item.legacyOnly ||
              jumlahKategori(
                item
              ) > 0
          ),
      })
    );

  /*
   * =========================================================
   * ARSIP KATEGORI AKTIF
   * =========================================================
   */
  const arsipKategoriDipilih =
    useMemo(() => {
      if (!kategoriDipilih) {
        return [];
      }

      const item =
        cariSubKategori(
          kategoriDipilih
        );

      if (!item) {
        return arsipPegawai.filter(
          (arsip) =>
            normalizeKategori(
              arsip.kategori
            ) ===
            normalizeKategori(
              kategoriDipilih
            )
        );
      }

      return arsipPegawai.filter(
        (arsip) =>
          kategoriCocok(
            arsip,
            item
          )
      );
    }, [
      kategoriDipilih,
      arsipPegawai,
    ]);

  const semuaArsipTerlihat =
    arsipPegawai;

  /*
   * =========================================================
   * PILIH KATEGORI
   * =========================================================
   */
  const pilihKategori = (
    item: SubKategori
  ) => {
    setKategoriDipilih(
      getKategoriValue(
        item
      )
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * =========================================================
   * BUKA MODAL UPLOAD
   * =========================================================
   */
  const bukaUpload = () => {
    if (!kategoriDipilih) {
      alert(
        "Silakan pilih kategori dokumen terlebih dahulu."
      );
      return;
    }

    const item =
      cariSubKategori(
        kategoriDipilih
      );

    setNamaDokumen(
      item?.nama ||
        kategoriDipilih
    );

    setNomorDokumen("");
    setTanggalDokumen("");

    setTahunDokumen(
      String(
        new Date().getFullYear()
      )
    );

    setKeteranganDokumen("");
    setUploadFile(null);
    setShowUpload(true);
  };

  /*
   * =========================================================
   * UPLOAD
   * =========================================================
   */
  const handleUpload =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      if (!uploadFile) {
        alert(
          "Silakan pilih file."
        );
        return;
      }

      if (!nipDipilih) {
        alert(
          "NIP pegawai belum tersedia."
        );
        return;
      }

      if (!kategoriDipilih) {
        alert(
          "Kategori dokumen belum dipilih."
        );
        return;
      }

      if (
        uploadFile.size >
        10 * 1024 * 1024
      ) {
        alert(
          "Ukuran file maksimal 10 MB."
        );
        return;
      }

      setUploadLoading(
        true
      );

      try {
        const item =
          cariSubKategori(
            kategoriDipilih
          );

        const kategoriSimpan =
          item?.kategoriSimpan ||
          kategoriDipilih;

        const formData =
          new FormData();

        formData.append(
          "file",
          uploadFile
        );

        formData.append(
          "nip",
          nipDipilih
        );

        formData.append(
          "kategori",
          kategoriSimpan
        );

        formData.append(
          "nama_dokumen",
          namaDokumen.trim() ||
            kategoriDipilih
        );

        formData.append(
          "nomor_dokumen",
          nomorDokumen.trim()
        );

        formData.append(
          "tanggal_dokumen",
          tanggalDokumen
        );

        formData.append(
          "tahun",
          tahunDokumen
        );

        formData.append(
          "keterangan",
          keteranganDokumen.trim()
        );

        const response =
          await fetch(
            "/api/arsip-kepegawaian/upload",
            {
              method: "POST",
              body: formData,
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
              "Upload gagal."
          );
        }

        alert(
          "Dokumen berhasil diupload."
        );

        setShowUpload(
          false
        );

        setUploadFile(null);

        /*
         * Refresh arsip.
         */
        const refresh =
          await fetch(
            `/api/arsip-kepegawaian?nip=${encodeURIComponent(
              nipDipilih
            )}`,
            {
              cache: "no-store",
            }
          );

        const refreshResult =
          await refresh.json();

        if (
          refresh.ok &&
          refreshResult.success
        ) {
          setArsipPegawai(
            Array.isArray(
              refreshResult.data
            )
              ? refreshResult.data
              : []
          );
        }
      } catch (error: any) {
        console.error(error);

        alert(
          error?.message ||
            "Terjadi kesalahan saat upload."
        );
      } finally {
        setUploadLoading(
          false
        );
      }
    };

  /*
   * =========================================================
   * HAPUS LOCAL STATE
   * =========================================================
   */
  const handleDeleteLocal = (
    item: Arsip
  ) => {
    setArsipPegawai(
      (prev) =>
        prev.filter(
          (arsip) =>
            arsip.id !==
            item.id
        )
    );
  };

  /*
   * =========================================================
   * PILIH PEGAWAI ADMIN
   * =========================================================
   */
  const pilihPegawai = (
    pegawai: Pegawai
  ) => {
    const nip =
      String(
        pegawai.username ?? ""
      ).trim();

    if (!nip) return;

    setNipDipilih(nip);
    setKategoriDipilih("");

    window.history.replaceState(
      null,
      "",
      `/arsip-kepegawaian?nip=${encodeURIComponent(
        nip
      )}`
    );
  };

  /*
   * =========================================================
   * KEMBALI KE ARSIP SENDIRI
   * =========================================================
   */
  const kembaliKeSaya = () => {
    if (!username) return;

    setNipDipilih(
      username
    );

    setKategoriDipilih("");

    window.history.replaceState(
      null,
      "",
      "/arsip-kepegawaian"
    );
  };

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */
  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4">
        <div className="flex items-center gap-3 text-center text-sm text-slate-600 sm:text-base">
          <Loader2
            size={22}
            className="shrink-0 animate-spin"
          />
          Memuat Arsip Kepegawaian...
        </div>
      </div>
    );
  }

  if (
    status !==
    "authenticated"
  ) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 px-5 py-5 text-center text-sm text-red-700">
          Anda harus login
          terlebih dahulu.
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */
  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-slate-50">
      <div className="mx-auto w-full max-w-[1500px] min-w-0 px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8">

        {/* =====================================================
            HEADER
        ====================================================== */}
        <div className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-4 text-white shadow-lg sm:mb-6 sm:rounded-3xl sm:p-6">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 sm:h-12 sm:w-12 sm:rounded-2xl">
                  <Archive
                    size={24}
                    className="sm:h-[27px] sm:w-[27px]"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className="break-words text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
                    Arsip Kepegawaian
                  </h1>

                  <p className="mt-1 break-words text-xs leading-5 text-blue-100 sm:text-sm">
                    Pengelolaan dokumen
                    dan arsip kepegawaian
                    secara digital.
                  </p>
                </div>
              </div>
            </div>

            <div className="min-w-0 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4 lg:max-w-sm">
              <div className="flex min-w-0 items-center gap-3">
                <CircleUserRound
                  size={23}
                  className="shrink-0"
                />

                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold">
                    {namaPegawaiAktif}
                  </p>

                  <p className="mt-0.5 break-all text-xs text-blue-100">
                    NIP / Username:{" "}
                    {nipDipilih ||
                      "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            ADMIN PEGAWAI
        ====================================================== */}
        {isAdminKepegawaian && (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mb-6 sm:p-5">
            <div className="mb-4 flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Users
                    size={20}
                    className="shrink-0 text-blue-600"
                  />

                  <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                    Pilih Pegawai
                  </h2>
                </div>

                <p className="mt-1 break-words text-xs leading-5 text-slate-500 sm:text-sm">
                  Pengelola Kepegawaian
                  dapat melihat arsip
                  masing-masing pegawai
                  berdasarkan NIP.
                </p>
              </div>

              {nipDipilih !==
                username && (
                <button
                  type="button"
                  onClick={
                    kembaliKeSaya
                  }
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 md:w-auto"
                >
                  <ArrowLeft
                    size={16}
                  />
                  Arsip Saya
                </button>
              )}
            </div>

            <div className="relative mb-4">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={pencarian}
                onChange={(e) =>
                  setPencarian(
                    e.target.value
                  )
                }
                placeholder="Cari nama atau NIP..."
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {loadingPegawai ? (
              <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                <Loader2
                  size={20}
                  className="mr-2 animate-spin"
                />
                Memuat daftar
                pegawai...
              </div>
            ) : (
              <div className="grid max-h-[360px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                {pegawaiTerfilter.map(
                  (pegawai) => {
                    const aktif =
                      pegawai.username ===
                      nipDipilih;

                    return (
                      <button
                        key={
                          pegawai.id
                        }
                        type="button"
                        onClick={() =>
                          pilihPegawai(
                            pegawai
                          )
                        }
                        className={`min-w-0 rounded-xl border p-3 text-left transition ${
                          aktif
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                              aktif
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <User
                              size={18}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-bold leading-5 text-slate-800">
                              {
                                pegawai.nama
                              }
                            </p>

                            <p className="mt-0.5 break-all text-xs text-slate-500">
                              {
                                pegawai.username
                              }
                            </p>

                            {pegawai.role && (
                              <p className="mt-0.5 break-words text-[11px] text-slate-400">
                                {
                                  pegawai.role
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            INFORMASI PEMILIK
        ====================================================== */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mb-6 sm:p-5">
          <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-14 sm:w-14 sm:rounded-2xl">
                <CircleUserRound
                  size={25}
                  className="sm:h-7 sm:w-7"
                />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">
                  {isAdminKepegawaian &&
                  nipDipilih !==
                    username
                    ? "Arsip Pegawai"
                    : "Arsip Saya"}
                </p>

                <h2 className="break-words text-lg font-bold leading-6 text-slate-800 sm:text-xl">
                  {namaPegawaiAktif}
                </h2>

                <p className="mt-1 break-all text-xs text-slate-500 sm:text-sm">
                  NIP / Username:{" "}
                  <span className="font-semibold text-slate-700">
                    {nipDipilih}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <div className="rounded-xl bg-slate-100 px-3 py-2.5 text-center sm:px-4 sm:py-3">
                <p className="text-lg font-bold text-slate-800 sm:text-xl">
                  {
                    semuaArsipTerlihat.length
                  }
                </p>

                <p className="text-[10px] text-slate-500 sm:text-xs">
                  Total Dokumen
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setLoadingArsip(
                    true
                  );

                  fetch(
                    `/api/arsip-kepegawaian?nip=${encodeURIComponent(
                      nipDipilih
                    )}`,
                    {
                      cache:
                        "no-store",
                    }
                  )
                    .then(
                      (res) =>
                        res.json()
                    )
                    .then(
                      (result) => {
                        if (
                          result.success
                        ) {
                          setArsipPegawai(
                            Array.isArray(
                              result.data
                            )
                              ? result.data
                              : []
                          );
                        }
                      }
                    )
                    .catch(
                      console.error
                    )
                    .finally(
                      () =>
                        setLoadingArsip(
                          false
                        )
                    );
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:px-4 sm:py-3 sm:text-sm"
              >
                <RefreshCw
                  size={16}
                  className={
                    loadingArsip
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            PESAN
        ====================================================== */}
        {pesan && (
          <div className="mb-5 flex min-w-0 items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800 sm:mb-6 sm:px-4">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div className="min-w-0 flex-1 break-words">
              {pesan}
            </div>

            <button
              type="button"
              onClick={() =>
                setPesan("")
              }
              className="shrink-0 rounded-lg p-1 hover:bg-amber-100"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* =====================================================
            KATEGORI
        ====================================================== */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mb-6 sm:p-5">
          <div className="mb-5 flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
                Dokumen Saya
              </h2>

              <p className="mt-1 break-words text-xs leading-5 text-slate-500 sm:text-sm">
                Kelola dan simpan
                dokumen kepegawaian
                milik Anda sendiri.
              </p>
            </div>

            {kategoriDipilih && (
              <button
                type="button"
                onClick={() =>
                  setKategoriDipilih(
                    ""
                  )
                }
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 md:w-auto"
              >
                <ArrowLeft
                  size={16}
                />
                Semua Kategori
              </button>
            )}
          </div>

          {/* FILTER GROUP */}
          <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
            <button
              type="button"
              onClick={() =>
                setKategoriUtama(
                  "Semua"
                )
              }
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                kategoriUtama ===
                "Semua"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua
            </button>

            {kategoriUntukTampilan.map(
              (group) => (
                <button
                  key={
                    group.nama
                  }
                  type="button"
                  onClick={() =>
                    setKategoriUtama(
                      group.nama
                    )
                  }
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                    kategoriUtama ===
                    group.nama
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {
                    group.nama
                  }
                </button>
              )
            )}
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kategoriUntukTampilan
              .filter(
                (group) =>
                  kategoriUtama ===
                    "Semua" ||
                  group.nama ===
                    kategoriUtama
              )
              .flatMap(
                (group) =>
                  group.items.map(
                    (item) => ({
                      ...item,
                      groupNama:
                        group.nama,
                    })
                  )
              )
              .map((item) => {
                const jumlah =
                  jumlahKategori(
                    item
                  );

                const aktif =
                  normalizeKategori(
                    kategoriDipilih
                  ) ===
                  normalizeKategori(
                    getKategoriValue(
                      item
                    )
                  );

                return (
                  <KategoriCard
                    key={`${item.groupNama}-${item.nama}`}
                    item={item}
                    jumlah={
                      jumlah
                    }
                    aktif={
                      aktif
                    }
                    onClick={() =>
                      pilihKategori(
                        item
                      )
                    }
                  />
                );
              })}
          </div>
        </div>

        {/* =====================================================
            DETAIL KATEGORI
        ====================================================== */}
        {kategoriDipilih && (
          <div className="mb-8 min-w-0">
            <div className="mb-5 flex min-w-0 flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 sm:text-xs">
                  Kategori Dokumen
                </p>

                <h2 className="mt-1 break-words text-xl font-bold leading-7 text-blue-900 sm:text-2xl">
                  {
                    cariSubKategori(
                      kategoriDipilih
                    )?.nama ||
                    kategoriDipilih
                  }
                </h2>

                <p className="mt-1 break-words text-xs leading-5 text-blue-700 sm:text-sm">
                  {cariSubKategori(
                    kategoriDipilih
                  )?.deskripsi ||
                    "Dokumen kepegawaian milik Anda."}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  bukaUpload
                }
                className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 md:w-auto"
              >
                <Plus size={19} />
                Upload Dokumen
              </button>
            </div>

            {loadingArsip ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-14 text-center shadow-sm">
                <Loader2
                  size={30}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Memuat dokumen...
                </p>
              </div>
            ) : arsipKategoriDipilih.length ===
              0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center sm:px-6 sm:py-14">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <FileArchive
                    size={30}
                  />
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-700 sm:text-lg">
                  Belum ada dokumen
                </h3>

                <p className="mx-auto mt-2 max-w-md break-words text-xs leading-5 text-slate-500 sm:text-sm">
                  Belum terdapat
                  dokumen pada kategori
                  ini. Silakan upload
                  dokumen jika diperlukan.
                </p>

                <button
                  type="button"
                  onClick={
                    bukaUpload
                  }
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 sm:w-auto"
                >
                  <Upload
                    size={18}
                  />
                  Upload Dokumen
                </button>
              </div>
            ) : (
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
                {arsipKategoriDipilih.map(
                  (item) => (
                    <DokumenCard
                      key={
                        item.id
                      }
                      item={
                        item
                      }
                      isAdmin={
                        isAdminKepegawaian
                      }
                      onDelete={
                        handleDeleteLocal
                      }
                    />
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            MODAL UPLOAD
        ====================================================== */}
             {/* =====================================================
            MODAL UPLOAD
        ====================================================== */}
        {showUpload && (
          <div className="fixed inset-0 z-[99999] flex items-start justify-center overflow-y-auto bg-slate-900/60 p-2 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="relative my-2 flex max-h-[96dvh] w-full min-w-0 max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:my-0 sm:max-h-[92dvh] sm:rounded-3xl">

              {/* =================================================
                  HEADER MODAL
              ================================================== */}
              <div className="sticky top-0 z-20 flex min-w-0 shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5">

                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-lg font-bold leading-6 text-slate-800 sm:text-xl">
                    Upload Dokumen
                  </h2>

                  <p className="mt-1 break-words text-xs leading-5 text-slate-500 sm:text-sm">
                    {cariSubKategori(
                      kategoriDipilih
                    )?.nama ||
                      kategoriDipilih}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    !uploadLoading &&
                    setShowUpload(false)
                  }
                  disabled={uploadLoading}
                  aria-label="Tutup"
                  className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={21} />
                </button>
              </div>

              {/* =================================================
                  FORM
              ================================================== */}
              <form
                onSubmit={handleUpload}
                className="min-w-0 overflow-y-auto p-4 sm:p-6"
              >
                <div className="space-y-5">

                  {/* =================================================
                      INFORMASI PEGAWAI
                  ================================================== */}
                  <div className="min-w-0 overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
                    <div className="flex min-w-0 items-start gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                        <User size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-bold leading-5 text-slate-800 sm:text-base">
                          {namaPegawaiAktif}
                        </p>

                        <p className="mt-1 break-all text-xs leading-5 text-slate-500 sm:text-sm">
                          NIP: {nipDipilih}
                        </p>

                        <p className="mt-1 break-words text-[11px] leading-5 text-blue-600 sm:text-xs">
                          Kategori:{" "}
                          <span className="font-semibold">
                            {cariSubKategori(
                              kategoriDipilih
                            )?.nama ||
                              kategoriDipilih}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      FILE DOKUMEN
                  ================================================== */}
                  <div className="min-w-0">

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      File Dokumen{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <label className="flex w-full min-w-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-7 text-center transition hover:border-blue-400 hover:bg-blue-50 sm:px-5 sm:py-8">

                      <Upload
                        size={30}
                        className="shrink-0 text-blue-500"
                      />

                      <span className="mt-3 max-w-full break-all px-2 text-sm font-semibold leading-5 text-slate-700">
                        {uploadFile
                          ? uploadFile.name
                          : "Klik untuk memilih file"}
                      </span>

                      <span className="mt-2 max-w-full break-words px-2 text-xs leading-5 text-slate-500">
                        PDF, JPG, JPEG, PNG, WEBP
                        <br className="sm:hidden" />
                        {" "}— maksimal 10 MB
                      </span>

                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(event) => {
                          const file =
                            event.target.files?.[0] ||
                            null;

                          setUploadFile(file);
                        }}
                        className="hidden"
                      />
                    </label>

                  </div>

                  {/* =================================================
                      NAMA DOKUMEN
                  ================================================== */}
                  <div className="min-w-0">

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Nama Dokumen{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      value={namaDokumen}
                      onChange={(event) =>
                        setNamaDokumen(
                          event.target.value
                        )
                      }
                      placeholder="Contoh: SK Pangkat Terakhir"
                      className="block w-full min-w-0 max-w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      required
                    />

                  </div>

                  {/* =================================================
                      NOMOR DOKUMEN
                  ================================================== */}
                  <div className="min-w-0">

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Nomor Dokumen
                    </label>

                    <input
                      type="text"
                      value={nomorDokumen}
                      onChange={(event) =>
                        setNomorDokumen(
                          event.target.value
                        )
                      }
                      placeholder="Nomor dokumen (jika ada)"
                      className="block w-full min-w-0 max-w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                  </div>

                  {/* =================================================
                      TANGGAL + TAHUN
                  ================================================== */}
                  <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">

                    {/* TANGGAL */}
                    <div className="min-w-0">

                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Tanggal Dokumen
                      </label>

                      <div className="relative min-w-0">

                        <CalendarDays
                          size={18}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          type="date"
                          value={tanggalDokumen}
                          onChange={(event) =>
                            setTanggalDokumen(
                              event.target.value
                            )
                          }
                          className="block w-full min-w-0 max-w-full rounded-xl border border-slate-200 py-3 pl-10 pr-2 text-sm leading-5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:pr-4"
                        />

                      </div>
                    </div>

                    {/* TAHUN */}
                    <div className="min-w-0">

                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Tahun
                      </label>

                      <input
                        type="number"
                        value={tahunDokumen}
                        onChange={(event) =>
                          setTahunDokumen(
                            event.target.value
                          )
                        }
                        placeholder="2026"
                        min="1900"
                        max="2100"
                        className="block w-full min-w-0 max-w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                    </div>
                  </div>

                  {/* =================================================
                      KETERANGAN
                  ================================================== */}
                  <div className="min-w-0">

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Keterangan
                    </label>

                    <textarea
                      value={keteranganDokumen}
                      onChange={(event) =>
                        setKeteranganDokumen(
                          event.target.value
                        )
                      }
                      placeholder="Keterangan tambahan..."
                      rows={4}
                      className="block w-full min-w-0 max-w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                  </div>

                  {/* =================================================
                      TOMBOL
                  ================================================== */}
                  <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                    <button
                      type="button"
                      onClick={() =>
                        !uploadLoading &&
                        setShowUpload(false)
                      }
                      disabled={uploadLoading}
                      className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      Batal
                    </button>

                    <button
                      type="submit"
                      disabled={
                        uploadLoading ||
                        !uploadFile
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      {uploadLoading ? (
                        <>
                          <Loader2
                            size={18}
                            className="animate-spin"
                          />
                          Mengupload...
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          Upload Dokumen
                        </>
                      )}
                    </button>

                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* =====================================================
            FOOTER
        ====================================================== */}
        <div className="mt-8 border-t border-slate-200 pt-6 text-center sm:mt-10">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
            <Archive size={17} />
            SIMASDI
          </div>

          <p className="mt-1 break-words text-xs text-slate-500">
            Sistem Informasi
            Manajemen Arsip Digital
          </p>

          <p className="mt-2 break-words text-[11px] text-slate-400 sm:text-xs">
            © 2026 Balai
            Pemasyarakatan Kelas I
            Jakarta Barat
          </p>

          <p className="mt-1 text-[10px] text-slate-400 sm:text-[11px]">
            SIMASDI Version
            1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}