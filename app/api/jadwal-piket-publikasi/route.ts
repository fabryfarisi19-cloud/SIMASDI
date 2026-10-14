import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
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

    const { data, error } = await supabaseAdmin
      .from("jadwal_piket_publikasi")
      .select(
        "id, tanggal, fotografer, videografer, pembuat_konten_1, pembuat_konten_2"
      )
      .gte("tanggal", "2026-10-01")
      .lte("tanggal", "2026-10-31")
      .order("tanggal", { ascending: true });

    if (error) {
      console.error(
        "Gagal membaca jadwal piket publikasi:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: "Gagal membaca jadwal piket publikasi.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      total: data?.length ?? 0,
      data: data ?? [],
    });
  } catch (error) {
    console.error(
      "API jadwal piket publikasi error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}