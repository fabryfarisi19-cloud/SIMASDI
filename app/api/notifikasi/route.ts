import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/**
 * GET
 * Mengambil notifikasi milik pengguna yang sedang login.
 *
 * Query:
 * ?semua=true  -> ambil semua notifikasi
 * default      -> ambil 20 notifikasi terbaru
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Belum login",
        },
        { status: 401 }
      );
    }

    const namaLogin =
      session.user.name ||
      (session.user as any).nama ||
      "";

    if (!namaLogin) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama pengguna tidak ditemukan pada session",
        },
        { status: 400 }
      );
    }

    // Cari data pengguna berdasarkan nama login
    const { data: pengguna, error: penggunaError } = await supabase
      .from("pengguna")
      .select("id, nama, username, role")
      .eq("nama", namaLogin)
      .maybeSingle();

    if (penggunaError) {
      console.error("ERROR CARI PENGGUNA:", penggunaError);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mencari data pengguna",
          error: penggunaError.message,
        },
        { status: 500 }
      );
    }

    if (!pengguna) {
      return NextResponse.json(
        {
          success: false,
          message: "Data pengguna tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const semua = searchParams.get("semua") === "true";

    let query = supabase
      .from("notifikasi")
      .select("*")
      .eq("nip_penerima", pengguna.username)
      .order("created_at", { ascending: false });

    if (!semua) {
      query = query.limit(20);
    }

    const { data, error } = await query;

    if (error) {
      console.error("ERROR AMBIL NOTIFIKASI:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil notifikasi",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      jumlah: data?.length || 0,
    });
  } catch (error: any) {
    console.error("ERROR GET NOTIFIKASI:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil notifikasi",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 * Membuat notifikasi baru.
 *
 * Saat ini endpoint ini dipersiapkan untuk digunakan
 * oleh proses persetujuan/penolakan Pinjam Mobil Dinas.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Belum login",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      nip_penerima,
      judul,
      pesan,
      tipe,
      referensi_id,
      referensi_kode,
    } = body;

    if (!nip_penerima || !judul || !pesan) {
      return NextResponse.json(
        {
          success: false,
          message: "nip_penerima, judul, dan pesan wajib diisi",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("notifikasi")
      .insert({
        nip_penerima,
        judul,
        pesan,
        tipe: tipe || "info",
        dibaca: false,
        referensi_id: referensi_id || null,
        referensi_kode: referensi_kode || null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("ERROR BUAT NOTIFIKASI:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal membuat notifikasi",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notifikasi berhasil dibuat",
      data,
    });
  } catch (error: any) {
    console.error("ERROR POST NOTIFIKASI:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat membuat notifikasi",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH
 * Menandai notifikasi sebagai sudah dibaca.
 *
 * Body:
 * {
 *   id: "uuid"
 * }
 *
 * atau:
 *
 * {
 *   semua: true
 * }
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Belum login",
        },
        { status: 401 }
      );
    }

    const namaLogin =
      session.user.name ||
      (session.user as any).nama ||
      "";

    if (!namaLogin) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama pengguna tidak ditemukan pada session",
        },
        { status: 400 }
      );
    }

    const { data: pengguna, error: penggunaError } = await supabase
      .from("pengguna")
      .select("username")
      .eq("nama", namaLogin)
      .maybeSingle();

    if (penggunaError || !pengguna) {
      return NextResponse.json(
        {
          success: false,
          message: "Data pengguna tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const id = body?.id;
    const semua = body?.semua === true;

    if (semua) {
      const { error } = await supabase
        .from("notifikasi")
        .update({
          dibaca: true,
        })
        .eq("nip_penerima", pengguna.username)
        .eq("dibaca", false);

      if (error) {
        console.error("ERROR BACA SEMUA NOTIFIKASI:", error);

        return NextResponse.json(
          {
            success: false,
            message: "Gagal menandai semua notifikasi",
            error: error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Semua notifikasi telah dibaca",
      });
    }

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID notifikasi wajib diisi",
        },
        { status: 400 }
      );
    }

    // Pastikan notifikasi memang milik pengguna yang login
    const { data: notifikasi, error: cekError } = await supabase
      .from("notifikasi")
      .select("id")
      .eq("id", id)
      .eq("nip_penerima", pengguna.username)
      .maybeSingle();

    if (cekError) {
      console.error("ERROR CEK NOTIFIKASI:", cekError);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memeriksa notifikasi",
          error: cekError.message,
        },
        { status: 500 }
      );
    }

    if (!notifikasi) {
      return NextResponse.json(
        {
          success: false,
          message: "Notifikasi tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("notifikasi")
      .update({
        dibaca: true,
      })
      .eq("id", id)
      .eq("nip_penerima", pengguna.username);

    if (error) {
      console.error("ERROR UPDATE NOTIFIKASI:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal menandai notifikasi",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notifikasi telah dibaca",
    });
  } catch (error: any) {
    console.error("ERROR PATCH NOTIFIKASI:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat memperbarui notifikasi",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}