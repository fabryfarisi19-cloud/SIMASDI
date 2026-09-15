import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.penggunaId) {
      return NextResponse.json(
        {
          success: false,
          error: "Sesi pengguna tidak ditemukan.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const data = Array.isArray(body?.data)
      ? body.data
      : [];

    if (data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Data jadwal pelayanan kosong.",
        },
        { status: 400 }
      );
    }

    const dataSimpan = data.map((item: any) => ({
      tanggal: item.tanggal,
      duta_layanan: item.duta_layanan || null,
      pelayanan_publik: item.pelayanan_publik || null,
      maganghub: item.maganghub || null,
      pengawas: item.pengawas || null,
      koordinator: item.koordinator || null,
      aktif: true,
    }));

    console.log(
      "=== SIMPAN JADWAL PELAYANAN ==="
    );
    console.log(
      "Pengguna ID:",
      session.penggunaId
    );
    console.log(
      "Jumlah data:",
      dataSimpan.length
    );

    const { data: hasil, error } =
      await supabaseAdmin
        .from("jadwal_pelayanan_publik")
        .upsert(dataSimpan, {
          onConflict: "tanggal",
        })
        .select();

    if (error) {
      console.error(
        "Gagal menyimpan jadwal pelayanan:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${dataSimpan.length} jadwal pelayanan berhasil disimpan.`,
      total: dataSimpan.length,
      data: hasil,
    });
  } catch (error) {
    console.error(
      "API jadwal-pelayanan error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}