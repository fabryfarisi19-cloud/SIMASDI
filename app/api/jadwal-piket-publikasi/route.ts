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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.penggunaId) {
      return NextResponse.json(
        { success: false, error: "Sesi pengguna tidak ditemukan." },
        { status: 401 }
      );
    }

    if (session.role !== "Admin") {
      return NextResponse.json(
        { success: false, error: "Hanya Admin yang boleh mengimpor jadwal." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const jadwal = body?.data;

    if (!Array.isArray(jadwal) || jadwal.length !== 31) {
      return NextResponse.json(
        {
          success: false,
          error: "Data impor harus berisi 31 tanggal jadwal Oktober 2026.",
        },
        { status: 400 }
      );
    }

    const tanggalValid = new Set<string>();
    const polaTanggal = /^2026-10-(0[1-9]|[12]\d|3[01])$/;

    for (const item of jadwal) {
      if (
        !item ||
        typeof item.tanggal !== "string" ||
        !polaTanggal.test(item.tanggal) ||
        tanggalValid.has(item.tanggal)
      ) {
        return NextResponse.json(
          { success: false, error: "Tanggal tidak valid atau duplikat." },
          { status: 400 }
        );
      }

      for (const kolom of [
        "fotografer",
        "videografer",
        "pembuat_konten_1",
        "pembuat_konten_2",
      ]) {
        if (
          typeof item[kolom] !== "string" ||
          item[kolom].trim().length === 0
        ) {
          return NextResponse.json(
            {
              success: false,
              error: `Data ${kolom} tanggal ${item.tanggal} belum lengkap.`,
            },
            { status: 400 }
          );
        }
      }

      tanggalValid.add(item.tanggal);
    }

    if (tanggalValid.size !== 31) {
      return NextResponse.json(
        { success: false, error: "Semua tanggal 1–31 harus tersedia." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("jadwal_piket_publikasi")
      .upsert(
        jadwal.map((item: {
          tanggal: string;
          fotografer: string;
          videografer: string;
          pembuat_konten_1: string;
          pembuat_konten_2: string;
        }) => ({
          tanggal: item.tanggal,
          fotografer: item.fotografer.trim(),
          videografer: item.videografer.trim(),
          pembuat_konten_1: item.pembuat_konten_1.trim(),
          pembuat_konten_2: item.pembuat_konten_2.trim(),
        })),
        { onConflict: "tanggal" }
      );

    if (error) {
      console.error("Gagal menyimpan jadwal publikasi:", error);

      return NextResponse.json(
        { success: false, error: "Gagal menyimpan jadwal publikasi." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      total: jadwal.length,
      message: "Jadwal publikasi Oktober 2026 berhasil diimpor.",
    });
  } catch (error) {
    console.error("API impor jadwal publikasi error:", error);

    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
