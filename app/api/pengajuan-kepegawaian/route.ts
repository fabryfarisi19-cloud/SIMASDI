
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function getWaktuJakarta() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const nilai = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return {
    tahun: Number(nilai.year),
    bulan: Number(nilai.month),
    tanggal: Number(nilai.day),
    jam: Number(nilai.hour),
    menit: Number(nilai.minute),
    detik: Number(nilai.second),
  };
}

function periksaJadwal() {
  const sekarang = getWaktuJakarta();
  const { tanggal, jam } = sekarang;

  const sudahLewatBatasTanggal13 =
    tanggal === 13 && jam >= 11;

  const belumWaktuBukaTanggal16 =
    tanggal === 16 && jam < 9;

  const hariTutup = tanggal === 14 || tanggal === 15;

  const terbuka =
    !sudahLewatBatasTanggal13 &&
    !belumWaktuBukaTanggal16 &&
    !hariTutup;

  return { sekarang, terbuka };
}

export async function GET() {
  try {
    const { sekarang, terbuka } = periksaJadwal();

    const waktuWIB = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "long",
      timeStyle: "medium",
    }).format(new Date());

    return NextResponse.json(
      {
        success: true,
        terbuka,
        waktuWIB,
        tahun: sekarang.tahun,
        bulan: sekarang.bulan,
        tanggal: sekarang.tanggal,
        jadwal: {
          buka: "Tanggal 16 pukul 09.00 WIB",
          tutup: "Tanggal 13 pukul 11.00 WIB",
          tanggalDitutup: "Tanggal 14–15 setiap bulan",
        },
        pesan: terbuka
          ? "Pengajuan sedang dibuka."
          : "Pengajuan sedang ditutup. Silakan periksa jadwal pengajuan.",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Gagal memeriksa jadwal pengajuan:", error);

    return NextResponse.json(
      {
        success: false,
        terbuka: false,
        error: "Jadwal pengajuan gagal diperiksa.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 1. Periksa sesi login.
    const session = await getServerSession(authOptions);

    if (!session?.penggunaId) {
      return NextResponse.json(
        { success: false, error: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const penggunaId = Number(session.penggunaId);

    if (!Number.isSafeInteger(penggunaId) || penggunaId <= 0) {
      return NextResponse.json(
        { success: false, error: "ID pengguna tidak valid." },
        { status: 401 }
      );
    }

    // 2. Ambil identitas dan status langsung dari database.
    const { data: pengguna, error: penggunaError } =
      await supabaseAdmin
        .from("pengguna")
        .select("id, nama, username, status")
        .eq("id", penggunaId)
        .maybeSingle();

    if (penggunaError) {
      console.error("Gagal memeriksa pengguna:", penggunaError);

      return NextResponse.json(
        { success: false, error: "Gagal memeriksa akun pengguna." },
        { status: 500 }
      );
    }

    if (
      !pengguna ||
      String(pengguna.status || "").trim().toLowerCase() !== "aktif"
    ) {
      return NextResponse.json(
        { success: false, error: "Akun tidak ditemukan atau tidak aktif." },
        { status: 403 }
      );
    }

    // 3. Periksa jadwal kembali di server.
    const { terbuka } = periksaJadwal();

    if (!terbuka) {
      return NextResponse.json(
        {
          success: false,
          error: "Pengajuan sedang ditutup sesuai jadwal.",
        },
        { status: 403 }
      );
    }

    // 4. Baca dan validasi data formulir.
    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Data formulir tidak valid." },
        { status: 400 }
      );
    }

    const jenisPengajuan = body.jenisPengajuan;
    const tanggalMulai = body.tanggalMulai;
    const tanggalSelesai = body.tanggalSelesai;
    const keterangan =
      typeof body.keterangan === "string" ? body.keterangan.trim() : "";

    const jenisDiizinkan = [
      "DINAS_LUAR",
      "LEPAS_PIKET",
      "IZIN",
      "CUTI",
    ];

    if (
      typeof jenisPengajuan !== "string" ||
      !jenisDiizinkan.includes(jenisPengajuan)
    ) {
      return NextResponse.json(
        { success: false, error: "Jenis pengajuan tidak valid." },
        { status: 400 }
      );
    }

    function tanggalValid(value: unknown): value is string {
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }

      const date = new Date(`${value}T00:00:00.000Z`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    }

    if (
      !tanggalValid(tanggalMulai) ||
      !tanggalValid(tanggalSelesai) ||
      tanggalSelesai < tanggalMulai
    ) {
      return NextResponse.json(
        { success: false, error: "Rentang tanggal pengajuan tidak valid." },
        { status: 400 }
      );
    }

    if (!keterangan || keterangan.length > 3000) {
      return NextResponse.json(
        {
          success: false,
          error: "Keterangan wajib diisi dan maksimal 3000 karakter.",
        },
        { status: 400 }
      );
    }

    // 5. Simpan menggunakan identitas akun dari database.
    const { data: pengajuan, error: simpanError } =
      await supabaseAdmin
        .from("pengajuan_kepegawaian")
        .insert({
          pengguna_id: String(pengguna.id),
          nama_pegawai: pengguna.nama,
          nip: pengguna.username,
          jenis_pengajuan: jenisPengajuan,
          tanggal_mulai: tanggalMulai,
          tanggal_selesai: tanggalSelesai,
          keterangan,
        })
        .select(
          "id, jenis_pengajuan, tanggal_mulai, tanggal_selesai, dibuat_pada"
        )
        .single();

    if (simpanError) {
      console.error("Gagal menyimpan pengajuan:", simpanError);

      return NextResponse.json(
        { success: false, error: "Pengajuan gagal disimpan." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pengajuan berhasil disimpan.",
        data: pengajuan,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API pengajuan-kepegawaian error:", error);

    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
