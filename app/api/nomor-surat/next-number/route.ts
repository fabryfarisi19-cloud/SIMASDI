import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthenticatedUser } from "@/lib/authenticated-user";

function isAdminNomorSurat(role: string) {
  const roleNormal = String(role || "")
    .toLowerCase()
    .trim();

  return [
    "admin",
    "kaur umum",
    "pimpinan",
  ].includes(roleNormal);
}

export async function GET(
  request: NextRequest
) {
  try {
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

    if (!isAdminNomorSurat(user.role)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda tidak memiliki hak untuk melihat nomor register.",
        },
        { status: 403 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const kode_unit =
      searchParams.get("kode_unit");

    const klasifikasi =
      searchParams.get("klasifikasi");

    const kode_angka_1 =
      searchParams.get("kode_angka_1");

    const kode_angka_2 =
      searchParams.get("kode_angka_2");

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

    /*
     * Ambil seluruh nomor urut yang sudah diberikan
     * untuk kombinasi kode surat yang sama.
     *
     * Kita tidak menggunakan nomor_surat untuk
     * menentukan nomor berikutnya.
     *
     * Sumber utama adalah kolom no_urut.
     */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("permintaan_nomor_surat")
      .select("no_urut")
      .eq(
        "kode_unit",
        kode_unit
      )
      .eq(
        "klasifikasi",
        klasifikasi
      )
      .eq(
        "kode_angka_1",
        kode_angka_1
      )
      .eq(
        "kode_angka_2",
        kode_angka_2
      )
      .eq(
        "status",
        "DIBERIKAN"
      )
      .not(
        "no_urut",
        "is",
        null
      );

    if (error) {
      console.error(
        "GAGAL CEK NOMOR REGISTER:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil nomor register terakhir.",
        },
        { status: 500 }
      );
    }

    let nomorTerakhir = 0;

    for (const item of data || []) {
      const angka =
        Number(item.no_urut);

      if (
        Number.isInteger(angka) &&
        angka > nomorTerakhir
      ) {
        nomorTerakhir = angka;
      }
    }

    const nomorBerikutnya =
      nomorTerakhir + 1;

    return NextResponse.json({
      success: true,

      data: {
        nomor_terakhir:
          nomorTerakhir,

        nomor_berikutnya:
          nomorBerikutnya,
      },
    });
  } catch (error: any) {
    console.error(
      "GET /api/nomor-surat/next-number:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Terjadi kesalahan server.",
      },
      { status: 500 }
    );
  }
}