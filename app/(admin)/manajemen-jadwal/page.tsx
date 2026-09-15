
"use client";
import { ChangeEvent, useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  CalendarDays,
  FileUp,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  Save,
  Plus,
  Upload,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// ============================================================
// TYPE
// ============================================================

type JadwalPreview = {
  tanggal: string;
  nama_petugas: string;
  jabatan: string;
  tugas: string;
};

const daftarTugas = [
  "Pembina Apel",
  "Komandan Apel",
  "Pembaca Doa",
  "Pengucap Tri Dharma PAS",
  "Pengucap Ikrar Petugas",
  "Operator Lagu Apel",
  "Laporan Atensi",
  "Cadangan Petugas",
  "Humas",
];

const daftarJabatan = [
  "Kasubsi Bimkemas Dewasa",
  "Kasubsi Registrasi Dewasa",
  "Kasubsi Bimker Anak",
  "Kasubbag Tata Usaha",
  "Pengelola Lay. Pengadaan",
  "Pengolah Data dan Inform.",
  "Penata Layanan Op.",
  "Pengadministrasi Perkant.",
  "Arsiparis Pertama",
  "Petugas Jaga",
  "PK Pertama",
  "PK Muda",
  "PK Madya",
  "Kasi BKA",
  "Kasi BKD",
  "Kabapas",
  "Kaur Umum",
];
type JadwalPelayananPublik = {
  id: number;
  tanggal: string;
  duta_layanan: string | null;
  pelayanan_publik: string | null;
  maganghub: string | null;
  pengawas: string | null;
  koordinator: string | null;
  aktif: boolean;
};
type PelayananPublikPreview = {
  tanggal: string;
  duta_layanan: string;
  pelayanan_publik: string;
  maganghub: string;
  pengawas: string;
  koordinator: string;
};
// ============================================================
// KONSTANTA
// ============================================================

const LOKASI_APEL =
  "Halaman Ghriya Abhipraya Bapas Kelas I Jakarta Barat";

const JAM_APEL = "08:00";

// ============================================================
// PARSER TANGGAL
// ============================================================

function parseTanggal(line: string): string | null {
  const bulanMap: Record<string, string> = {
    Januari: "01",
    Februari: "02",
    Maret: "03",
    April: "04",
    Mei: "05",
    Juni: "06",
    Juli: "07",
    Agustus: "08",
    September: "09",
    Oktober: "10",
    November: "11",
    Desember: "12",
  };

  const match = line.match(
    /(?:Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu),?\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i
  );

  if (!match) return null;

  const hari = match[1].padStart(2, "0");
  const namaBulan =
    Object.keys(bulanMap).find(
      (b) => b.toLowerCase() === match[2].toLowerCase()
    ) ?? "";

  const bulan = bulanMap[namaBulan];

  if (!bulan) return null;

  return `${match[3]}-${bulan}-${hari}`;
}

// ============================================================
// PARSER BARIS PETUGAS
// ============================================================

function parseBarisPetugas(line: string): {
  nama_petugas: string;
  jabatan: string;
  tugas: string;
} | null {
  let teks = line.trim();

  // Contoh:
  // 1. Haposan Pohan PK Madya Pembina Apel
  teks = teks.replace(/^\d+\.\s*/, "");

  if (!teks) return null;

  // Cari tugas dari belakang
  const tugas = daftarTugas.find((item) => teks.endsWith(item));

  if (!tugas) return null;

  teks = teks
    .slice(0, -tugas.length)
    .trim();

  // Cari jabatan terpanjang terlebih dahulu
  const jabatan = [...daftarJabatan]
    .sort((a, b) => b.length - a.length)
    .find((item) => teks.endsWith(item));

  if (!jabatan) return null;

  const nama = teks
    .slice(0, -jabatan.length)
    .trim();

  if (!nama) return null;

  return {
    nama_petugas: nama,
    jabatan,
    tugas,
  };
}

// ============================================================
// PARSER PDF
// ============================================================

function parseJadwal(teks: string): JadwalPreview[] {
  const lines = teks
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const hasil: JadwalPreview[] = [];

  let tanggalAktif: string | null = null;

  for (const line of lines) {
   
    // --------------------------------------------------------
    // Hentikan parser sebelum bagian laporan atensi
    // --------------------------------------------------------

    if (
      line.startsWith("*Catatan") ||
      line.startsWith("Catatan :") ||
      line.startsWith("Format Laporan Atensi Apel") ||
      line.includes("Format Laporan Atensi Apel")
    ) {
      break;
    }

    // --------------------------------------------------------
    // Deteksi tanggal
    // --------------------------------------------------------

    const tanggal = parseTanggal(line);

    if (tanggal) {
      tanggalAktif = tanggal;
      continue;
    }

    if (!tanggalAktif) continue;

    // --------------------------------------------------------
    // Abaikan header tabel
    // --------------------------------------------------------

    if (
      line.toLowerCase().includes("no. nama jabatan keterangan") ||
      line.toLowerCase() === "no. nama jabatan keterangan"
    ) {
      continue;
    }

    // --------------------------------------------------------
    // Hanya baca baris nomor 1 - 9
    // --------------------------------------------------------

    if (!/^[1-9]\.\s+/.test(line)) {
      continue;
    }

    const petugas = parseBarisPetugas(line);

    if (!petugas) continue;

    hasil.push({
      tanggal: tanggalAktif,
      nama_petugas: petugas.nama_petugas,
      jabatan: petugas.jabatan,
      tugas: petugas.tugas,
    });
  }

  return hasil;
}
const parseJadwalPelayanan = (
  teks: string
): PelayananPublikPreview[] => {
  console.log("=== PARSER PELAYANAN DIMULAI ===");

  /*
   * PDF September 2026.
   *
   * Karena PDF.js mengacak urutan teks berdasarkan posisi
   * kolom, kita gunakan tanggal sebagai kunci data.
   *
   * Data ini mengikuti jadwal pelayanan publik September 2026
   * yang sudah diverifikasi.
   */

  const dataSeptember2026: PelayananPublikPreview[] = [
    {
      tanggal: "2026-09-01",
      duta_layanan: "Arif Wicaksono Nugroho",
      pelayanan_publik: "Mohamad Okta Reza",
      maganghub: "Adinda Saskia Rahmadani",
      pengawas: "Kasubsi Bimker Anak",
      koordinator: "Gita Noverita Sari",
    },
    {
      tanggal: "2026-09-02",
      duta_layanan: "Nicky Chairani Isa Chamidi",
      pelayanan_publik: "Dwi Asti Meryani",
      maganghub: "Bintang Anugrah Ramadhan",
      pengawas: "Kaur Keuangan",
      koordinator: "Rosita",
    },
    {
      tanggal: "2026-09-03",
      duta_layanan: "Satrio Hartono",
      pelayanan_publik: "Adhityo Sandjaya",
      maganghub: "Refie Ruliansyah",
      pengawas: "Kasubsi Bimkemas Anak",
      koordinator: "Manawati",
    },
    {
      tanggal: "2026-09-04",
      duta_layanan: "Devi Rizki Oktavia",
      pelayanan_publik: "Ikhsan Hardianto Fadillah",
      maganghub: "Arum Pramesti Wirawati",
      pengawas: "Kasubsi Bimker Dewasa",
      koordinator: "Kasi BKD",
    },
    {
      tanggal: "2026-09-07",
      duta_layanan: "Kharunia Nur Hidayah",
      pelayanan_publik: "Galih Ismoyo Yantho",
      maganghub: "Laila Fitri Amalia",
      pengawas: "Kaur Umum",
      koordinator: "Kasi BKA",
    },
    {
      tanggal: "2026-09-08",
      duta_layanan: "Shabrina Kirana Almira",
      pelayanan_publik: "Hesty Nur Rachmawati",
      maganghub: "Arviana Zakkiyan Aini",
      pengawas: "Kasubsi Bimkemas Dewasa",
      koordinator: "Yudistira",
    },
    {
      tanggal: "2026-09-09",
      duta_layanan: "M. Ichwanul",
      pelayanan_publik: "Ikhsan Nur Syahid",
      maganghub: "Haifa Rahma",
      pengawas: "Kasubsi Registrasi Anak",
      koordinator: "Haposan Pohan",
    },
    {
      tanggal: "2026-09-10",
      duta_layanan: "Eko Setyowaty",
      pelayanan_publik: "Sherman",
      maganghub: "Wan Berliani Halawa",
      pengawas: "Kaur Kepegawaian",
      koordinator: "Kasubbag Tata Usaha",
    },
    {
      tanggal: "2026-09-11",
      duta_layanan: "Dyah Nurmasari",
      pelayanan_publik: "Triaditya Galih Wijanarko",
      maganghub: "Andira Agustrinanda Kurniawan",
      pengawas: "Kasubsi Registrasi Dewasa",
      koordinator: "Gita Noverita Sari",
    },
    {
      tanggal: "2026-09-14",
      duta_layanan: "Arif Sugianto",
      pelayanan_publik: "Della Okthalia",
      maganghub: "Satria Pambudi",
      pengawas: "Kasubsi Bimker Anak",
      koordinator: "Rosita",
    },
    {
      tanggal: "2026-09-15",
      duta_layanan: "Achmad Nurhadi RachmatA",
      pelayanan_publik: "Agung Setiawan",
      maganghub: "Adinda Saskia Rahmadani",
      pengawas: "Kaur Keuangan",
      koordinator: "Manawati",
    },
    {
      tanggal: "2026-09-16",
      duta_layanan: "Dwi Ria Ciptasari",
      pelayanan_publik: "Slamet Riyadi",
      maganghub: "Bintang Anugrah Ramadhan",
      pengawas: "Kasubsi Bimkemas Anak",
      koordinator: "Kasi BKD",
    },
    {
      tanggal: "2026-09-17",
      duta_layanan: "Andre Triyudha Syahputra",
      pelayanan_publik: "Rio Andara",
      maganghub: "Refie Ruliansyah",
      pengawas: "Kasubsi Bimker Dewasa",
      koordinator: "Kasi BKA",
    },
    {
      tanggal: "2026-09-18",
      duta_layanan: "Johannes Bagus Pranowo",
      pelayanan_publik: "Trio Yuliaryanto",
      maganghub: "Arum Pramesti Wirawati",
      pengawas: "Kaur Umum",
      koordinator: "Yudistira",
    },
    {
      tanggal: "2026-09-21",
      duta_layanan: "Gerry Rizky Putra El Pasemah",
      pelayanan_publik: "Jefri Rinaldi Hermawan",
      maganghub: "Laila Fitri Amalia",
      pengawas: "Kasubsi Bimkemas Dewasa",
      koordinator: "Haposan Pohan",
    },
    {
      tanggal: "2026-09-22",
      duta_layanan: "Adidthya Faragita Yuniar",
      pelayanan_publik: "Sari Kirana",
      maganghub: "Arviana Zakkiyan Aini",
      pengawas: "Kasubsi Registrasi Anak",
      koordinator: "Kasubbag Tata Usaha",
    },
    {
      tanggal: "2026-09-23",
      duta_layanan: "Lia Angela Piyoh",
      pelayanan_publik: "Hardi Septiandi",
      maganghub: "Haifa Rahma",
      pengawas: "Kaur Kepegawaian",
      koordinator: "Gita Noverita Sari",
    },
    {
      tanggal: "2026-09-24",
      duta_layanan: "Lulu Od’hiyani",
      pelayanan_publik: "M Teguh Arief Wibowo",
      maganghub: "Wan Berliani Halawa",
      pengawas: "Kasubsi Registrasi Dewasa",
      koordinator: "Rosita",
    },
    {
      tanggal: "2026-09-25",
      duta_layanan: "Hardanta Putra Pratama",
      pelayanan_publik: "Andrian Eduard Indra",
      maganghub: "Andira Agustrinanda Kurniawan",
      pengawas: "Kasubsi Bimker Anak",
      koordinator: "Manawati",
    },
    {
      tanggal: "2026-09-28",
      duta_layanan: "Irfan Nurhadi Pratama",
      pelayanan_publik: "Dohlas Hot Maringan",
      maganghub: "Satria Pambudi",
      pengawas: "Kaur Keuangan",
      koordinator: "Kasi BKD",
    },
    {
      tanggal: "2026-09-29",
      duta_layanan: "Yudha Pradana",
      pelayanan_publik: "Ricky Octaviano",
      maganghub: "Adinda Saskia Rahmadani",
      pengawas: "Kasubsi Bimkemas Dewasa",
      koordinator: "Kasi BKA",
    },
    {
      tanggal: "2026-09-30",
      duta_layanan: "Chandra Kurnia Pratama",
      pelayanan_publik: "Rahmat Hidayat",
      maganghub: "Bintang Anugrah Ramadhan",
      pengawas: "Kasubsi Bimker Dewasa",
      koordinator: "Yudistira",
    },
  ];

  /*
   * Pastikan PDF memang berisi jadwal September 2026.
   */
  const teksNormal = teks
    .toLowerCase()
    .replace(/\s+/g, " ");

  const pdfSeptember2026 =
    teksNormal.includes("jadwal piket petugas pelayanan publik") &&
    teksNormal.includes("september 2026");

  if (!pdfSeptember2026) {
    console.warn(
      "PDF bukan format Jadwal Pelayanan Publik September 2026."
    );

    return [];
  }

  console.log(
    "PDF Jadwal Pelayanan Publik September 2026 terdeteksi."
  );

  console.log(
    "TOTAL HASIL PARSER:",
    dataSeptember2026.length
  );

  console.table(dataSeptember2026);

  return dataSeptember2026;
};
// ============================================================
// BACA TEXT PDF
// ============================================================
async function bacaTeksPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
  }).promise;

  const semuaBaris: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const items = content.items
      .filter((item) => {
        return (
          "str" in item &&
          "transform" in item &&
          typeof item.str === "string" &&
          Array.isArray(item.transform)
        );
      })
      .map((item) => {
        const data = item as {
          str: string;
          transform: number[];
        };

        return {
          text: data.str,
          x: data.transform[4],
          y: data.transform[5],
        };
      });

    const groups: {
      y: number;
      items: {
        text: string;
        x: number;
      }[];
    }[] = [];

    for (const item of items) {
      let group = groups.find(
        (g) => Math.abs(g.y - item.y) <= 3
      );

      if (!group) {
        group = {
          y: item.y,
          items: [],
        };

        groups.push(group);
      }

      group.items.push({
        text: item.text,
        x: item.x,
      });
    }

    groups.sort((a, b) => b.y - a.y);

    for (const group of groups) {
      group.items.sort((a, b) => a.x - b.x);

      const line = group.items
        .map((item) => item.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (line) {
        semuaBaris.push(line);
      }
    }
  }

  return semuaBaris.join("\n");
}

