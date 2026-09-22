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
  CheckCircle2,
  ChevronDown,
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
  KeyRound,
  Landmark,
  Loader2,
  Lock,
  Mail,
  Medal,
  Pencil,
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

  /**
   * Nilai kategori yang disimpan ke database
   * Jika tidak diisi maka menggunakan nama.
   */
  kategoriSimpan?: string;

  /**
   * Kategori lama yang tetap dianggap cocok.
   */
  aliases?: string[];

  /**
   * Arsip lama hanya ditampilkan jika memang ada.
   */
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

/**
 * Pengecekan kategori.
 *
 * Kompatibel dengan:
 * - kategori baru
 * - kategori lama
 * - beberapa kategori legacy yang dahulu dipakai Google Form.
 */
function kategoriCocok(
  arsip: Arsip,
  item: SubKategori
): boolean {
  const kategori = normalizeKategori(
    arsip.kategori
  );

  const namaDokumen = normalizeText(
    arsip.nama_dokumen
  );

  const jenisDokumen = normalizeText(
    arsip.jenis_dokumen
  );

  const namaFile = normalizeText(
    arsip.nama_file
  );

  const namaItem = normalizeKategori(
    item.nama
  );

  const teks = `
    ${namaDokumen}
    ${jenisDokumen}
    ${namaFile}
  `.toLowerCase();

  /*
   * =========================================================
   * 1. PANGKAT
   * =========================================================
   *
   * Arsip lama menggunakan:
   * - SK PANGKAT/GOLONGAN
   * - SK PANGKAT//GOLONGAN
   *
   * Keduanya ditampilkan pada kartu "Pangkat".
   */
if (namaItem === "PANGKAT") {
  if (
    kategori !== "SK PANGKAT/GOLONGAN" &&
    kategori !== "SK PANGKAT//GOLONGAN"
  ) {
    return false;
  }

  // Jangan tampilkan SK PNS / SK CPNS
  // pada kartu Pangkat.
  if (
    teks.includes("sk pangkat pns") ||
    teks.includes("sk pangkat cpns") ||
    teks.includes("pangkat pns") ||
    teks.includes("pangkat cpns")
  ) {
    return false;
  }

  // Hanya pangkat/golongan
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
  /*
   * SK CPNS dapat berasal dari:
   * - kategori SK CPNS
   * - kategori SK
   * - kategori SK PANGKAT/GOLONGAN
   *
   * Yang menentukan adalah isi dokumennya.
   */

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
  /*
   * SK PNS dapat berasal dari:
   * - kategori SK PNS
   * - kategori SK
   * - kategori SK PANGKAT/GOLONGAN
   *
   * Yang menentukan adalah isi dokumennya.
   */

  if (
    kategori === "SK PNS" ||
    kategori === "SK" ||
    kategori === "SK PANGKAT/GOLONGAN"
  ) {
    /*
     * Jangan mengambil dokumen CPNS.
     */
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
   *
   * Cocokkan kategori database dengan:
   * - nama kategori
   * - kategoriSimpan
   * - aliases
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

  /*
   * =========================================================
   * 6. KATEGORI LEGACY TERTENTU
   * =========================================================
   *
   * Jika kategori database "SK", cocokkan berdasarkan
   * nama/jenis/file hanya untuk kategori yang memang
   * sudah ditentukan di atas.
   *
   * Jangan menggunakan pencarian teks secara umum di sini
   * karena dapat membuat dokumen masuk ke kategori yang salah.
   */

  return false;
}
/**
 * Untuk arsip legacy yang tidak punya kategori baru.
 */
function arsipLegacyCocok(
  arsip: Arsip,
  kategoriLegacy: string
) {
  return (
    normalizeKategori(arsip.kategori) ===
    normalizeKategori(kategoriLegacy)
  );
}

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
    deskripsi: "Dokumen pendidikan dan pengembangan kompetensi",
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
        deskripsi: "Sertifikat kemampuan bahasa asing",
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
        deskripsi: "Surat Tanda Tamat Pendidikan dan Pelatihan",
        icon: FileBadge,
        aliases: ["Sertifikat Diklat"],
      },
      {
        nama: "Sertifikat Kursus",
        deskripsi: "Sertifikat kursus atau pelatihan",
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
        deskripsi: "Dokumen pencantuman gelar",
        icon: FileBadge,
      },

      /*
       * Arsip lama.
       * Tidak muncul sebagai kartu jika tidak ada datanya.
       */
    
      {
        nama: "Sertifikat Diklat (Arsip Lama)",
        deskripsi: "Arsip sertifikat diklat lama",
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
        deskripsi: "Kartu istri atau kartu suami",
        icon: Heart,
      },
      {
        nama: "Akte Lahir Anak",
        deskripsi: "Dokumen akta kelahiran anak",
        icon: Users,
        aliases: ["Anak & Istri", "Anak & Istri/Suami"],
      },
    ],
  },

  {
    nama: "Kepegawaian",
    deskripsi: "Dokumen administrasi kepegawaian",
    icon: BriefcaseBusiness,
    items: [
      {
        nama: "SK CPNS",
        deskripsi: "Surat keputusan pengangkatan CPNS",
        icon: FileText,
      },
      {
        nama: "SK PNS",
        deskripsi: "Surat keputusan pengangkatan PNS",
        icon: FileText,
      },
      {
        nama: "Karpeg",
        deskripsi: "Kartu pegawai",
        icon: IdCard,
      },
      {
        nama: "KPE",
        deskripsi: "Kartu Pegawai Elektronik",
        icon: IdCard,
      },
      {
        nama: "Kartu ASN Virtual",
        deskripsi: "Kartu ASN Virtual",
        icon: IdCard,
      },
      {
        nama: "DRH",
        deskripsi: "Daftar Riwayat Hidup",
        icon: FileText,
      },
      {
        nama: "DRP",
        deskripsi: "Daftar Riwayat Pekerjaan",
        icon: FileText,
      },
      {
        nama: "Pangkat",
        deskripsi: "Dokumen administrasi pangkat",
        icon: FileBadge,
      },
      {
        nama: "Ujian Dinas",
        deskripsi: "Dokumen ujian dinas",
        icon: ClipboardCheck,
      },
      {
        nama: "SK PPNPN",
        deskripsi: "Surat keputusan PPNPN",
        icon: FileText,
      },
      {
        nama: "SK PMK",
        deskripsi: "Surat keputusan masa kerja",
        icon: FileText,
      },
      {
        nama: "Pakta Integritas",
        deskripsi: "Dokumen pakta integritas",
        icon: ShieldCheck,
      },
      {
        nama: "Surat Pernyataan Lainnya",
        deskripsi: "Surat pernyataan kepegawaian",
        icon: FileText,
      },

    ],
  },

  {
    nama: "Keuangan",
    deskripsi: "Dokumen administrasi keuangan",
    icon: WalletCards,
    items: [
      {
        nama: "NPWP",
        deskripsi: "Dokumen NPWP",
        icon: WalletCards,
      },
      {
        nama: "Buku Tabungan",
        deskripsi: "Buku rekening atau tabungan",
        icon: WalletCards,
      },
      {
        nama: "LHKPN",
        deskripsi: "Laporan Harta Kekayaan Penyelenggara Negara",
        icon: FileText,
      },
      {
        nama: "LHKAN",
        deskripsi: "Laporan Harta Kekayaan Aparatur Negara",
        icon: FileText,
      },
      {
        nama: "KGB",
        deskripsi: "Kenaikan Gaji Berkala",
        icon: WalletCards,
      },
    ],
  },

  {
    nama: "Jabatan",
    deskripsi: "Dokumen jabatan dan pelaksanaan tugas",
    icon: Landmark,
    items: [
      {
        nama: "SK Jabatan",
        deskripsi: "Surat keputusan kepegawaian",
        icon: FileBadge,
      },
      {
        nama: "SK Pindah Instansi",
        deskripsi: "Surat keputusan pindah instansi",
        icon: FileText,
      },
      {
        nama: "Pelantikan dan Pengambilan Sumpah",
        deskripsi: "Dokumen pelantikan dan sumpah jabatan",
        icon: Landmark,
      },
      {
        nama: "SPP",
        deskripsi: "Surat Perintah Pelaksanaan",
        icon: FileText,
      },
      {
        nama: "SPMT",
        deskripsi: "Surat Pernyataan Melaksanakan Tugas",
        icon: FileText,
      },
      {
        nama: "SPMJ",
        deskripsi: "Surat Pernyataan Melaksanakan Jabatan",
        icon: FileText,
      },
      {
        nama: "SPMMJ",
        deskripsi: "Surat Pernyataan Melaksanakan Masa Jabatan",
        icon: FileText,
      },
      {
        nama: "Uji Kompetensi",
        deskripsi: "Dokumen uji kompetensi",
        icon: ClipboardCheck,
      },
      {
        nama: "Ujian Dinas",
        deskripsi: "Dokumen ujian dinas",
        icon: ClipboardCheck,
      },
    ],
  },

  {
    nama: "Penilaian",
    deskripsi: "Dokumen penilaian dan penghargaan",
    icon: Medal,
    items: [
      {
        nama: "SKP",
        deskripsi: "Sasaran Kinerja Pegawai",
        icon: ClipboardCheck,
      },
      {
        nama: "PAK",
        deskripsi: "Penetapan Angka Kredit",
        icon: ClipboardCheck,
      },
      {
        nama: "Penghargaan",
        deskripsi: "Dokumen penghargaan pegawai",
        icon: Medal,
      },
      {
        nama: "Bebas Hukdis",
        deskripsi: "Surat bebas hukuman disiplin",
        icon: ShieldCheck,
      },
      {
        nama: "Hukdis",
        deskripsi: "Dokumen hukuman disiplin",
        icon: FileText,
      },
    ],
  },

  {
    nama: "Persiapan Pensiun",
    deskripsi: "Dokumen persiapan dan administrasi pensiun",
    icon: Landmark,
    items: [
      {
        nama: "Taspen",
        deskripsi: "Dokumen Taspen",
        icon: FileBadge,
      },
      {
        nama: "DPCP",
        deskripsi: "Data Perorangan Calon Penerima Pensiun",
        icon: FileText,
      },
      {
        nama: "SK Pensiun",
        deskripsi: "Surat keputusan pensiun",
        icon: FileBadge,
      },
    ],
  },
];

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

