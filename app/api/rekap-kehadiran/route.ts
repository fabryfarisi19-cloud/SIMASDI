import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// =========================================================
// ROLE YANG DIIZINKAN
// =========================================================
const ROLE_ALLOWED = "Pengelola Kepegawaian";

// =========================================================
// GET
// /api/rekap-kehadiran
//
// Query:
// ?tanggal_mulai=2026-10-01
// &tanggal_selesai=2026-10-31
// &pengguna_id=79
// =========================================================
export async function GET(request: NextRequest) {
  try {
    // -----------------------------------------------------
    // 1. Cek session
    // -----------------------------------------------------
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda belum login.",
        },
        { status: 401 }
      );
    }

    // -----------------------------------------------------
    // 2. Ambil role dari session
    // -----------------------------------------------------
    const user = session.user as any;

    const role = String(user.role || "").trim();

    // -----------------------------------------------------
    // 3. Hanya Pengelola Kepegawaian
    // -----------------------------------------------------
    if (role !== ROLE_ALLOWED) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Akses ditolak. Rekap Kehadiran hanya dapat diakses oleh Pengelola Kepegawaian.",
        },
        { status: 403 }
      );
    }

    // -----------------------------------------------------
    // 4. Ambil parameter
    // -----------------------------------------------------
    const searchParams = request.nextUrl.searchParams;

    const tanggalMulai =
      searchParams.get("tanggal_mulai");

    const tanggalSelesai =
      searchParams.get("tanggal_selesai");

    const penggunaId =
      searchParams.get("pengguna_id");

    // -----------------------------------------------------
    // 5. Validasi tanggal
    // -----------------------------------------------------
    if (!tanggalMulai || !tanggalSelesai) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Parameter tanggal_mulai dan tanggal_selesai wajib diisi.",
        },
        { status: 400 }
      );
    }

    const tanggalRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (
      !tanggalRegex.test(tanggalMulai) ||
      !tanggalRegex.test(tanggalSelesai)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Format tanggal harus YYYY-MM-DD.",
        },
        { status: 400 }
      );
    }

    if (tanggalMulai > tanggalSelesai) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tanggal mulai tidak boleh lebih besar dari tanggal selesai.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------------------
    // 6. Query absensi
    // -----------------------------------------------------
    let query = supabaseAdmin
      .from("absensi_finger")
      .select(`
        id,
        pengguna_id,
        tanggal,
        jam_masuk,
        jam_pulang,

        latitude_masuk,
        longitude_masuk,
        akurasi_masuk,
        jarak_masuk,

        latitude_pulang,
        longitude_pulang,
        akurasi_pulang,
        jarak_pulang,

        status,
        keterangan,

        created_at,
        updated_at
      `)
      .gte("tanggal", tanggalMulai)
      .lte("tanggal", tanggalSelesai)
      .order("tanggal", {
        ascending: true,
      });

    // -----------------------------------------------------
    // 7. Filter pegawai jika dipilih
    // -----------------------------------------------------
    if (penggunaId) {
      const idNumber = Number(penggunaId);

      if (!Number.isInteger(idNumber)) {
        return NextResponse.json(
          {
            success: false,
            message: "pengguna_id tidak valid.",
          },
          { status: 400 }
        );
      }

      query = query.eq(
        "pengguna_id",
        idNumber
      );
    }

    const {
      data: absensi,
      error: absensiError,
    } = await query;

    if (absensiError) {
      console.error(
        "REKAP KEHADIRAN ERROR:",
        absensiError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil data rekap kehadiran.",
        },
        { status: 500 }
      );
    }

    // -----------------------------------------------------
    // 8. Ambil daftar pengguna yang terkait
    // -----------------------------------------------------
    const penggunaIds = [
      ...new Set(
        (absensi || []).map(
          (item: any) => item.pengguna_id
        )
      ),
    ];

    let penggunaMap: Record<
      string,
      {
        id: number;
        nama: string;
        username: string;
        role: string;
      }
    > = {};

    if (penggunaIds.length > 0) {
      const {
        data: pengguna,
        error: penggunaError,
      } = await supabaseAdmin
        .from("pengguna")
        .select(`
          id,
          nama,
          username,
          role
        `)
        .in("id", penggunaIds);

      if (penggunaError) {
        console.error(
          "PENGGUNA REKAP ERROR:",
          penggunaError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Gagal mengambil data pegawai.",
          },
          { status: 500 }
        );
      }

      for (const item of pengguna || []) {
        penggunaMap[String(item.id)] = item;
      }
    }

    // -----------------------------------------------------
    // 9. Gabungkan data absensi + pegawai
    // -----------------------------------------------------
    const data = (absensi || []).map(
      (item: any) => {
        const pegawai =
          penggunaMap[
            String(item.pengguna_id)
          ];

        return {
          ...item,

          nama:
            pegawai?.nama ||
            "Pegawai tidak ditemukan",

          username:
            pegawai?.username || "",

          role:
            pegawai?.role || "",
        };
      }
    );

    // -----------------------------------------------------
    // 10. Statistik
    // -----------------------------------------------------
    const statistik = {
      total: data.length,

      hadir: data.filter(
        (item: any) =>
          String(item.status).toLowerCase() ===
          "hadir"
      ).length,

      terlambat: data.filter(
        (item: any) =>
          String(item.status).toLowerCase() ===
          "terlambat"
      ).length,

      izin: data.filter(
        (item: any) =>
          String(item.status).toLowerCase() ===
          "izin"
      ).length,

      sakit: data.filter(
        (item: any) =>
          String(item.status).toLowerCase() ===
          "sakit"
      ).length,

      tidak_hadir: data.filter(
        (item: any) =>
          String(item.status).toLowerCase() ===
          "tidak hadir"
      ).length,
    };

    // -----------------------------------------------------
    // 11. Response
    // -----------------------------------------------------
    return NextResponse.json({
      success: true,

      filter: {
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        pengguna_id:
          penggunaId || null,
      },

      statistik,

      total_data: data.length,

      data,
    });
  } catch (error) {
    console.error(
      "REKAP KEHADIRAN EXCEPTION:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}