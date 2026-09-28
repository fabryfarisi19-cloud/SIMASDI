import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthenticatedUser } from "@/lib/authenticated-user";

function isAdminNomorSurat(role: string) {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();

  return [
    "admin",
    "kaur umum",
    "pimpinan",
  ].includes(normalized);
}

/**
 * ============================================================
 * GET
 * ============================================================
 */
export async function GET(request: Request) {
  try {
    /**
     * Ambil identitas dari NextAuth.
     *
     * TIDAK menggunakan header dari browser.
     */
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sesi autentikasi tidak valid atau akun tidak aktif.",
        },
        { status: 401 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    /**
     * ========================================================
     * MASTER KODE
     * ========================================================
     */
    if (
      searchParams.get("master") === "true"
    ) {
      const { data, error } =
        await supabaseAdmin
          .from("master_kode_surat")
          .select(
            `
            id,
            kode_unit,
            klasifikasi,
            kode_angka_1,
            kode_angka_2,
            keterangan,
            aktif
            `
          )
          .eq("aktif", true)
          .order("kode_unit")
          .order("klasifikasi")
          .order("kode_angka_1")
          .order("kode_angka_2");

      if (error) {
        console.error(
          "Gagal mengambil master kode:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Gagal mengambil master kode surat.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    /**
     * ========================================================
     * PERMINTAAN NOMOR SURAT
     * ========================================================
     */
    let query = supabaseAdmin
      .from("permintaan_nomor_surat")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    /**
     * Admin dapat melihat seluruh permintaan.
     *
     * Pengguna biasa HANYA dapat melihat miliknya sendiri.
     */
    if (!isAdminNomorSurat(user.role)) {
      query = query.eq(
        "pengguna_id",
        user.id
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "Gagal mengambil permintaan nomor surat:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil data permintaan nomor surat.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error(
      "GET /api/nomor-surat:",
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

/**
 * ============================================================
 * POST
 * ============================================================
 */
export async function POST(request: Request) {
  try {
    /**
     * ========================================================
     * AUTENTIKASI SERVER-SIDE
     * ========================================================
     */
    const user =
      await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sesi autentikasi tidak valid atau akun tidak aktif.",
        },
        { status: 401 }
      );
    }

    /**
     * Admin tidak mengajukan nomor surat melalui
     * endpoint pegawai.
     */
    if (isAdminNomorSurat(user.role)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Akun ini tidak menggunakan menu pengajuan nomor surat pegawai.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    /**
     * ========================================================
     * DATA FORM
     * ========================================================
     *
     * Identity TIDAK diambil dari body.
     */
    const {
      kode_unit,
      klasifikasi,
      kode_angka_1,
      kode_angka_2,
      no_reg_litmas,
      tanggal_surat,
      sifat_surat,
      perihal,
      dari_pemilik_surat,
      kepada,
      keterangan,
      operator,
      status_srikandi,
    } = body;

    if (
      !kode_unit ||
      !klasifikasi ||
      !kode_angka_1 ||
      !kode_angka_2
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kode surat belum lengkap.",
        },
        { status: 400 }
      );
    }

    if (!tanggal_surat) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tanggal surat wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!perihal) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Perihal surat wajib diisi.",
        },
        { status: 400 }
      );
    }

    /**
     * ========================================================
     * VALIDASI MASTER KODE
     * ========================================================
     */
    const { data: master, error: masterError } =
      await supabaseAdmin
        .from("master_kode_surat")
        .select(
          `
          id,
          kode_unit,
          klasifikasi,
          kode_angka_1,
          kode_angka_2,
          aktif
          `
        )
        .eq("kode_unit", kode_unit)
        .eq("klasifikasi", klasifikasi)
        .eq("kode_angka_1", kode_angka_1)
        .eq("kode_angka_2", kode_angka_2)
        .eq("aktif", true)
        .maybeSingle();

    if (masterError) {
      console.error(
        "Gagal memeriksa master kode:",
        masterError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal memeriksa kode surat.",
        },
        { status: 500 }
      );
    }

    if (!master) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kode surat tidak ditemukan atau sudah tidak aktif.",
        },
        { status: 400 }
      );
    }

    /**
     * ========================================================
     * CEK PERMINTAAN MENUNGGU
     * ========================================================
     */
    const { data: pending } =
      await supabaseAdmin
        .from("permintaan_nomor_surat")
        .select("id")
        .eq("pengguna_id", user.id)
        .eq("status", "MENUNGGU")
        .maybeSingle();

    if (pending) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda masih memiliki permintaan nomor surat yang sedang menunggu.",
        },
        { status: 409 }
      );
    }

    /**
     * ========================================================
     * INSERT
     * ========================================================
     *
     * Identitas diambil dari session/database.
     * Client tidak dapat mengganti nama/NIP/role pemohon.
     */
    const payload = {
      pengguna_id: user.id,

      username: user.username,

      nama_pengguna: user.nama,

      jabatan: user.role,

      no_reg_litmas:
        no_reg_litmas || null,

      tanggal_surat,

      sifat_surat:
        sifat_surat || null,

      perihal,

      dari_pemilik_surat:
        dari_pemilik_surat ||
        user.nama,

      kepada:
        kepada || null,

      keterangan:
        keterangan || null,

      kode_unit,

      klasifikasi,

      kode_angka_1,

      kode_angka_2,

      /**
       * PENTING:
       * no_urut TIDAK dibuat otomatis.
       */
      no_urut: null,

      nomor_surat: null,

      operator:
        operator || null,

      status_srikandi:
        status_srikandi || null,

      status: "MENUNGGU",

      catatan_admin: null,

      diberikan_oleh_id: null,

      diberikan_oleh_username: null,

      diberikan_oleh_nama: null,

      diberikan_at: null,
    };

    const { data, error } =
      await supabaseAdmin
        .from("permintaan_nomor_surat")
        .insert(payload)
        .select("*")
        .single();
if (error) {
  console.error(
    "Gagal menyimpan permintaan nomor surat:",
    error
  );

  return NextResponse.json(
    {
      success: false,
      message:
        error.message ||
        "Gagal menyimpan permintaan nomor surat.",
      error_code: error.code || null,
      error_details: error.details || null,
      error_hint: error.hint || null,
    },
    { status: 500 }
  );
}

    return NextResponse.json(
      {
        success: true,
        message:
          "Permintaan nomor surat berhasil diajukan.",
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/nomor-surat:",
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