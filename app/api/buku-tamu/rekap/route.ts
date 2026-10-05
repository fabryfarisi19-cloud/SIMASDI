import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type JenisPengunjung =
  | "KLIEN_DEWASA"
  | "KLIEN_ANAK"
  | "TAMU_DINAS";

const JENIS_VALID = [
  "SEMUA",
  "KLIEN_DEWASA",
  "KLIEN_ANAK",
  "TAMU_DINAS",
] as const;
export async function GET(request: NextRequest) {
  try {
    // =====================================================
    // CEK LOGIN DAN HAK AKSES
    // Hanya Admin dan Petugas yang boleh melihat rekap
    // =====================================================

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda harus login untuk mengakses rekap Buku Tamu.",
        },
        { status: 401 }
      );
    }

    const sessionData = session as any;
    const user = sessionData?.user as any;

    const roleAsli =
      sessionData?.role ||
      user?.role ||
      user?.jabatan ||
      "";

    const role = String(roleAsli)
      .trim()
      .toLowerCase();

    const bolehAkses =
      role === "admin" ||
      role === "petugas";

    if (!bolehAkses) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Akses ditolak. Rekap Buku Tamu hanya dapat diakses oleh Admin dan Petugas.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const mode = searchParams.get("mode") || "hari";
    const tanggal = searchParams.get("tanggal");
    const bulan = searchParams.get("bulan");
    const tahun = searchParams.get("tahun");
    const jenis = searchParams.get("jenis") || "SEMUA";

    let tanggalMulai = "";
    let tanggalSelesai = "";

    /*
     * =====================================================
     * MODE HARI
     * =====================================================
     */
    if (mode === "hari") {
      const targetTanggal =
        tanggal ||
        new Date().toISOString().slice(0, 10);

      tanggalMulai = targetTanggal;
      tanggalSelesai = targetTanggal;
    }

    /*
     * =====================================================
     * MODE BULAN
     * =====================================================
     */
    else if (mode === "bulan") {
      const targetTahun =
        tahun ||
        new Date().getFullYear().toString();

      const targetBulan =
        bulan ||
        String(new Date().getMonth() + 1).padStart(
          2,
          "0"
        );

      const tahunAngka = Number(targetTahun);
      const bulanAngka = Number(targetBulan);

      if (
        !Number.isInteger(tahunAngka) ||
        tahunAngka < 2000 ||
        tahunAngka > 2100
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Tahun tidak valid.",
          },
          { status: 400 }
        );
      }

      if (
        !Number.isInteger(bulanAngka) ||
        bulanAngka < 1 ||
        bulanAngka > 12
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Bulan tidak valid.",
          },
          { status: 400 }
        );
      }

      tanggalMulai =
        `${tahunAngka}-${String(bulanAngka).padStart(
          2,
          "0"
        )}-01`;

      const hariTerakhir = new Date(
        tahunAngka,
        bulanAngka,
        0
      ).getDate();

      tanggalSelesai =
        `${tahunAngka}-${String(bulanAngka).padStart(
          2,
          "0"
        )}-${String(hariTerakhir).padStart(2, "0")}`;
    }

    /*
     * =====================================================
     * MODE TAHUN
     * =====================================================
     */
    else if (mode === "tahun") {
      const targetTahun =
        tahun ||
        new Date().getFullYear().toString();

      const tahunAngka = Number(targetTahun);

      if (
        !Number.isInteger(tahunAngka) ||
        tahunAngka < 2000 ||
        tahunAngka > 2100
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Tahun tidak valid.",
          },
          { status: 400 }
        );
      }

      tanggalMulai =
        `${tahunAngka}-01-01`;

      tanggalSelesai =
        `${tahunAngka}-12-31`;
    }

    /*
     * =====================================================
     * MODE TIDAK VALID
     * =====================================================
     */
    else {
      return NextResponse.json(
        {
          success: false,
          message:
            "Mode rekap harus hari, bulan, atau tahun.",
        },
        { status: 400 }
      );
    }

    /*
     * =====================================================
     * VALIDASI JENIS PENGUNJUNG
     * =====================================================
     */
    if (
      !JENIS_VALID.includes(
        jenis as (typeof JENIS_VALID)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Jenis pengunjung tidak valid.",
        },
        { status: 400 }
      );
    }

    /*
     * =====================================================
     * QUERY SUPABASE
     * =====================================================
     */
    let query = supabaseAdmin
      .from("buku_tamu")
      .select(`
        id,
        nomor_kunjungan,
        tanggal_kunjungan,
        jam_kunjungan,
        jenis_pengunjung,
        nama,
        nik,
        no_hp,
        alamat,
        instansi,
        jabatan,
        jenis_keperluan,
        keperluan,
        bertemu_dengan,
        jabatan_tujuan
      `)
      .gte(
        "tanggal_kunjungan",
        tanggalMulai
      )
      .lte(
        "tanggal_kunjungan",
        tanggalSelesai
      )
      .order("tanggal_kunjungan", {
        ascending: false,
      })
      .order("jam_kunjungan", {
        ascending: false,
      });

    /*
     * =====================================================
     * FILTER JENIS
     * =====================================================
     */
    if (jenis !== "SEMUA") {
      query = query.eq(
        "jenis_pengunjung",
        jenis
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "Error query rekap Buku Tamu:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    const hasil = data || [];

    /*
     * =====================================================
     * HITUNG STATISTIK
     * =====================================================
     */
    const total = hasil.length;

    const klienDewasa = hasil.filter(
      (item) =>
        item.jenis_pengunjung ===
        "KLIEN_DEWASA"
    ).length;

    const klienAnak = hasil.filter(
      (item) =>
        item.jenis_pengunjung ===
        "KLIEN_ANAK"
    ).length;

    const tamuDinas = hasil.filter(
      (item) =>
        item.jenis_pengunjung ===
        "TAMU_DINAS"
    ).length;

    /*
     * =====================================================
     * RESPONSE
     * =====================================================
     */
    return NextResponse.json({
      success: true,

      filter: {
        mode,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        jenis,
      },

      statistik: {
        total,
        klien_dewasa: klienDewasa,
        klien_anak: klienAnak,
        tamu_dinas: tamuDinas,
      },

      data: hasil,
    });
  } catch (error) {
    console.error(
      "Error API rekap Buku Tamu:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat mengambil rekap Buku Tamu.",
      },
      { status: 500 }
    );
  }
}