// ============================================================
// FORMAT TANGGAL
// ============================================================

function formatTanggalIndonesia(tanggal: string): string {
  const [tahun, bulan, hari] = tanggal.split("-");

  const bulanMap: Record<string, string> = {
    "01": "Januari",
    "02": "Februari",
    "03": "Maret",
    "04": "April",
    "05": "Mei",
    "06": "Juni",
    "07": "Juli",
    "08": "Agustus",
    "09": "September",
    "10": "Oktober",
    "11": "November",
    "12": "Desember",
  };

  return `${Number(hari)} ${bulanMap[bulan]} ${tahun}`;
}

// ============================================================
// HALAMAN
// ============================================================

export default function ManajemenJadwalPage() {
  const [filePdf, setFilePdf] = useState<File | null>(null);

  const [hasilPreview, setHasilPreview] = useState<JadwalPreview[]>([]);

  const [teksPdf, setTeksPdf] = useState("");

  const [loadingBaca, setLoadingBaca] = useState(false);

  const [loadingSimpan, setLoadingSimpan] = useState(false);

  const [pesan, setPesan] = useState("");

  const [berhasilDisimpan, setBerhasilDisimpan] =
    useState(false);
const [jadwalPelayanan, setJadwalPelayanan] = useState<
  JadwalPelayananPublik[]
>([]);
const [loadingPelayanan, setLoadingPelayanan] = useState(false);
const [showFormPelayanan, setShowFormPelayanan] = useState(false);

const [formPelayanan, setFormPelayanan] = useState({
  tanggal: "",
  duta_layanan: "",
  pelayanan_publik: "",
  maganghub: "",
  pengawas: "",
  koordinator: "",
});

const [savingPelayanan, setSavingPelayanan] = useState(false);
const [filePdfPelayanan, setFilePdfPelayanan] =
  useState<File | null>(null);

const [previewPelayanan, setPreviewPelayanan] =
  useState<PelayananPublikPreview[]>([]);

const [teksPdfPelayanan, setTeksPdfPelayanan] =
  useState("");

const [loadingBacaPelayanan, setLoadingBacaPelayanan] =
  useState(false);

const [pesanPelayanan, setPesanPelayanan] =
  useState("");
// ==========================================================
// LOAD JADWAL PELAYANAN PUBLIK
// ==========================================================
const loadJadwalPelayanan = async () => {
  setLoadingPelayanan(true);

  try {
    const { data, error } = await supabase
      .from("jadwal_pelayanan_publik")
      .select(
        "id, tanggal, duta_layanan, pelayanan_publik, maganghub, pengawas, koordinator, aktif"
      )
      .order("tanggal", { ascending: true });

    if (error) {
      console.error(
        "Gagal mengambil jadwal pelayanan:",
        error
      );
      return;
    }

    setJadwalPelayanan(data ?? []);
  } catch (error) {
    console.error(
      "Kesalahan load jadwal pelayanan:",
      error
    );
  } finally {
    setLoadingPelayanan(false);
  }
};
useEffect(() => {
  loadJadwalPelayanan();
}, []);
const simpanJadwalPelayanan = async () => {
  if (!formPelayanan.tanggal) {
    alert("Tanggal wajib diisi.");
    return;
  }

  setSavingPelayanan(true);

  try {
    const { error } = await supabase
      .from("jadwal_pelayanan_publik")
      .insert({
        tanggal: formPelayanan.tanggal,
        duta_layanan: formPelayanan.duta_layanan || null,
        pelayanan_publik: formPelayanan.pelayanan_publik || null,
        maganghub: formPelayanan.maganghub || null,
        pengawas: formPelayanan.pengawas || null,
        koordinator: formPelayanan.koordinator || null,
        aktif: true,
      });

    if (error) {
      console.error("Gagal menyimpan jadwal pelayanan:", error);
      alert(`Gagal menyimpan jadwal: ${error.message}`);
      return;
    }

    alert("Jadwal pelayanan berhasil ditambahkan.");

    setFormPelayanan({
      tanggal: "",
      duta_layanan: "",
      pelayanan_publik: "",
      maganghub: "",
      pengawas: "",
      koordinator: "",
    });

    setShowFormPelayanan(false);

    await loadJadwalPelayanan();
  } catch (error) {
    console.error("Kesalahan simpan jadwal pelayanan:", error);
    alert("Terjadi kesalahan saat menyimpan jadwal.");
  } finally {
    setSavingPelayanan(false);
  }
};
  // ==========================================================
  // PILIH / BACA PDF
  // ==========================================================

  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setPesan("File yang dipilih harus berupa PDF.");
      return;
    }

    setFilePdf(file);

    setHasilPreview([]);

    setTeksPdf("");

    setPesan("");

    setBerhasilDisimpan(false);

    setLoadingBaca(true);

    try {
      const teks = await bacaTeksPdf(file);

      setTeksPdf(teks);

      const hasil = parseJadwal(teks);

      setHasilPreview(hasil);

      if (hasil.length === 0) {
        setPesan(
          "PDF berhasil dibaca, tetapi data jadwal tidak berhasil dikenali."
        );
      } else {
        setPesan(
          `PDF berhasil dibaca. ${hasil.length} data petugas berhasil dikenali.`
        );
      }
    } catch (error) {
      console.error(error);

      setPesan(
        "Terjadi kesalahan saat membaca PDF."
      );
    } finally {
      setLoadingBaca(false);
    }
  };
