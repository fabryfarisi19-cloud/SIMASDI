import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const penggunaId = session?.penggunaId;

    if (!penggunaId) {
      return NextResponse.json(
        { success: false, error: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    // Verifikasi role langsung dari database.
    const { data: pengguna, error: penggunaError } =
      await supabaseAdmin
        .from("pengguna")
        .select("id, role, status")
        .eq("id", penggunaId)
        .maybeSingle();

    if (penggunaError) {
      console.error("Gagal memverifikasi pengguna rekap.");
      return NextResponse.json(
        { success: false, error: "Gagal memverifikasi akses." },
        { status: 500 }
      );
    }

    if (
      !pengguna ||
      String(pengguna.status ?? "").trim().toLowerCase() !== "aktif"
    ) {
      return NextResponse.json(
        { success: false, error: "Akun tidak aktif atau tidak ditemukan." },
        { status: 403 }
      );
    }

    if (
      String(pengguna.role ?? "").trim() !== "Pengelola Kepegawaian"
    ) {
      return NextResponse.json(
        { success: false, error: "Anda tidak berhak melihat rekap." },
        { status: 403 }
      );
    }

    // Ambil maksimal 1.000 data terbaru.
    const { data, error } = await supabaseAdmin
      .from("pengajuan_kepegawaian")
      .select(
        "id, pengguna_id, nama_pegawai, nip, jenis_pengajuan, tanggal_mulai, tanggal_selesai, keterangan, dokumen_url, dibuat_pada"
      )
      .order("dibuat_pada", { ascending: false })
      .range(0, 999);

    if (error) {
      console.error("Gagal mengambil rekap pengajuan.");
      return NextResponse.json(
        { success: false, error: "Data rekap gagal dimuat." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}