/**
 * Card dokumen.
 * Dibuat sederhana supaya URL Supabase tidak pernah tampil di layar.
 */
function DokumenCard({
  item,
  isAdmin,
  onDelete,
}: {
  item: Arsip;
  isAdmin: boolean;
  onDelete: (item: Arsip) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const namaDokumen =
    item.nama_dokumen ||
    item.jenis_dokumen ||
    "Dokumen";

  const namaFile =
    item.nama_file || "File tidak diketahui";

  const lihat = () => {
    if (!item.file_url) {
      alert("File belum tersedia atau URL file gagal dibuat.");
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
        // browser tertentu tidak mengizinkan print otomatis
      }
    }, 1500);
  };

  const download = () => {
    if (!item.file_url) {
      alert("File belum tersedia.");
      return;
    }

    const link = document.createElement("a");

    link.href = item.file_url;
    link.download =
      item.nama_file || "dokumen-arsip";

    link.target = "_blank";
    link.rel = "noopener noreferrer";

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
      const response = await fetch(
        `/api/arsip-kepegawaian?id=${encodeURIComponent(
          item.id
        )}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
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
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <FileText size={24} />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-base font-bold text-slate-800">
            {namaDokumen}
          </h4>

          <p className="mt-1 break-all text-sm text-slate-500">
            File: {namaFile}
          </p>

          {item.nomor_dokumen && (
            <p className="mt-1 text-xs text-slate-400">
              Nomor: {item.nomor_dokumen}
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

      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={lihat}
          disabled={!item.file_url}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Eye size={16} />
          Lihat
        </button>

        <button
          type="button"
          onClick={print}
          disabled={!item.file_url}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Printer size={16} />
          Print
        </button>

        <button
          type="button"
          onClick={download}
          disabled={!item.file_url}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={16} />
          Download
        </button>

      {true && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Trash2 size={16} />
            )}

            Hapus
          </button>
        )}
      </div>
    </div>
  );
}

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
      className={`group w-full rounded-2xl border p-5 text-left transition ${
        aktif
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            aktif
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700"
          }`}
        >
          <Icon size={23} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-bold leading-5 text-slate-800">
              {item.nama}
            </h3>

            <ChevronRight
              size={18}
              className={`shrink-0 ${
                aktif
                  ? "text-blue-600"
                  : "text-slate-400"
              }`}
            />
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {item.deskripsi}
          </p>

          {jumlah > 0 && (
            <div className="mt-3">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                {jumlah} dokumen
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export default function ArsipKepegawaianPage() {
  const { data: session, status } =
    useSession();

  const [nipDipilih, setNipDipilih] =
    useState("");

  const [nama, setNama] = useState("");
  const [username, setUsername] =
    useState("");
  const [role, setRole] = useState("");

  const [daftarPegawai, setDaftarPegawai] =
    useState<Pegawai[]>([]);

  const [pencarian, setPencarian] =
    useState("");

  const [loadingPegawai, setLoadingPegawai] =
    useState(false);

  const [arsipPegawai, setArsipPegawai] =
    useState<Arsip[]>([]);
    const [hapusId, setHapusId] = useState<string | null>(null);

  const [loadingArsip, setLoadingArsip] =
    useState(false);

  const [kategoriUtama, setKategoriUtama] =
    useState("Semua");

  const [kategoriDipilih, setKategoriDipilih] =
    useState("");

  const [showUpload, setShowUpload] =
    useState(false);

  const [uploadFile, setUploadFile] =
    useState<File | null>(null);

  const [namaDokumen, setNamaDokumen] =
    useState("");

  const [nomorDokumen, setNomorDokumen] =
    useState("");

  const [tanggalDokumen, setTanggalDokumen] =
    useState("");

  const [tahunDokumen, setTahunDokumen] =
    useState(
      String(new Date().getFullYear())
    );

  const [keteranganDokumen, setKeteranganDokumen] =
    useState("");

  const [uploadLoading, setUploadLoading] =
    useState(false);

  const [pesan, setPesan] =
    useState("");

  const roleNormal =
    role.trim().toLowerCase();

  const isAdminKepegawaian =
    ROLE_ADMIN_KEPEGAWAIAN.includes(
      roleNormal
    );

  /*
   * Ambil data session.
   */
  useEffect(() => {
    if (!session?.user) return;

    const user = session.user as any;

    const sessionNama = String(
      user.nama ??
        user.name ??
        ""
    ).trim();

    const sessionUsername = String(
      user.username ?? ""
    ).trim();

    const sessionRole = String(
      user.role ?? ""
    ).trim();

    setNama(sessionNama);
    setUsername(sessionUsername);
    setRole(sessionRole);

    /*
     * Untuk pegawai biasa langsung menggunakan
     * username/NIP miliknya.
     */
    if (
      !ROLE_ADMIN_KEPEGAWAIAN.includes(
        sessionRole.toLowerCase()
      )
    ) {
      setNipDipilih(sessionUsername);
    }

    /*
     * Admin: baca ?nip=...
     */
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
          params.get("nip")?.trim() || "";

        if (nipURL) {
          setNipDipilih(nipURL);
        } else {
          setNipDipilih(sessionUsername);
        }
      } catch {
        setNipDipilih(sessionUsername);
      }
    }
  }, [session]);

  /*
   * Ambil daftar pegawai untuk Admin Kepegawaian.
   */
  useEffect(() => {
    if (
      status !== "authenticated" ||
      !isAdminKepegawaian
    ) {
      return;
    }

    let aktif = true;

    const loadPegawai = async () => {
      setLoadingPegawai(true);

      try {
        const response = await fetch(
          "/api/arsip-kepegawaian?mode=pegawai",
          {
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Gagal mengambil daftar pegawai."
          );
        }

        if (aktif) {
          const data =
            Array.isArray(result.data)
              ? result.data
              : [];

          setDaftarPegawai(data);
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
          setLoadingPegawai(false);
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
   * Ambil arsip berdasarkan NIP aktif.
   */
  useEffect(() => {
    if (
      status !== "authenticated" ||
      !nipDipilih
    ) {
      return;
    }

    let aktif = true;

    const loadArsip = async () => {
      setLoadingArsip(true);
      setPesan("");

      try {
        const response = await fetch(
          `/api/arsip-kepegawaian?nip=${encodeURIComponent(
            nipDipilih
          )}`,
          {
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Gagal mengambil arsip."
          );
        }

        if (aktif) {
          setArsipPegawai(
            Array.isArray(result.data)
              ? result.data
              : []
          );
        }
      } catch (error: any) {
        console.error(error);

        if (aktif) {
          setArsipPegawai([]);
          setPesan(
            error?.message ||
              "Gagal mengambil arsip kepegawaian."
          );
        }
      } finally {
        if (aktif) {
          setLoadingArsip(false);
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
   * Pegawai yang sedang dipilih.
   */
  const pegawaiAktif = useMemo(() => {
    return daftarPegawai.find(
      (item) =>
        String(item.username).trim() ===
        String(nipDipilih).trim()
    );
  }, [
    daftarPegawai,
    nipDipilih,
  ]);

  const namaPegawaiAktif =
    pegawaiAktif?.nama ||
    (nipDipilih === username
      ? nama
      : "") ||
    nipDipilih;

  /*
   * Filter pegawai untuk admin.
   */
  const pegawaiTerfilter = useMemo(() => {
    const kata =
      pencarian.trim().toLowerCase();

    if (!kata) {
      return daftarPegawai;
    }

    return daftarPegawai.filter(
      (item) => {
        return (
          String(item.nama ?? "")
            .toLowerCase()
            .includes(kata) ||
          String(item.username ?? "")
            .toLowerCase()
            .includes(kata) ||
          String(item.role ?? "")
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
   * Menentukan apakah suatu kategori punya dokumen.
   */
  const jumlahKategori = (
    item: SubKategori
  ) => {
    return arsipPegawai.filter((arsip) =>
      kategoriCocok(arsip, item)
    ).length;
  };

  /*
   * Hanya tampilkan kategori legacy jika
   * memang ada arsipnya.
   */
  const kategoriUntukTampilan =
    kategoriArsip.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          !item.legacyOnly ||
          jumlahKategori(item) > 0
      ),
    }));

  /*
   * Arsip untuk kategori yang dipilih.
   */
  const arsipKategoriDipilih =
    useMemo(() => {
      if (!kategoriDipilih) {
        return [];
      }

      const item = cariSubKategori(
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
          kategoriCocok(arsip, item)
      );
    }, [
      kategoriDipilih,
      arsipPegawai,
    ]);

  const semuaArsipTerlihat =
    arsipPegawai;

  /*
   * Saat klik kategori.
   */
  const pilihKategori = (
    item: SubKategori
  ) => {
    setKategoriDipilih(
      getKategoriValue(item)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * Upload dibuka dari kategori yang dipilih.
   */
  const bukaUpload = () => {
    if (!kategoriDipilih) {
      alert(
        "Silakan pilih kategori dokumen terlebih dahulu."
      );
      return;
    }

    const item = cariSubKategori(
      kategoriDipilih
    );

    setNamaDokumen(
      item?.nama ||
        kategoriDipilih
    );

    setNomorDokumen("");
    setTanggalDokumen("");
    setTahunDokumen(
      String(new Date().getFullYear())
    );
    setKeteranganDokumen("");
    setUploadFile(null);
    setShowUpload(true);
  };

  /*
   * Upload dokumen.
   */
  const handleUpload = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!uploadFile) {
      alert("Silakan pilih file.");
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

    if (uploadFile.size > 10 * 1024 * 1024) {
      alert(
        "Ukuran file maksimal 10 MB."
      );
      return;
    }

    setUploadLoading(true);

    try {
      const item = cariSubKategori(
        kategoriDipilih
      );

      /*
       * Untuk kategori lama tertentu,
       * gunakan kategori database yang sudah ada.
       */
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

      const response = await fetch(
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

      setShowUpload(false);
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
      setUploadLoading(false);
    }
  };

  /*
   * Hapus item dari state setelah API sukses.
   */
  const handleDeleteLocal = (
    item: Arsip
  ) => {
    setArsipPegawai((prev) =>
      prev.filter(
        (arsip) =>
          arsip.id !== item.id
      )
    );
  };

  /*
   * Pilih pegawai admin.
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
   * Kembali ke arsip sendiri.
   */
  const kembaliKeSaya = () => {
    if (!username) return;

    setNipDipilih(username);
    setKategoriDipilih("");

    window.history.replaceState(
      null,
      "",
      "/arsip-kepegawaian"
    );
  };

  /*
   * Loading login.
   */
  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2
            size={22}
            className="animate-spin"
          />
          Memuat Arsip Kepegawaian...
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-center text-red-700">
          Anda harus login terlebih dahulu.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-6 lg:px-8">

        {/* =====================================================
            HEADER
        ====================================================== */}
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Archive size={27} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold md:text-3xl">
                    Arsip Kepegawaian
                  </h1>

                  <p className="mt-1 text-sm text-blue-100">
                    Pengelolaan dokumen dan arsip kepegawaian secara digital.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <CircleUserRound
                  size={24}
                />

                <div>
                  <p className="text-sm font-semibold">
                    {namaPegawaiAktif}
                  </p>

                  <p className="text-xs text-blue-100">
                    NIP / Username:{" "}
                    {nipDipilih || "-"}
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
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Users
                    size={20}
                    className="text-blue-600"
                  />

                  <h2 className="font-bold text-slate-800">
                    Pilih Pegawai
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Pengelola Kepegawaian dapat melihat arsip masing-masing pegawai berdasarkan NIP.
                </p>
              </div>

              {nipDipilih !== username && (
                <button
                  type="button"
                  onClick={kembaliKeSaya}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                >
                  <ArrowLeft size={16} />
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {loadingPegawai ? (
              <div className="flex items-center justify-center py-8 text-slate-500">
                <Loader2
                  size={20}
                  className="mr-2 animate-spin"
                />
                Memuat daftar pegawai...
              </div>
            ) : (
              <div className="grid max-h-[360px] grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2 lg:grid-cols-3">
                {pegawaiTerfilter.map(
                  (pegawai) => {
                    const aktif =
                      pegawai.username ===
                      nipDipilih;

                    return (
                      <button
                        key={pegawai.id}
                        type="button"
                        onClick={() =>
                          pilihPegawai(
                            pegawai
                          )
                        }
                        className={`rounded-xl border p-3 text-left transition ${
                          aktif
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
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

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-800">
                              {
                                pegawai.nama
                              }
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {
                                pegawai.username
                              }
                            </p>

                            {pegawai.role && (
                              <p className="truncate text-[11px] text-slate-400">
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
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <CircleUserRound
                  size={28}
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {isAdminKepegawaian &&
                  nipDipilih !== username
                    ? "Arsip Pegawai"
                    : "Arsip Saya"}
                </p>

                <h2 className="text-xl font-bold text-slate-800">
                  {namaPegawaiAktif}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  NIP / Username:{" "}
                  <span className="font-semibold text-slate-700">
                    {nipDipilih}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="rounded-xl bg-slate-100 px-4 py-3 text-center">
                <p className="text-xl font-bold text-slate-800">
                  {
                    semuaArsipTerlihat.length
                  }
                </p>

                <p className="text-xs text-slate-500">
                  Total Dokumen
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setLoadingArsip(true);

                  fetch(
                    `/api/arsip-kepegawaian?nip=${encodeURIComponent(
                      nipDipilih
                    )}`,
                    {
                      cache: "no-store",
                    }
                  )
                    .then((res) =>
                      res.json()
                    )
                    .then((result) => {
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
                    })
                    .catch(
                      console.error
                    )
                    .finally(() =>
                      setLoadingArsip(
                        false
                      )
                    );
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <RefreshCw
                  size={17}
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
            PESAN ERROR
        ====================================================== */}
        {pesan && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              {pesan}
            </div>

            <button
              type="button"
              onClick={() =>
                setPesan("")
              }
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* =====================================================
            KATEGORI
        ====================================================== */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Dokumen Saya
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Kelola dan simpan dokumen kepegawaian milik Anda sendiri.
              </p>
            </div>

            {kategoriDipilih && (
              <button
                type="button"
                onClick={() =>
                  setKategoriDipilih("")
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Semua Kategori
              </button>
            )}
          </div>

          {/* FILTER GROUP */}
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setKategoriUtama(
                  "Semua"
                )
              }
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
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
                  key={group.nama}
                  type="button"
                  onClick={() =>
                    setKategoriUtama(
                      group.nama
                    )
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    kategoriUtama ===
                    group.nama
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {group.nama}
                </button>
              )
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kategoriUntukTampilan
              .filter(
                (group) =>
                  kategoriUtama ===
                    "Semua" ||
                  group.nama ===
                    kategoriUtama
              )
              .flatMap((group) =>
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
                    jumlah={jumlah}
                    aktif={aktif}
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
          <div className="mb-8">
            <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                  Kategori Dokumen
                </p>

                <h2 className="mt-1 text-2xl font-bold text-blue-900">
                  {
                    cariSubKategori(
                      kategoriDipilih
                    )?.nama ||
                    kategoriDipilih
                  }
                </h2>

                <p className="mt-1 text-sm text-blue-700">
                  {cariSubKategori(
                    kategoriDipilih
                  )?.deskripsi ||
                    "Dokumen kepegawaian milik Anda."}
                </p>
              </div>

              <button
                type="button"
                onClick={bukaUpload}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
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
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <FileArchive
                    size={30}
                  />
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-700">
                  Belum ada dokumen
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Belum terdapat dokumen pada kategori ini. Silakan upload dokumen jika diperlukan.
                </p>

                <button
                  type="button"
                  onClick={bukaUpload}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
                >
                  <Upload
                    size={18}
                  />
                  Upload Dokumen
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {arsipKategoriDipilih.map(
                  (item) => (
                    <DokumenCard
                      key={item.id}
                      item={item}
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
        {showUpload && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Upload Dokumen
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      cariSubKategori(
                        kategoriDipilih
                      )?.nama ||
                      kategoriDipilih
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    !uploadLoading &&
                    setShowUpload(
                      false
                    )
                  }
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={21} />
                </button>
              </div>

              <form
                onSubmit={
                  handleUpload
                }
                className="space-y-5 p-6"
              >
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <CircleUserRound
                      size={20}
                      className="mt-0.5 text-blue-600"
                    />

                    <div>
                      <p className="text-sm font-bold text-blue-900">
                        {namaPegawaiAktif}
                      </p>

                      <p className="mt-1 text-xs text-blue-700">
                        NIP: {nipDipilih}
                      </p>
                    </div>
                  </div>
                </div>

                {/* FILE */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    File Dokumen{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50">
                    <Upload
                      size={30}
                      className="text-blue-600"
                    />

                    <span className="mt-3 text-sm font-semibold text-slate-700">
                      {uploadFile
                        ? uploadFile.name
                        : "Klik untuk memilih file"}
                    </span>

                    <span className="mt-1 text-xs text-slate-500">
                      PDF, JPG, JPEG, PNG, WEBP — maksimal 10 MB
                    </span>

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => {
                        const file =
                          e.target.files?.[0] ||
                          null;

                        setUploadFile(
                          file
                        );
                      }}
                    />
                  </label>
                </div>

                {/* NAMA DOKUMEN */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nama Dokumen{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      namaDokumen
                    }
                    onChange={(e) =>
                      setNamaDokumen(
                        e.target.value
                      )
                    }
                    placeholder="Contoh: SK Pangkat III/c"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* NOMOR */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nomor Dokumen
                  </label>

                  <input
                    type="text"
                    value={
                      nomorDokumen
                    }
                    onChange={(e) =>
                      setNomorDokumen(
                        e.target.value
                      )
                    }
                    placeholder="Nomor SK / dokumen"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* TANGGAL */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Tanggal Dokumen
                    </label>

                    <div className="relative">
                      <CalendarDays
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="date"
                        value={
                          tanggalDokumen
                        }
                        onChange={(e) =>
                          setTanggalDokumen(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {/* TAHUN */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Tahun
                    </label>

                    <input
                      type="number"
                      min="1900"
                      max="2100"
                      value={
                        tahunDokumen
                      }
                      onChange={(e) =>
                        setTahunDokumen(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* KETERANGAN */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Keterangan
                  </label>

                  <textarea
                    value={
                      keteranganDokumen
                    }
                    onChange={(e) =>
                      setKeteranganDokumen(
                        e.target.value
                      )
                    }
                    rows={4}
                    placeholder="Keterangan tambahan..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* BUTTON */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={
                      uploadLoading
                    }
                    onClick={() =>
                      setShowUpload(
                        false
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={
                      uploadLoading ||
                      !uploadFile
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                        <Upload
                          size={18}
                        />
                        Upload Dokumen
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================
            FOOTER
        ====================================================== */}
        <div className="mt-10 border-t border-slate-200 pt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
            <Archive size={17} />
            SIMASDI
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Sistem Informasi Manajemen Arsip Digital
          </p>

          <p className="mt-2 text-xs text-slate-400">
            © 2026 Balai Pemasyarakatan Kelas I Jakarta Barat
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            SIMASDI Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}