import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda belum login.",
        },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("pengguna")
      .select("id, nama, username, role, status")
      .eq("status", "Aktif")
      .order("nama", { ascending: true });

    if (error) {
      console.error("Error mengambil daftar pegawai:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil daftar pegawai.",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      total: data?.length ?? 0,
      data: data ?? [],
    });
  } catch (error: any) {
    console.error("API pegawai teladan error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
        error: error?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}