
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

  // Jabatan yang muncul pada PDF
  "Pengelola Layanan Peng.",
  "Pengadministrasi Perk.",
 "Penjaga Tahanan",

  // Jabatan lain
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

type JadwalPiketPublikasi = {
  id: number;
  tanggal: string;
  fotografer: string | null;
  videografer: string | null;
  pembuat_konten_1: string | null;
  pembuat_konten_2: string | null;
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

  // Hapus nomor di awal, contoh: "1. Nama ..."
  teks = teks.replace(/^\d+\.\s*/, "");

  if (!teks) return null;

  // Cari tugas dari bagian PALING AKHIR
  const tugas = daftarTugas
    .sort((a, b) => b.length - a.length)
    .find((item) => teks.endsWith(item));

  if (!tugas) return null;

  // Buang tugas
  teks = teks
    .slice(0, -tugas.length)
    .trim();

  // Cari jabatan dari bagian PALING AKHIR
  const jabatan = [
    ...daftarJabatan,
    "Penjaga Tahanan",
  ]
    .sort((a, b) => b.length - a.length)
    .find((item) => teks.endsWith(item));

  if (!jabatan) return null;

  // Buang jabatan
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
// ============================================================
// PARSER JADWAL PELAYANAN PUBLIK OTOMATIS
// ============================================================

const BULAN_INDONESIA: Record<string, string> = {
  januari: "01",
  februari: "02",
  maret: "03",
  april: "04",
  mei: "05",
  juni: "06",
  juli: "07",
  agustus: "08",
  september: "09",
  oktober: "10",
  november: "11",
  desember: "12",
};

// Jabatan yang biasa muncul sebagai PENGAWAS
const DAFTAR_PENGAWAS_PELAYANAN = [
  "Kasubsi Bimkemas Dewasa",
  "Kasubsi Registrasi Dewasa",
  "Kasubsi Bimker Anak",
  "Kasubsi Bimker Dewasa",
  "Kasubsi Registrasi Anak",
  "Kasubsi Bimkemas Anak",
  "Kasubbag Tata Usaha",
  "Kaur Kepegawaian",
  "Kaur Keuangan",
  "Kaur Umum",
];

// Jabatan yang biasa muncul sebagai KOORDINATOR
const DAFTAR_KOORDINATOR_PELAYANAN = [
  "Kasubbag Tata Usaha",
  "Kasi BKA",
  "Kasi BKD",
  "Kaur Umum",
  "Kaur Keuangan",
  "Kaur Kepegawaian",
];

// Normalisasi teks
function normalisasiTeksPelayanan(teks: string): string {
  return teks
    .replace(/\u00A0/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Escape regex
function escapeRegexPelayanan(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ============================================================
// DETEKSI BULAN / TAHUN PDF
// ============================================================

function deteksiBulanTahunPelayanan(
  teks: string
): {
  bulan: number;
  tahun: number;
  namaBulan: string;
} | null {
  const teksNormal = normalisasiTeksPelayanan(teks);

  const daftarBulan =
    "januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember";

  // Prioritaskan periode pada bagian Perihal.
  const regexPerihal = new RegExp(
    `\\bperihal\\s*:\\s*.*?\\b(${daftarBulan})\\s+(\\d{4})\\b`,
    "i"
  );

  // Cadangan jika format Perihal tidak ditemukan.
  const regexUmum = new RegExp(
    `\\b(${daftarBulan})\\s+(\\d{4})\\b`,
    "i"
  );

  const match =
    teksNormal.match(regexPerihal) ||
    teksNormal.match(regexUmum);

  if (!match) {
    return null;
  }

  const namaBulan = match[1].toLowerCase();
  const tahun = Number(match[2]);
  const bulanString = BULAN_INDONESIA[namaBulan];

  if (!bulanString) {
    return null;
  }

  return {
    bulan: Number(bulanString),
    tahun,
    namaBulan: match[1],
  };
}
// ============================================================
// DETEKSI TANGGAL DALAM TEKS
// ============================================================

function cariTanggalPelayanan(
  teks: string,
  periode: {
    bulan: number;
    tahun: number;
  }
): {
  tanggal: string;
  index: number;
  panjang: number;
}[] {
  const hasil: {
    tanggal: string;
    index: number;
    panjang: number;
  }[] = [];

  const regex =
    /\b(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\b/gi;

  const jumlahHari = new Date(
    Date.UTC(periode.tahun, periode.bulan, 0)
  ).getUTCDate();

  let match: RegExpExecArray | null;

  while ((match = regex.exec(teks)) !== null) {
    const hari = Number(match[1]);
    const namaBulan = match[2].toLowerCase();

    const bulanString = BULAN_INDONESIA[namaBulan];

    if (!bulanString) continue;

    const bulan = Number(bulanString);

    if (bulan !== periode.bulan) continue;

    if (hari < 1 || hari > jumlahHari) continue;

    hasil.push({
      tanggal: `${periode.tahun}-${String(bulan).padStart(2, "0")}-${String(hari).padStart(2, "0")}`,
      index: match.index,
      panjang: match[0].length,
    });
  }

  return hasil;
}

// ============================================================
// CARI LABEL TUGAS
// ============================================================

function cariLabelTugasPelayanan(
  teks: string
): {
  label: string;
  index: number;
  panjang: number;
}[] {
  const daftarLabel = [
    "Duta Layanan",
    "Pelayanan Publik",
    "Maganghub",
  ];

  const hasil: {
    label: string;
    index: number;
    panjang: number;
  }[] = [];

  for (const label of daftarLabel) {
    const regex = new RegExp(
      escapeRegexPelayanan(label),
      "gi"
    );

    let match: RegExpExecArray | null;

    while ((match = regex.exec(teks)) !== null) {
      hasil.push({
        label,
        index: match.index,
        panjang: match[0].length,
      });
    }
  }

  return hasil.sort((a, b) => a.index - b.index);
}

// ============================================================
// CARI NAMA SEBELUM LABEL TUGAS
// ============================================================

function ambilNamaSebelumLabel(
  teks: string,
  posisiLabel: number,
  batasAwal: number
): string {
  let nama = teks.slice(
    batasAwal,
    posisiLabel
  );

  nama = nama
    .replace(/\b\d{1,2}\s*$/g, "")
    .replace(/\b(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu),?\s*$/gi, "")
    .trim();

  // Bersihkan karakter pemisah
  nama = nama
    .replace(/^[,;|:\-]+/, "")
    .replace(/[,;|:\-]+$/, "")
    .trim();

  return nama;
}

// ============================================================
// CARI NAMA SESUDAH LABEL TUGAS
// Digunakan sebagai fallback apabila urutan PDF berbeda.
// ============================================================

function ambilNamaSesudahLabel(
  teks: string,
  posisiSetelahLabel: number,
  batasAkhir: number
): string {
  let nama = teks.slice(
    posisiSetelahLabel,
    batasAkhir
  );

  nama = nama
    .replace(/^[,;|:\-]+/, "")
    .replace(/[,;|:\-]+$/, "")
    .trim();

  return nama;
}

// ============================================================
// CARI JABATAN PENGAWAS
// ============================================================

function cariPengawasPelayanan(
  teks: string
): string {
  const teksNormal = normalisasiTeksPelayanan(teks);

  const daftar = [...DAFTAR_PENGAWAS_PELAYANAN].sort(
    (a, b) => b.length - a.length
  );

  for (const jabatan of daftar) {
    const regex = new RegExp(
      escapeRegexPelayanan(jabatan),
      "i"
    );

    const match = teksNormal.match(regex);

    if (match) {
      return match[0].trim();
    }
  }

  return "";
}

// ============================================================
// CARI KOORDINATOR
// ============================================================

function cariKoordinatorPelayanan(
  teks: string,
  pengawas: string
): string {
  let teksNormal = normalisasiTeksPelayanan(teks);

  // Hapus pengawas supaya tidak terdeteksi sebagai koordinator
  if (pengawas) {
    const regexPengawas = new RegExp(
      escapeRegexPelayanan(pengawas),
      "i"
    );

    teksNormal = teksNormal.replace(
      regexPengawas,
      " "
    );
  }

  // Jabatan struktural yang umum menjadi koordinator
  const daftarJabatan = [
    ...DAFTAR_KOORDINATOR_PELAYANAN,
  ].sort((a, b) => b.length - a.length);

  for (const jabatan of daftarJabatan) {
    const regex = new RegExp(
      escapeRegexPelayanan(jabatan),
      "i"
    );

    const match = teksNormal.match(regex);

    if (match) {
      return match[0].trim();
    }
  }

  /*
   * Jika bukan jabatan, koordinator biasanya berupa
   * nama pegawai. Kita cari nama setelah struktur
   * pengawas sebagai fallback.
   */

  return "";
}

// ============================================================
// PARSER SATU BLOK TANGGAL
// ============================================================

function parseBlokPelayanan(
  blok: string,
  tanggal: string
): PelayananPublikPreview | null {
  let teks = normalisasiTeksPelayanan(blok);

  if (!teks) return null;

  // ----------------------------------------------------------
  // Hapus tanggal dari blok
  // ----------------------------------------------------------

  teks = teks.replace(
    /\b\d{1,2}\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}\b/gi,
    " "
  );

  teks = normalisasiTeksPelayanan(teks);

  // ----------------------------------------------------------
  // Cari semua label tugas
  // ----------------------------------------------------------

  const labels = cariLabelTugasPelayanan(teks);

  let duta_layanan = "";
  let pelayanan_publik = "";
  let maganghub = "";

  // ----------------------------------------------------------
  // STRATEGI 1
  // Nama berada sebelum label
  //
  // Contoh:
  // Ilham Rizky Juniawan Duta Layanan
  // Agung Swandoyo Pelayanan Publik
  // Refie Ruliansyah Maganghub
  // ----------------------------------------------------------

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];

    const batasAwal =
      i === 0
        ? 0
        : labels[i - 1].index +
          labels[i - 1].panjang;

    const nama = ambilNamaSebelumLabel(
      teks,
      label.index,
      batasAwal
    );

    if (!nama) continue;

    if (
      label.label.toLowerCase() ===
      "duta layanan"
    ) {
      duta_layanan = nama;
    }

    if (
      label.label.toLowerCase() ===
      "pelayanan publik"
    ) {
      pelayanan_publik = nama;
    }

    if (
      label.label.toLowerCase() ===
      "maganghub"
    ) {
      maganghub = nama;
    }
  }

  // ----------------------------------------------------------
  // STRATEGI 2
  // Jika nama tidak terbaca sebelum label,
  // coba nama setelah label.
  // ----------------------------------------------------------

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];

    const batasAkhir =
      i + 1 < labels.length
        ? labels[i + 1].index
        : teks.length;

    const nama = ambilNamaSesudahLabel(
      teks,
      label.index + label.panjang,
      batasAkhir
    );

    if (!nama) continue;

    if (
      label.label.toLowerCase() ===
        "duta layanan" &&
      !duta_layanan
    ) {
      duta_layanan = nama;
    }

    if (
      label.label.toLowerCase() ===
        "pelayanan publik" &&
      !pelayanan_publik
    ) {
      pelayanan_publik = nama;
    }

    if (
      label.label.toLowerCase() ===
        "maganghub" &&
      !maganghub
    ) {
      maganghub = nama;
    }
  }

  // ----------------------------------------------------------
  // PENGAWAS
  // ----------------------------------------------------------

  const pengawas =
    cariPengawasPelayanan(teks);

  // ----------------------------------------------------------
  // KOORDINATOR
  // ----------------------------------------------------------

  const koordinator =
    cariKoordinatorPelayanan(
      teks,
      pengawas
    );

  // ----------------------------------------------------------
  // Bersihkan hasil
  // ----------------------------------------------------------

  duta_layanan = duta_layanan
    .replace(
      /\b(Kasubsi|Kasubbag|Kaur|Kasi)\b.*$/i,
      ""
    )
    .trim();

  pelayanan_publik = pelayanan_publik
    .replace(
      /\b(Kasubsi|Kasubbag|Kaur|Kasi)\b.*$/i,
      ""
    )
    .trim();

  maganghub = maganghub
    .replace(
      /\b(Kasubsi|Kasubbag|Kaur|Kasi)\b.*$/i,
      ""
    )
    .trim();

  return {
    tanggal,
    duta_layanan,
    pelayanan_publik,
    maganghub,
    pengawas,
    koordinator,
  };
}