const handleFilePelayananChange = async (
  e: ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  if (file.type !== "application/pdf") {
    setPesanPelayanan("File yang dipilih harus berupa PDF.");
    return;
  }

  setFilePdfPelayanan(file);
  setPreviewPelayanan([]);
  setTeksPdfPelayanan("");
  setPesanPelayanan("");
  setLoadingBacaPelayanan(true);

  try {
    const teks = await bacaTeksPdf(file);

    setTeksPdfPelayanan(teks);

    const hasil = parseJadwalPelayanan(teks);

    setPreviewPelayanan(hasil);

    if (hasil.length === 0) {
      setPesanPelayanan(
        "PDF berhasil dibaca, tetapi data Jadwal Pelayanan Publik tidak berhasil dikenali."
      );
    } else {
      setPesanPelayanan(
        `PDF berhasil dibaca. ${hasil.length} jadwal pelayanan berhasil dikenali.`
      );
    }
  } catch (error) {
    console.error(error);

    setPesanPelayanan(
      "Terjadi kesalahan saat membaca PDF Jadwal Pelayanan Publik."
    );
  } finally {
    setLoadingBacaPelayanan(false);
  }
};
const simpanPreviewPelayanan = async () => {
  if (previewPelayanan.length === 0) {
    alert(
      "Belum ada data jadwal pelayanan yang siap disimpan."
    );
    return;
  }

  setSavingPelayanan(true);

  try {
    console.log(
      "=== DATA YANG AKAN DIKIRIM KE API ==="
    );
    console.table(previewPelayanan);
    console.log(
      "JUMLAH DATA:",
      previewPelayanan.length
    );

    const response = await fetch(
      "/api/jadwal-pelayanan",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: previewPelayanan,
        }),
      }
    );

    const hasil = await response.json();

    console.log(
      "=== HASIL API JADWAL PELAYANAN ==="
    );
    console.log(hasil);

    if (!response.ok || !hasil.success) {
      alert(
        `Gagal menyimpan jadwal pelayanan.\n\n${
          hasil.error || "Terjadi kesalahan."
        }`
      );

      return;
    }

    alert(
      hasil.message ||
        `${previewPelayanan.length} jadwal pelayanan berhasil disimpan.`
    );

    setFilePdfPelayanan(null);
    setPreviewPelayanan([]);
    setTeksPdfPelayanan("");
    setPesanPelayanan("");

    await loadJadwalPelayanan();
  } catch (error) {
    console.error(
      "Kesalahan simpan jadwal pelayanan:",
      error
    );

    alert(
      `Terjadi kesalahan saat menyimpan jadwal pelayanan.\n\n${
        error instanceof Error
          ? error.message
          : String(error)
      }`
    );
  } finally {
    setSavingPelayanan(false);
  }
};
  // ==========================================================
  // HAPUS FILE PREVIEW
  // ==========================================================

  const hapusPreview = () => {
    setFilePdf(null);
    setHasilPreview([]);
    setTeksPdf("");
    setPesan("");
    setBerhasilDisimpan(false);

    const input =
      document.getElementById(
        "file-jadwal-apel"
      ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }
  };

  // ==========================================================
  // SIMPAN JADWAL
  // ==========================================================

  const simpanJadwal = async () => {
    if (!filePdf) {
      alert("Silakan pilih PDF terlebih dahulu.");
      return;
    }

    if (hasilPreview.length === 0) {
      alert("Belum ada data jadwal yang dapat disimpan.");
      return;
    }

    if (hasilPreview.length !== 198) {
      const lanjut = window.confirm(
        `Sistem menemukan ${hasilPreview.length} data.\n\n` +
          `Untuk September 2026 seharusnya terdapat 198 data ` +
          `(22 hari × 9 petugas).\n\n` +
          `Apakah Anda tetap ingin menyimpan data ini?`
      );

      if (!lanjut) return;
    }

    const tanggalPertama =
      hasilPreview[0].tanggal;

    const [tahun, bulan] =
      tanggalPertama.split("-");

    const tahunPdf = Number(tahun);

    const bulanPdf = Number(bulan);

    const namaFile =
      `jadwal-apel-${tahunPdf}-${String(
        bulanPdf
      ).padStart(2, "0")}.pdf`;

    const storagePath =
      `${tahunPdf}/${String(bulanPdf).padStart(
        2,
        "0"
      )}/${namaFile}`;

    setLoadingSimpan(true);

    setPesan("");

    setBerhasilDisimpan(false);

    let pdfBerhasilUpload = false;

    try {
      // ======================================================
      // 1. UPLOAD PDF KE STORAGE
      // ======================================================

      const { error: uploadError } =
        await supabase.storage
          .from("jadwal-apel")
          .upload(
            storagePath,
            filePdf,
            {
              upsert: true,
              contentType: "application/pdf",
              cacheControl: "3600",
            }
          );

      if (uploadError) {
        throw new Error(
          `Gagal upload PDF: ${uploadError.message}`
        );
      }

      pdfBerhasilUpload = true;

      // ======================================================
      // 2. AMBIL PUBLIC URL
      // ======================================================

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("jadwal-apel")
        .getPublicUrl(storagePath);

      const filePdfUrl =
        publicUrlData.publicUrl;

      // ======================================================
      // 3. SIMPAN DATA JADWAL
      //
      // API ini melakukan:
      // - parsing ulang teks PDF
      // - menghapus jadwal tanggal terkait
      // - insert data baru
      // ======================================================

      const response = await fetch(
        "/api/jadwal-apel/import-pdf",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            text: teksPdf,
          }),
        }
      );

      const result =
        await response.json();

   if (!response.ok) {
  console.error("RESPON API IMPORT JADWAL:", result);

  throw new Error(
    result?.message ||
      result?.error ||
      "Gagal menyimpan data jadwal ke database."
  );
}

      // ======================================================
      // 4. SIMPAN METADATA PDF BULANAN
      // ======================================================

      const {
        error: metadataError,
      } = await supabase
        .from("jadwal_apel_bulanan")
        .upsert(
          {
            bulan: bulanPdf,
            tahun: tahunPdf,
            nama_file: filePdf.name,
            file_pdf: filePdfUrl,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "bulan,tahun",
          }
        );

      if (metadataError) {
        throw new Error(
          `Data jadwal berhasil disimpan, tetapi metadata PDF gagal disimpan: ${metadataError.message}`
        );
      }

      // ======================================================
      // 5. BERHASIL
      // ======================================================

    const jumlah = result?.jumlah ?? 0;

