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
      .from("pegawai_teladan_kriteria")
      .select(`
        id,
        kode,
        nama_kriteria,
        deskripsi,
        indikator,
        pedoman_nilai,
        bobot,
        nilai_min,
        nilai_max,
        urutan,
        aktif
      `)
      .eq("aktif", true)
      .order("urutan", { ascending: true });

    if (error) {
      console.error("Error mengambil kriteria pegawai teladan:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data kriteria.",
          error: error.message,
        },
        { status: 500 }
      );
    }

    const kriteria = data ?? [];

    const totalBobot = kriteria.reduce(
      (total, item) => total + Number(item.bobot || 0),
      0
    );

    return NextResponse.json({
      success: true,
      total: kriteria.length,
      total_bobot: totalBobot,
      data: kriteria,
    });
  } catch (error: any) {
    console.error("API kriteria pegawai teladan error:", error);

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