// ============================================================
// PARSER UTAMA
// OTOMATIS SEMUA BULAN / TAHUN
// ============================================================

function parseJadwalPelayanan(
  items: ItemPdfPublikasi[]
): PelayananPublikPreview[] {
  console.log(
    "=== PARSER KOORDINAT JADWAL PELAYANAN PUBLIK ==="
  );

  const teksNormal = normalisasiTeksPelayanan(
    items.map((item) => item.text).join(" ")
  );

  // ----------------------------------------------------------
  // VALIDASI JENIS PDF
  // ----------------------------------------------------------

  const isJadwalPelayanan =
    /jadwal\s+piket\s+petugas\s+pelayanan\s+publik/i.test(
      teksNormal
    ) ||
    /jadwal\s+pelayanan\s+publik/i.test(
      teksNormal
    );

  if (!isJadwalPelayanan) {
    console.warn("PDF bukan Jadwal Pelayanan Publik.");
    return [];
  }

  // ----------------------------------------------------------
  // DETEKSI BULAN DAN TAHUN
  // ----------------------------------------------------------

  const periode =
    deteksiBulanTahunPelayanan(teksNormal);

  if (!periode) {
    console.warn("Periode PDF tidak ditemukan.");
    return [];
  }

  console.log(
    "PERIODE:",
    periode.namaBulan,
    periode.tahun
  );

  // ----------------------------------------------------------
  // CARI PENANDA TANGGAL BERDASARKAN KOORDINAT
  // ----------------------------------------------------------

  const kandidatTanggal = items.filter((item) => {
    if (item.x < 45 || item.x > 95) return false;

    const cocok = item.text.match(
      /^\s*(\d{1,2})(?:\s+[A-Za-z]+)?\s*$/i
    );

    if (!cocok) return false;

    const hari = Number(cocok[1]);

    if (hari < 1 || hari > 31) return false;

    // Tahun harus berada di sekitar penanda tanggal.
    const adaTahun = items.some(
      (lain) =>
        lain.halaman === item.halaman &&
        lain.x >= 60 &&
        lain.x <= 100 &&
        Math.abs(lain.y - item.y) <= 18 &&
        lain.text.trim() === String(periode.tahun)
    );

    const adaBulan = new RegExp(
      `\\b${periode.namaBulan}\\b`,
      "i"
    ).test(item.text);

    return adaTahun || adaBulan;
  });

  // Hilangkan penanda tanggal duplikat.
  const tanggalUnik: ItemPdfPublikasi[] = [];

  for (const item of kandidatTanggal) {
    const sudahAda = tanggalUnik.some(
      (lain) =>
        lain.halaman === item.halaman &&
        lain.text === item.text &&
        Math.abs(lain.y - item.y) <= 3
    );

    if (!sudahAda) {
      tanggalUnik.push(item);
    }
  }

  tanggalUnik.sort(
    (a, b) =>
      a.halaman - b.halaman ||
      b.y - a.y
  );

  console.log(
    "JUMLAH PENANDA TANGGAL:",
    tanggalUnik.length
  );

  console.table(
    tanggalUnik.map((item) => ({
      halaman: item.halaman,
      y: item.y,
      tanggal: item.text,
    }))
  );

  if (tanggalUnik.length === 0) {
    console.warn("Tidak ditemukan tanggal jadwal.");
    return [];
  }

  // ----------------------------------------------------------
  // FUNGSI MENGGABUNGKAN TEKS DALAM SATU KOLOM
  // Termasuk teks yang terpecah menjadi beberapa baris.
  // ----------------------------------------------------------

  const gabungKolom = (
    daftar: ItemPdfPublikasi[]
  ): string => {
    const kelompok: {
      y: number;
      items: ItemPdfPublikasi[];
    }[] = [];

    for (const item of [...daftar].sort(
      (a, b) => b.y - a.y || a.x - b.x
    )) {
      let grup = kelompok.find(
        (g) => Math.abs(g.y - item.y) <= 3
      );

      if (!grup) {
        grup = {
          y: item.y,
          items: [],
        };

        kelompok.push(grup);
      }

      grup.items.push(item);
    }

    return kelompok
      .sort((a, b) => b.y - a.y)
      .map((grup) =>
        grup.items
          .sort((a, b) => a.x - b.x)
          .map((item) => item.text)
          .join(" ")
      )
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  };

  // ----------------------------------------------------------
  // AMBIL NAMA PETUGAS BERDASARKAN POSISI BARIS
  // ----------------------------------------------------------

  const ambilNamaPetugas = (
    halaman: number,
    tanggalY: number,
    offsetY: number
  ): string => {
    const targetY = tanggalY + offsetY;

    const baris = items.filter(
      (item) =>
        item.halaman === halaman &&
        item.x >= 105 &&
        item.x < 260 &&
        Math.abs(item.y - targetY) <= 8
    );

    return gabungKolom(baris);
  };

  // ----------------------------------------------------------
  // PROSES SETIAP TANGGAL
  // ----------------------------------------------------------

  const hasil: PelayananPublikPreview[] = [];
  const dataTidakLengkap: string[] = [];

  for (const penanda of tanggalUnik) {
    const cocok = penanda.text.match(
      /^\s*(\d{1,2})/
    );

    if (!cocok) continue;

    const hari = Number(cocok[1]);

    const tanggal =
      `${periode.tahun}-` +
      `${String(periode.bulan).padStart(2, "0")}-` +
      `${String(hari).padStart(2, "0")}`;

    const dalamBlok = items.filter(
      (item) =>
        item.halaman === penanda.halaman &&
        item.y <= penanda.y + 15 &&
        item.y >= penanda.y - 30
    );

    // --------------------------------------------------------
    // TIGA NAMA PETUGAS
    // Urutan: Duta, Pelayanan Publik, Maganghub.
    // --------------------------------------------------------

    const duta_layanan = ambilNamaPetugas(
      penanda.halaman,
      penanda.y,
      8.6
    );

    const pelayanan_publik = ambilNamaPetugas(
      penanda.halaman,
      penanda.y,
      -6
    );

    const maganghub = ambilNamaPetugas(
      penanda.halaman,
      penanda.y,
      -20.6
    );

    // --------------------------------------------------------
    // PENGAWAS DAN KOORDINATOR
    // --------------------------------------------------------

    let pengawas = gabungKolom(
      dalamBlok.filter(
        (item) =>
          item.x >= 340 &&
          item.x < 455
      )
    );

    let koordinator = gabungKolom(
      dalamBlok.filter(
        (item) =>
          item.x >= 455 &&
          item.x < 550
      )
    );

    // --------------------------------------------------------
    // PENANGANAN TEKS PENGAWAS DAN KOORDINATOR
    // YANG TERGABUNG DALAM SATU ITEM PDF.
    // --------------------------------------------------------

    if (!koordinator && pengawas) {
      const polaGabungan =
        /^(Kasubsi\s+(?:Bimker|Bimkemas|Registrasi)\s+(?:Dewasa|Anak)|Kaur\s+(?:Keuangan|Umum|Kepegawaian)|Kasubbag\s+Tata\s+Usaha)\s+(.+)$/i;

      const pecah = pengawas.match(polaGabungan);

      if (pecah) {
        pengawas = pecah[1].trim();
        koordinator = pecah[2].trim();
      }
    }

    const data: PelayananPublikPreview = {
      tanggal,
      duta_layanan,
      pelayanan_publik,
      maganghub,
      pengawas,
      koordinator,
    };

    // --------------------------------------------------------
    // VALIDASI LIMA KOLOM WAJIB
    // --------------------------------------------------------

    const kolomKosong = Object.entries(data)
      .filter(
        ([key, value]) =>
          key !== "tanggal" &&
          !String(value).trim()
      )
      .map(([key]) => key);

    if (kolomKosong.length > 0) {
      dataTidakLengkap.push(
        `${tanggal}: ${kolomKosong.join(", ")}`
      );

      continue;
    }

    hasil.push(data);
  }

  // ----------------------------------------------------------
  // TOLAK SELURUH HASIL JIKA ADA TANGGAL TIDAK LENGKAP
  // ----------------------------------------------------------

  if (dataTidakLengkap.length > 0) {
    console.error(
      "ADA JADWAL YANG BELUM LENGKAP:"
    );

    console.table(
      dataTidakLengkap.map((item) => ({
        keterangan: item,
      }))
    );

    return [];
  }

  // ----------------------------------------------------------
  // HAPUS TANGGAL DUPLIKAT
  // ----------------------------------------------------------

  const hasilUnik = Array.from(
    new Map(
      hasil.map((item) => [
        item.tanggal,
        item,
      ])
    ).values()
  );

  hasilUnik.sort(
    (a, b) =>
      a.tanggal.localeCompare(b.tanggal)
  );

  // ----------------------------------------------------------
  // HASIL AKHIR
  // ----------------------------------------------------------

  console.log(
    "=========================================="
  );

  console.log(
    "PERIODE:",
    periode.namaBulan,
    periode.tahun
  );

  console.log(
    "JUMLAH JADWAL LENGKAP:",
    hasilUnik.length
  );

  console.table(hasilUnik);

  console.log(
    "=========================================="
  );

  return hasilUnik;
}

