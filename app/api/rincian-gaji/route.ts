import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.penggunaId) {
      return NextResponse.json(
        { error: "Sesi pengguna tidak ditemukan." },
        { status: 401 }
      );
    }

    const penggunaId = Number(session.penggunaId);

    if (!penggunaId) {
      return NextResponse.json(
        { error: "ID pengguna tidak valid." },
        { status: 400 }
      );
    }

    const role = session.role || "";

    // Ambil data gaji milik pengguna yang sedang login.
    // Untuk sementara semua pengguna hanya boleh melihat
    // data gajinya sendiri melalui endpoint ini.
    const { data, error } = await supabaseAdmin
      .from("rincian_gaji")
      .select("*")
      .eq("pengguna_id", penggunaId)
      .order("tahun", { ascending: false })
      .order("bulan", { ascending: false });

    if (error) {
      console.error("Gagal mengambil rincian gaji:", error);

      return NextResponse.json(
        { error: "Gagal mengambil data rincian gaji." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      penggunaId,
      role,
      data: data || [],
    });
  } catch (error) {
    console.error("API rincian gaji error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}