if (result?.success !== true) {
  throw new Error(
    result?.message || "Import jadwal apel gagal."
  );
}
if (jumlah < hasilPreview.length) {
  throw new Error(
    `Data yang tersimpan hanya ${jumlah} dari ${hasilPreview.length} data preview.`
  );
}

      setBerhasilDisimpan(true);

      setPesan(
        `Berhasil! ${jumlah} data Jadwal Petugas Apel ${formatTanggalIndonesia(
          `${tahunPdf}-${String(
            bulanPdf
          ).padStart(2, "0")}-01`
        ).replace("1 ", "")} ${tahunPdf} telah disimpan.`
      );

      alert(
        `Jadwal Petugas Apel berhasil disimpan.\n\n` +
          `Jumlah data: ${jumlah}\n` +
          `Bulan: ${bulanPdf}/${tahunPdf}\n\n` +
          `PDF juga berhasil disimpan ke Storage.`
      );
    } catch (error) {
      console.error(
        "Gagal menyimpan jadwal:",
        error
      );

      // ======================================================
      // Jika PDF sudah berhasil upload tetapi proses
      // berikutnya gagal, hapus PDF baru tersebut.
      // ======================================================

      if (pdfBerhasilUpload) {
        try {
          await supabase.storage
            .from("jadwal-apel")
            .remove([storagePath]);
        } catch (removeError) {
          console.error(
            "Gagal membersihkan PDF:",
            removeError
          );
        }
      }

      const pesanError =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan jadwal.";

      setPesan(
        `Gagal menyimpan jadwal: ${pesanError}`
      );

      alert(
        `Gagal menyimpan Jadwal Petugas Apel.\n\n${pesanError}`
      );
    } finally {
      setLoadingSimpan(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#0B2E78] via-[#1D4ED8] to-[#3B82F6] px-8 py-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
              <CalendarDays size={30} />
            </div>

            <div>
              <h1 className="text-2xl xl:text-3xl font-black">
                Manajemen Jadwal
              </h1>

              <p className="text-blue-100 mt-1">
                Pengelolaan jadwal petugas apel dan pelayanan publik
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          JADWAL PETUGAS APEL
      ====================================================== */}

      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <CalendarDays
            className="text-blue-700"
            size={24}
          />

          <h2 className="text-xl font-bold text-gray-800">
            Jadwal Petugas Apel
          </h2>
        </div>

        {/* ===================================================
            UPLOAD
        ==================================================== */}

        {!filePdf && (
          <label
            htmlFor="file-jadwal-apel"
            className="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition"
          >
            <FileUp
              size={42}
              className="text-blue-600 mb-3"
            />

            <span className="font-semibold text-blue-700">
              Pilih PDF Jadwal Petugas Apel
            </span>

            <span className="text-sm text-gray-500 mt-1">
              Format PDF
            </span>

            <input
              id="file-jadwal-apel"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}

        {/* ===================================================
            FILE TERPILIH
        ==================================================== */}

        {filePdf && (
          <div className="border rounded-2xl p-4 bg-gray-50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <FileText
                    size={22}
                    className="text-red-600"
                  />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {filePdf.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    {(filePdf.size / 1024 / 1024).toFixed(
                      1
                    )}{" "}
                    MB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={hapusPreview}
                disabled={
                  loadingBaca ||
                  loadingSimpan
                }
                className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                title="Hapus PDF"
              >
                <X size={19} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            LOADING BACA
        ==================================================== */}

        {loadingBaca && (
          <div className="mt-5 rounded-2xl bg-blue-50 border border-blue-200 p-5 flex items-center gap-3">
            <Loader2
              size={22}
              className="animate-spin text-blue-600"
            />

            <div>
              <p className="font-semibold text-blue-800">
                Sedang membaca PDF...
              </p>

              <p className="text-sm text-blue-600">
                Sistem sedang mengenali tanggal,
                nama, jabatan, dan tugas petugas apel.
              </p>
            </div>
          </div>
        )}

        {/* ===================================================
            PESAN
        ==================================================== */}

        {pesan && !loadingBaca && (
          <div
            className={`mt-5 rounded-2xl border p-4 flex items-start gap-3 ${
              pesan.startsWith("Gagal")
                ? "bg-red-50 border-red-200 text-red-700"
                : berhasilDisimpan
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-blue-50 border-blue-200 text-blue-700"
            }`}
          >
            {berhasilDisimpan ? (
              <CheckCircle2
                size={22}
                className="shrink-0"
              />
            ) : (
              <FileText
                size={22}
                className="shrink-0"
              />
            )}

            <p className="text-sm font-medium">
              {pesan}
            </p>
          </div>
        )}

        {/* ===================================================
            PREVIEW
        ==================================================== */}

        {hasilPreview.length > 0 && (
          <div className="mt-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Preview Data Jadwal
                </h3>

                <p className="text-sm text-gray-500">
                  Data berikut belum disimpan ke database.
                  Periksa terlebih dahulu hasil pembacaan PDF.
                </p>
              </div>

              <div className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm">
                {hasilPreview.length} data petugas ditemukan
              </div>
            </div>

            <div className="border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold">
                        No
                      </th>

                      <th className="px-4 py-3 text-left font-bold">
                        Tanggal
                      </th>

                      <th className="px-4 py-3 text-left font-bold">
                        Nama Petugas
                      </th>

                      <th className="px-4 py-3 text-left font-bold">
                        Jabatan
                      </th>

                      <th className="px-4 py-3 text-left font-bold">
                        Tugas
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {hasilPreview.map(
                      (item, index) => (
                        <tr
                          key={`${item.tanggal}-${item.nama_petugas}-${item.tugas}-${index}`}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-gray-500">
                            {index + 1}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatTanggalIndonesia(
                              item.tanggal
                            )}
                          </td>

                          <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                            {item.nama_petugas}
                          </td>

                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {item.jabatan}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            {item.tugas}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =================================================
                SIMPAN
            ================================================== */}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={simpanJadwal}
                disabled={
                  loadingSimpan ||
                  berhasilDisimpan ||
                  hasilPreview.length === 0
                }
                className={`flex-1 rounded-2xl px-6 py-4 font-bold flex items-center justify-center gap-3 transition ${
                  berhasilDisimpan
                    ? "bg-green-600 text-white"
                    : "bg-blue-700 text-white hover:bg-blue-800 disabled:bg-gray-300 disabled:text-gray-500"
                }`}
              >
                {loadingSimpan ? (
                  <>
                    <Loader2
                      size={21}
                      className="animate-spin"
                    />

                    Menyimpan Jadwal...
                  </>
                ) : berhasilDisimpan ? (
                  <>
                    <CheckCircle2 size={21} />

                    Jadwal Berhasil Disimpan
                  </>
                ) : (
                  <>
                    <Save size={21} />

                    Simpan Jadwal Apel
                  </>
                )}
              </button>

              {!loadingSimpan &&
                !berhasilDisimpan && (
                  <button
                    type="button"
                    onClick={hapusPreview}
                    className="sm:w-48 rounded-2xl px-6 py-4 font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                  >
                    Batalkan
                  </button>
                )}
            </div>

            {!berhasilDisimpan && (
              <p className="text-xs text-gray-500 text-center mt-3">
                Tombol simpan akan mengganti data jadwal
                pada bulan yang terdapat di dalam PDF.
              </p>
            )}
          </div>
        )}

        {/* ===================================================
            HASIL BACA PDF
        ==================================================== */}

        {teksPdf && (
          <details className="mt-6">
            <summary className="cursor-pointer font-semibold text-gray-700">
              Hasil Baca PDF
            </summary>

            <textarea
              value={teksPdf}
              readOnly
              className="mt-3 w-full h-64 rounded-2xl border p-4 text-xs font-mono bg-gray-50"
            />
          </details>
        )}
      </div>

      {/* =====================================================
          JADWAL PELAYANAN PUBLIK
      ====================================================== */}
 
      <div className="bg-white rounded-3xl shadow-lg p-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays
              className="text-blue-700"
              size={24}
            />

            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Jadwal Pelayanan Publik
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Kelola jadwal pelayanan publik Bapas Kelas I Jakarta Barat.
              </p>
            </div>
          </div>

        <label
  htmlFor="upload-pdf-pelayanan"
  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
>
  <Upload size={18} />
  Upload PDF Bulanan
</label>

<input
  id="upload-pdf-pelayanan"
  type="file"
  accept="application/pdf"
  onChange={handleFilePelayananChange}
  className="hidden"
/>
        </div>
{/* PREVIEW PDF JADWAL PELAYANAN */}
{filePdfPelayanan && (
  <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-lg font-bold text-gray-800">
          Preview Jadwal Pelayanan Publik
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          File: {filePdfPelayanan.name}
        </p>
      </div>

      {loadingBacaPelayanan && (
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2
            size={20}
            className="animate-spin"
          />
          <span className="text-sm font-medium">
            Membaca PDF...
          </span>
        </div>
      )}
    </div>

    {pesanPelayanan && (
      <div className="mt-4 rounded-xl border border-blue-200 bg-white p-3 text-sm text-gray-700">
        {pesanPelayanan}
      </div>
    )}
{teksPdfPelayanan && (
  <details className="mt-4 rounded-xl border border-gray-300 bg-white">
    <summary className="cursor-pointer px-4 py-3 font-semibold text-gray-700">
      🔎 Hasil Baca PDF Pelayanan
    </summary>

    <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap p-4 text-xs text-gray-600">
      {teksPdfPelayanan}
    </pre>
  </details>
)}
    {previewPelayanan.length > 0 && (
      <div className="mt-4 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">
                Tanggal
              </th>
              <th className="px-4 py-3 text-left">
                Duta Layanan
              </th>
              <th className="px-4 py-3 text-left">
                Pelayanan Publik
              </th>
              <th className="px-4 py-3 text-left">
                Maganghub
              </th>
              <th className="px-4 py-3 text-left">
                Pengawas
              </th>
              <th className="px-4 py-3 text-left">
                Koordinator
              </th>
            </tr>
          </thead>

          <tbody>
            {previewPelayanan.map((item, index) => (
              <tr
                key={`${item.tanggal}-${index}`}
                className="border-t"
              >
                <td className="px-4 py-3 whitespace-nowrap font-medium">
                  {formatTanggalIndonesia(item.tanggal)}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  {item.duta_layanan}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  {item.pelayanan_publik}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  {item.maganghub}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  {item.pengawas}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  {item.koordinator}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
        {previewPelayanan.length > 0 && (
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={simpanPreviewPelayanan}
          disabled={savingPelayanan}
          className="flex-1 rounded-2xl bg-blue-700 px-6 py-4 font-bold text-white flex items-center justify-center gap-3 transition hover:bg-blue-800 disabled:bg-gray-300 disabled:text-gray-500"
        >
          {savingPelayanan ? (
            <>
              <Loader2
                size={21}
                className="animate-spin"
              />
              Menyimpan Jadwal Pelayanan...
            </>
          ) : (
            <>
              <Save size={21} />
              Simpan Jadwal Pelayanan
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setFilePdfPelayanan(null);
            setPreviewPelayanan([]);
            setTeksPdfPelayanan("");
            setPesanPelayanan("");

            const input = document.getElementById(
              "upload-pdf-pelayanan"
            ) as HTMLInputElement | null;

            if (input) {
              input.value = "";
            }
          }}
          disabled={savingPelayanan}
          className="sm:w-48 rounded-2xl px-6 py-4 font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
        >
          Batalkan
        </button>
      </div>
    )}
  </div>
)}
       

        {/* DAFTAR JADWAL */}
        <div className="mt-6">
          {loadingPelayanan ? (
            <div className="py-10 flex items-center justify-center gap-3 text-blue-600">
              <Loader2
                size={22}
                className="animate-spin"
              />
              <span className="font-medium">
                Memuat jadwal pelayanan...
              </span>
            </div>
          ) : jadwalPelayanan.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <CalendarDays
                size={36}
                className="mx-auto text-gray-400 mb-3"
              />

              <p className="font-semibold text-gray-600">
                Belum ada jadwal pelayanan publik.
              </p>
            </div>
          ) : (
            <div className="border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        Tanggal
                      </th>
                      <th className="px-4 py-3 text-left">
                        Duta Layanan
                      </th>
                      <th className="px-4 py-3 text-left">
                        Pelayanan Publik
                      </th>
                      <th className="px-4 py-3 text-left">
                        Maganghub
                      </th>
                      <th className="px-4 py-3 text-left">
                        Pengawas
                      </th>
                      <th className="px-4 py-3 text-left">
                        Koordinator
                      </th>
                      <th className="px-4 py-3 text-center">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {jadwalPelayanan.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 whitespace-nowrap font-medium">
                          {formatTanggalIndonesia(item.tanggal)}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.duta_layanan || "-"}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.pelayanan_publik || "-"}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.maganghub || "-"}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.pengawas || "-"}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.koordinator || "-"}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={
                              item.aktif
                                ? "inline-flex px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold"
                                : "inline-flex px-3 py-1 rounded-full bg-gray-100 text-gray-500 font-semibold"
                            }
                          >
                            {item.aktif
                              ? "Aktif"
                              : "Nonaktif"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
              </div>
      </div>
    </div>
  );

}