// ============================================================
// BACA TEXT PDF (FUNGSI LAMA, DIPAKAI MODUL LAIN)
// ============================================================

async function bacaTeksPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const semuaBaris: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const items = content.items
      .filter(
        (item): item is typeof item & { str: string; transform: number[] } =>
          "str" in item && "transform" in item
      )
      .map((item) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
      }));

    const groups: {
      y: number;
      items: { text: string; x: number }[];
    }[] = [];

    for (const item of items) {
      let group = groups.find((g) => Math.abs(g.y - item.y) <= 3);

      if (!group) {
        group = { y: item.y, items: [] };
        groups.push(group);
      }

      group.items.push({ text: item.text, x: item.x });
    }

    groups.sort((a, b) => b.y - a.y);

    for (const group of groups) {
      group.items.sort((a, b) => a.x - b.x);

      const line = group.items
        .map((i) => i.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (line) semuaBaris.push(line);
    }
  }

  return semuaBaris.join("\n");
}
// ============================================================
// BACA PDF PUBLIKASI DENGAN KOORDINAT
// Tidak mengubah fungsi bacaTeksPdf yang lama
// ============================================================

type ItemPdfPublikasi = {
  text: string;
  x: number;
  y: number;
  halaman: number;
};

async function bacaPdfPublikasiDenganPosisi(
  file: File
): Promise<ItemPdfPublikasi[]> {
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
  }).promise;

  const semuaItem: ItemPdfPublikasi[] = [];

  for (
    let pageNum = 1;
    pageNum <= pdf.numPages;
    pageNum++
  ) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    for (const item of content.items) {
      if (
        !("str" in item) ||
        !("transform" in item) ||
        typeof item.str !== "string" ||
        !Array.isArray(item.transform)
      ) {
        continue;
      }

      const x = Number(item.transform[4]);
      const y = Number(item.transform[5]);

      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        continue;
      }

      if (!item.str.trim()) continue;

      semuaItem.push({
        text: item.str.trim(),
        x,
        y,
        halaman: pageNum,
      });
    }
  }

  return semuaItem;
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

