import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

  const namaBulanNormal = Object.keys(daftarBulan).find(
    (bulan) =>
      bulan.toLowerCase() === namaBulan.toLowerCase()
  );

  if (!namaBulanNormal) return null;

  const bulan = daftarBulan[namaBulanNormal];

  return `${tahun}-${bulan}-${tanggal.padStart(2, "0")}`;
}

function parseBarisPetugas(baris: string) {
  const teks = bersihkanTeks(baris);

  const matchNomor = teks.match(/^(\d+)\.\s+(.+)$/);

  if (!matchNomor) return null;

  const nomor = Number(matchNomor[1]);

  // Hanya membaca nomor 1 sampai 9 sebagai baris petugas.
  if (nomor < 1 || nomor > 9) return null;

  let isi = matchNomor[2].trim();

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

  if (!tugas) return null;

  let jabatan = "";
  let nama = isi;

  // Jabatan yang lebih panjang dicoba terlebih dahulu.
  const jabatanTerurut = [...daftarJabatan].sort(
    (a, b) => b.length - a.length
  );

  for (const kandidat of jabatanTerurut) {
    if (isi.endsWith(kandidat)) {
      jabatan = kandidat;

      nama = isi
        .slice(0, isi.length - kandidat.length)
        .trim();

      break;
    }
  }

  if (!nama) return null;

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
// Berhenti ketika sudah masuk bagian catatan/footer PDF.
if (
  /^\*?Catatan\s*:?\s*$/i.test(barisSekarang) ||
  /^Format Laporan Atensi Apel$/i.test(barisSekarang)
) {
  break;
}
    // Header tabel
    if (
      /^No\.\s+Nama\s+Jabatan\s+Keterangan$/i.test(
        barisSekarang
      )
    ) {
      continue;
    }

    // Footer / tanda tangan elektronik
    if (
      barisSekarang.includes(
        "Dokumen ini telah ditandatangani"
      ) ||
      barisSekarang.includes("sertifikat elektronik") ||
      barisSekarang.includes(
        "Balai Besar Sertifikasi Elektronik"
      ) ||
      barisSekarang.includes(
        "Badan Siber dan Sandi Negara"
      ) ||
      barisSekarang.includes("A - DINAS") ||
      barisSekarang.startsWith("Nomor :")
    ) {
      continue;
    }

    const petugas = parseBarisPetugas(barisSekarang);

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

    console.log(
      "IMPORT JADWAL APEL - jumlah data:",
      hasil.length
    );

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

    // September 2026:
    // 22 tanggal x 9 petugas = 198 data.
    if (hasil.length !== 198) {
      console.error(
        `JUMLAH DATA TIDAK SESUAI: ${hasil.length}`
      );

      return NextResponse.json(
        {
          success: false,
          message: `Hasil pembacaan PDF adalah ${hasil.length} data, seharusnya 198 data.`,
          jumlah: hasil.length,
        },
        { status: 400 }
      );
    }

    const tanggalUnik = [
      ...new Set(
        hasil.map((item) => item.tanggal)
      ),
    ];

    // Hapus data lama untuk tanggal yang akan di-import.
    for (const tanggal of tanggalUnik) {
      console.log(
        "HAPUS DATA LAMA UNTUK TANGGAL:",
        tanggal
      );

      const { error: deleteError } =
        await supabaseAdmin
          .from("jadwal_apel")
          .delete()
          .eq("tanggal", tanggal)
          .select("id");

      if (deleteError) {
        console.error(
          "ERROR DELETE JADWAL APEL:",
          deleteError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Gagal membersihkan jadwal lama.",
            error: deleteError.message,
            detail: deleteError.details,
            hint: deleteError.hint,
            code: deleteError.code,
          },
          { status: 500 }
        );
      }
    }

    console.log(
      "AKAN INSERT JADWAL APEL:",
      hasil.length
    );

    console.log(
      "CONTOH DATA INSERT:",
      hasil[0]
    );

    const {
      data,
      error: insertError,
    } = await supabaseAdmin
      .from("jadwal_apel")
      .insert(hasil)
      .select();

    if (insertError) {
      console.error(
        "ERROR INSERT JADWAL APEL:",
        insertError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal menyimpan jadwal apel ke database.",
          error: insertError.message,
          detail: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
        },
        { status: 500 }
      );
    }

    console.log(
      "BERHASIL INSERT JADWAL APEL:",
      data?.length ?? 0
    );

    return NextResponse.json({
      success: true,
      message:
        `Berhasil mengimpor ${hasil.length} data jadwal apel.`,
      jumlah: data?.length ?? 0,
      tanggal: tanggalUnik.length,
      data,
    });
  } catch (error) {
    console.error(
      "IMPORT JADWAL APEL ERROR:",
      error
    );

    const pesanError =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        success: false,
        message: pesanError,
        error: pesanError,
      },
      { status: 500 }
    );
  }
}