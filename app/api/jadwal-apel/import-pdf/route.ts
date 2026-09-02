import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const LOKASI_APEL =
  "Halaman Ghriya Abhipraya Bapas Kelas I Jakarta Barat";

const JAM_APEL = "08:00";

const daftarBulan: Record<string, string> = {
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

const daftarHari = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

function bersihkanTeks(teks: string) {
  return teks
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function hapusHari(teks: string) {
  let hasil = teks;

  for (const hari of daftarHari) {
    hasil = hasil.replace(
      new RegExp(`^${hari},\\s*`, "i"),
      ""
    );
  }

  return hasil.trim();
}

function parseTanggal(baris: string) {
  const teks = hapusHari(bersihkanTeks(baris));

  const match = teks.match(
    /^(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})$/i
  );

  if (!match) return null;

  const [, tanggal, namaBulan, tahun] = match;

  const bulan = daftarBulan[namaBulan];

  if (!bulan) return null;

  return `${tahun}-${bulan}-${tanggal.padStart(2, "0")}`;
}

/**
 * Memisahkan baris petugas.
 *
 * Format PDF:
 *
 * 1. Nama Jabatan Keterangan
 *
 * Karena jabatan dapat terdiri dari beberapa kata,
 * kita mengenali tugas dari daftar tugas yang sudah pasti.
 */
function parsePetugas(baris: string) {
  const teks = bersihkanTeks(baris);

 const matchNomor = teks.match(/^(\d+)\.?\s+(.+)$/);

  if (!matchNomor) return null;

  const nomor = Number(matchNomor[1]);
  let isi = matchNomor[2].trim();

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

  let tugas: string | null = null;

  for (const kandidat of daftarTugas) {
    if (isi.endsWith(kandidat)) {
      tugas = kandidat;
      isi = isi
        .slice(0, isi.length - kandidat.length)
        .trim();
      break;
    }
  }

  if (!tugas) {
    return null;
  }

  /*
   * Untuk sementara kita pisahkan Nama dan Jabatan
   * menggunakan data jabatan yang umum muncul pada PDF.
   */
  const jabatanKhusus = [
    "PK Madya",
    "PK Muda",
    "PK Pertama",
    "Kasi BKA",
    "Kasi BKD",
    "Kabapas",
    "Kaur Umum",
    "Kasubbag Tata Usaha",
    "Kasubsi Registrasi Dewasa",
    "Kasubsi Bimker Anak",
    "Kasubsi Bimkemas Dewasa",
    "Petugas Jaga",
    "Pengadministrasi Perkant.",
    "Pengolah Data dan Inform.",
    "Penata Layanan Op.",
    "Pengelola Lay. Pengadaan",
    "Arsiparis Pertama",
  ];

  let jabatan = "";
  let nama = isi;

  /*
   * Cari jabatan yang berada di akhir bagian
   * sebelum tugas.
   */
  for (const kandidat of jabatanKhusus) {
    if (isi.endsWith(kandidat)) {
      jabatan = kandidat;
      nama = isi
        .slice(0, isi.length - kandidat.length)
        .trim();
      break;
    }
  }

  /*
   * Jika jabatan tidak ditemukan, kita tetap simpan
   * seluruh isi sebagai nama agar data tidak hilang.
   */
  if (!nama) {
    nama = isi;
  }

  return {
    nomor,
    nama_petugas: nama,
    jabatan: jabatan || null,
    tugas,
  };
}

function ekstrakJadwal(teks: string) {
  const baris = teks
    .split("\n")
    .map((b) => bersihkanTeks(b))
    .filter(Boolean);

  const hasil: Array<{
    tanggal: string;
    nama_petugas: string;
    jabatan: string | null;
    tugas: string;
    jam_apel: string;
    lokasi: string;
    aktif: boolean;
  }> = [];

  let tanggalAktif: string | null = null;

  for (const barisSekarang of baris) {
    const tanggal = parseTanggal(barisSekarang);

    if (tanggal) {
      tanggalAktif = tanggal;
      continue;
    }

    if (!tanggalAktif) {
      continue;
    }

    /*
     * Lewati header tabel.
     */
    if (
      /^No\.\s+Nama\s+Jabatan\s+Keterangan$/i.test(
        barisSekarang
      )
    ) {
      continue;
    }

    /*
     * Lewati bagian footer/dokumen.
     */
    if (
      barisSekarang.includes(
        "Dokumen ini telah ditandatangani"
      ) ||
      barisSekarang.includes("sertifikat elektronik") ||
      barisSekarang.includes("Balai Besar Sertifikasi Elektronik") ||
      barisSekarang.includes("Badan Siber dan Sandi Negara") ||
      barisSekarang.includes("A - DINAS") ||
      barisSekarang.startsWith("Nomor :")
    ) {
      continue;
    }

    const petugas = parsePetugas(barisSekarang);

    if (!petugas) {
      continue;
    }

    hasil.push({
      tanggal: tanggalAktif,
      nama_petugas: petugas.nama_petugas,
      jabatan: petugas.jabatan,
      tugas: petugas.tugas,
      jam_apel: JAM_APEL,
      lokasi: LOKASI_APEL,
      aktif: true,
    });
  }

  return hasil;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const teks = body?.text;

    if (!teks || typeof teks !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Teks PDF tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    const hasil = ekstrakJadwal(teks);

    if (hasil.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tidak ditemukan data jadwal apel dari PDF.",
        },
        { status: 400 }
      );
    }

    /*
     * Hapus jadwal lama untuk tanggal yang sama,
     * sehingga upload ulang tidak menghasilkan duplikasi.
     */
    const tanggalUnik = [
      ...new Set(hasil.map((item) => item.tanggal)),
    ];

    for (const tanggal of tanggalUnik) {
      const { error: deleteError } = await supabase
        .from("jadwal_apel")
        .delete()
        .eq("tanggal", tanggal);

      if (deleteError) {
        console.error(
          "Gagal menghapus jadwal lama:",
          deleteError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Gagal membersihkan jadwal lama.",
            error: deleteError.message,
          },
          { status: 500 }
        );
      }
    }

    const { data, error } = await supabase
      .from("jadwal_apel")
      .insert(hasil)
      .select();

    if (error) {
      console.error(
        "Gagal insert jadwal apel:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal menyimpan jadwal apel ke database.",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${hasil.length} data jadwal apel.`,
      jumlah: hasil.length,
      tanggal: tanggalUnik.length,
      data,
    });
  } catch (error) {
    console.error("IMPORT JADWAL APEL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat import jadwal apel.",
      },
      { status: 500 }
    );
  }
}