const [jadwalPublikasi, setJadwalPublikasi] =
  useState<JadwalPiketPublikasi[]>([]);
const [jadwalPublikasiHariIni, setJadwalPublikasiHariIni] =
  useState<JadwalPiketPublikasi | null>(null);

const [jadwalPublikasiBesok, setJadwalPublikasiBesok] =
  useState<JadwalPiketPublikasi | null>(null);
const [loadingPublikasi, setLoadingPublikasi] =
  useState(false);

const [filePdfPublikasi, setFilePdfPublikasi] =
  useState<File | null>(null);

const [previewPublikasi, setPreviewPublikasi] =
  useState<Omit<JadwalPiketPublikasi, "id">[]>([]);

const [teksPdfPublikasi, setTeksPdfPublikasi] =
  useState("");

const [loadingBacaPublikasi, setLoadingBacaPublikasi] =
  useState(false);

const [pesanPublikasi, setPesanPublikasi] =
  useState("");

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

const parseJadwalPublikasi = (
  itemsPdf: ItemPdfPublikasi[]
): Omit<JadwalPiketPublikasi, "id">[] => {
  const items = itemsPdf.filter(
    (item) => item.halaman === 1 && item.y > 200
  );

  // Ambil tanggal kalender saja.
  const tanggalItems = items.filter((item) => {
    const teks = item.text.trim();
    return (
      /^\d{1,2}$/.test(teks) &&
      Number(teks) >= 1 &&
      Number(teks) <= 30 &&
      item.x >= 100 &&
      item.y > 300
    );
  });

  const hasil: Omit<JadwalPiketPublikasi, "id">[] = [];
  const tanggalDiproses = new Set<number>();

  // Kelompokkan tanggal yang berada pada baris kalender yang sama.
  const barisTanggal: typeof tanggalItems = [];

  for (const item of [...tanggalItems].sort(
    (a, b) => b.y - a.y || a.x - b.x
  )) {
    if (
      !barisTanggal.some(
        (tanggal) =>
          Math.abs(tanggal.y - item.y) <= 2
      )
    ) {
      barisTanggal.push(item);
    }
  }

  const jarakBarisPeran = [
    { field: "fotografer", offset: 0 },
    { field: "videografer", offset: 1 },
    { field: "pembuat_konten_1", offset: 2 },
    { field: "pembuat_konten_2", offset: 3 },
  ] as const;

  for (const tanggalY of barisTanggal.map((item) => item.y)) {
    const tanggalDalamBaris = tanggalItems
      .filter((item) => Math.abs(item.y - tanggalY) <= 2)
      .sort((a, b) => a.x - b.x);

    for (const tanggalItem of tanggalDalamBaris) {
      const tanggal = Number(tanggalItem.text);
      if (tanggalDiproses.has(tanggal)) continue;
      tanggalDiproses.add(tanggal);

      const namaPeran: Record<string, string | null> = {
        fotografer: null,
        videografer: null,
        pembuat_konten_1: null,
        pembuat_konten_2: null,
      };

      // Setiap tanggal memiliki empat nama pada koordinat X yang sama
      // dan berada pada empat baris tepat di bawah tanggalnya.
      for (const peran of jarakBarisPeran) {
        const kandidat = items
          .filter((item) => {
            const jarakY = tanggalItem.y - item.y;
            return (
              item.x >= 100 &&
              Math.abs(item.x - tanggalItem.x) <= 35 &&
              jarakY > 10 &&
              jarakY < 100 &&
              !/^\d{1,2}$/.test(item.text) &&
              !/^(Fotografer|Videografer|Pembuat Konten)/i.test(
                item.text
              )
            );
          })
          .sort((a, b) => {
            const jarakA = tanggalItem.y - a.y;
            const jarakB = tanggalItem.y - b.y;
            return jarakA - jarakB;
          });

    const offsetPeran = [
  { field: "fotografer", offset: 21.6 },
  { field: "videografer", offset: 49.0 },
  { field: "pembuat_konten_1", offset: 76.4 },
  { field: "pembuat_konten_2", offset: 100.3 },
] as const;

for (const peran of offsetPeran) {
  const targetY = tanggalItem.y - peran.offset;

  const nama = items
    .filter(
      (item) =>
        item.x >= 100 &&
        Math.abs(item.x - tanggalItem.x) <= 35 &&
        Math.abs(item.y - targetY) <= 8 &&
        !/^\d{1,2}$/.test(item.text)
    )
    .sort(
      (a, b) =>
        Math.abs(a.y - targetY) - Math.abs(b.y - targetY)
    )[0];

  if (nama) {
    namaPeran[peran.field] = nama.text.trim();
  }
}
      }

      hasil.push({
        tanggal: `2026-11-${String(tanggal).padStart(2, "0")}`,
        fotografer: namaPeran.fotografer,
        videografer: namaPeran.videografer,
        pembuat_konten_1: namaPeran.pembuat_konten_1,
        pembuat_konten_2: namaPeran.pembuat_konten_2,
      });
    }
  }

  return hasil.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
};

