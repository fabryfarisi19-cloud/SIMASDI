
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("video_informasi")
      .select("judul, url, nama_file")
      .eq("aktif", true)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("GET VIDEO AKTIF ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil video aktif",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data ?? null,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("VIDEO AKTIF ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      { status: 500 }
    );
  }
}