const handleFilePublikasiChange = async (
  event: ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];

  if (!file) return;

  if (file.type !== "application/pdf") {
    setPesanPublikasi("Pilih file PDF untuk jadwal publikasi.");
    setFilePdfPublikasi(null);
    setPreviewPublikasi([]);
    setTeksPdfPublikasi("");
    event.target.value = "";
    return;
  }

  setFilePdfPublikasi(file);
  setPreviewPublikasi([]);
  setTeksPdfPublikasi("");
  setPesanPublikasi("");
  setLoadingBacaPublikasi(true);

  try {
    const itemsPdf = await bacaPdfPublikasiDenganPosisi(file);

    console.log("ITEM PDF PUBLIKASI:", itemsPdf);
    console.table(
      itemsPdf.map((item) => ({
        halaman: item.halaman,
        y: item.y,
        x: item.x,
        teks: item.text,
      }))
    );
console.log("KOORDINAT PDF:", JSON.stringify(itemsPdf, null, 2));
    const teks = itemsPdf.map((item) => item.text).join(" ");
    console.log("TEKS PDF UNTUK DETEKSI PERIODE:", teks);
    setTeksPdfPublikasi(teks);

    const hasilParse = parseJadwalPublikasi(itemsPdf);

    console.log("HASIL PARSING JADWAL PUBLIKASI:", hasilParse);
    console.table(hasilParse);

    setPreviewPublikasi(hasilParse);

    setPesanPublikasi(
      hasilParse.length === 30
        ? "PDF berhasil dibaca. 30 tanggal jadwal publikasi berhasil dikenali."
        : `PDF terbaca, tetapi hanya ${hasilParse.length} tanggal yang dikenali. Seharusnya 30 tanggal.`
    );
  } catch (error) {
    console.error("Gagal membaca PDF publikasi:", error);
    setPesanPublikasi("Gagal membaca PDF. Silakan coba file lain.");
  } finally {
    setLoadingBacaPublikasi(false);
  }
};
const handleSimpanPublikasi = async () => {
if (previewPublikasi.length !== 30) {
  setPesanPublikasi(
    `Jadwal belum lengkap. Ditemukan ${previewPublikasi.length} tanggal, sedangkan November 2026 harus 30 tanggal.`
  );
  return;
}

 const konfirmasi = window.confirm(
  "Simpan 30 baris jadwal piket publikasi November 2026 ke database?"
);
  if (!konfirmasi) return;

  setLoadingBacaPublikasi(true);
  setPesanPublikasi("");

  try {
    const response = await fetch("/api/jadwal-piket-publikasi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: previewPublikasi,
      }),
    });

    const hasil = await response.json();

    if (!response.ok) {
      throw new Error(
        hasil.error || "Gagal menyimpan jadwal publikasi."
      );
    }

    setPesanPublikasi(
      hasil.message || "Jadwal publikasi berhasil disimpan."
    );
    alert(hasil.message || "Jadwal publikasi berhasil disimpan.");
    await loadJadwalPublikasi();
  } catch (error) {
    console.error("Gagal menyimpan jadwal publikasi:", error);
    setPesanPublikasi(
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat menyimpan jadwal."
    );
  } finally {
    setLoadingBacaPublikasi(false);
  }
};


const loadJadwalPublikasi = async () => {
  setLoadingPublikasi(true);

  const formatTanggal = (date: Date) => {
    const tahun = date.getFullYear();
    const bulan = String(date.getMonth() + 1).padStart(2, "0");
    const hari = String(date.getDate()).padStart(2, "0");

    return `${tahun}-${bulan}-${hari}`;
  };

  const hariIniDate = new Date();
  const besokDate = new Date(hariIniDate);
  besokDate.setDate(besokDate.getDate() + 1);

  const tanggalHariIni = formatTanggal(hariIniDate);
  const tanggalBesok = formatTanggal(besokDate);

  try {
    const response = await fetch("/api/jadwal-piket-publikasi", {
      method: "GET",
      cache: "no-store",
    });

    const hasil = await response.json();

    if (!response.ok || !hasil.success) {
      console.error(
        "Gagal memuat jadwal publikasi:",
        hasil.error
      );
      return;
    }

const semuaJadwal = hasil.data ?? [];

setJadwalPublikasi(semuaJadwal);

// Isi jadwal hari ini
setJadwalPublikasiHariIni(
  semuaJadwal.find(
    (item: any) => item.tanggal === tanggalHariIni
  ) ?? null
);

// Isi jadwal besok
setJadwalPublikasiBesok(
  semuaJadwal.find(
    (item: any) => item.tanggal === tanggalBesok
  ) ?? null
);

  } catch (error) {
    console.error(
      "Kesalahan memuat jadwal publikasi:",
      error
    );
  } finally {
    setLoadingPublikasi(false);
  }
};

useEffect(() => {
  loadJadwalPublikasi();
}, []);
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
const itemsPosisi = await bacaPdfPublikasiDenganPosisi(file);

console.table(
  itemsPosisi.map((item) => ({
    halaman: item.halaman,
    x: item.x,
    y: item.y,
    teks: item.text,
  }))
);
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
const itemsPosisi = await bacaPdfPublikasiDenganPosisi(file);

console.log("PEMERIKSAAN KOORDINAT 3 NOVEMBER:");

console.table(
  itemsPosisi
    .filter(
      (item) =>
        item.halaman === 1 &&
        item.y >= 700 &&
        item.y <= 740
    )
    .map((item) => ({
      halaman: item.halaman,
      x: item.x,
      y: item.y,
      teks: item.text,
    }))
);
    setTeksPdfPelayanan(teks);
console.log("=== TEKS PDF MENTAH PELAYANAN ===");
console.log(teks);
   const hasil = parseJadwalPelayanan(itemsPosisi);

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

      {/* =====================================================
        Jadwal Piket Publikasi November 2026
      ====================================================== */}

      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <CalendarDays className="text-blue-700" size={24} />

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Jadwal Piket Publikasi November 2026
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Pembaharuan Piket Pembuatan Berita, Infografis,
              dan Videografis Bulan November 2026.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileUp className="text-blue-700" size={22} />
            <h3 className="font-bold text-gray-800">
              Impor Jadwal dari PDF
            </h3>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            Khusus Admin. Pilih PDF jadwal piket publikasi Oktober 2026 untuk membaca dan memeriksa datanya.
          </p>

          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFilePublikasiChange}
            disabled={loadingBacaPublikasi}
            className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-700 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-blue-800 disabled:opacity-50"
          />

          {loadingBacaPublikasi && (
            <p className="mt-3 flex items-center gap-2 text-sm text-blue-700">
              <Loader2 size={18} className="animate-spin" />
              Sedang membaca PDF...
            </p>
          )}

          {pesanPublikasi && (
            <p className="mt-3 text-sm text-gray-700">
              {pesanPublikasi}
            </p>
          )}

          {previewPublikasi.length > 0 && (
            <>
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <div className="border-b bg-gray-50 px-4 py-3">
                <p className="font-semibold text-gray-800">
                  Pratinjau Hasil Pembacaan PDF
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {previewPublikasi.length} baris terbaca. Periksa tanggal
                  dan nama petugas sebelum data disimpan.
                </p>
              </div>

              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Tanggal</th>
                    <th className="p-3 text-left">Fotografer</th>
                    <th className="p-3 text-left">Videografer</th>
                    <th className="p-3 text-left">Pembuat Konten 1*</th>
                    <th className="p-3 text-left">Pembuat Konten 2*</th>
                  </tr>
                </thead>
                <tbody>
                  {previewPublikasi.map((item) => (
                    <tr key={item.tanggal} className="border-t">
                      <td className="p-3 whitespace-nowrap">
                        {formatTanggalIndonesia(item.tanggal)}
                      </td>
                      <td className="p-3">{item.fotografer || "-"}</td>
                      <td className="p-3">{item.videografer || "-"}</td>
                      <td className="p-3">
                        {item.pembuat_konten_1 || "-"}
                      </td>
                      <td className="p-3">
                        {item.pembuat_konten_2 || "-"}
                      </td>
                    </tr>
                  ))}

        </tbody>
      </table>
    </div>

    <div className="mt-4 flex justify-end">
      <button
        type="button"
      disabled={
  previewPublikasi.length !== 30 ||
  loadingBacaPublikasi
}onClick={handleSimpanPublikasi}
        className="rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Simpan Jadwal ke Database
      </button>
    </div>
            </>
  )}



        </div>

        <div className="mt-6">
          {loadingPublikasi ? (
            <div className="py-10 flex items-center justify-center gap-3 text-blue-600">
              <Loader2 size={22} className="animate-spin" />
              <span>Memuat jadwal piket publikasi...</span>
            </div>
          ) : jadwalPublikasi.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <CalendarDays
                size={36}
                className="mx-auto text-gray-400 mb-3"
              />
              <p className="font-semibold text-gray-600">
                Data jadwal publikasi Oktober 2026 belum tersedia
                atau belum dapat dibaca dari database.
              </p>
            </div>
          ) : (
            <div className="border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left">No.</th>
                      <th className="px-4 py-3 text-left">Tanggal</th>
                      <th className="px-4 py-3 text-left">Fotografer</th>
                      <th className="px-4 py-3 text-left">Videografer</th>
                      <th className="px-4 py-3 text-left">
                        Pembuat Konten 1*
                      </th>
                      <th className="px-4 py-3 text-left">
                        Pembuat Konten 2*
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {jadwalPublikasi.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-t hover:bg-blue-50"
                      >
                        <td className="px-4 py-3 text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-semibold">
                          {formatTanggalIndonesia(item.tanggal)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.fotografer || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.videografer || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.pembuat_konten_1 || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.pembuat_konten_2 || "-"}
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

