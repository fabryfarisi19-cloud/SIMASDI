import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET = "arsip-kepegawaian";

const ROLE_ADMIN_KEPEGAWAIAN = [
  "pengelola kepegawaian",
  "kaur kepegawaian",
  "admin kepegawaian",
  "admin",
];

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda harus login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    const username = String(
      (session.user as any).username ?? ""
    ).trim();

    const role = String(
      (session.user as any).role ?? ""
    )
      .trim()
      .toLowerCase();

    if (!username) {
      return NextResponse.json(
        {
          success: false,
          message: "Username/NIP tidak ditemukan pada session.",
        },
        { status: 401 }
      );
    }

    const isAdminKepegawaian =
      ROLE_ADMIN_KEPEGAWAIAN.includes(role);

    const { searchParams } = new URL(req.url);

    const nipParameter = String(
      searchParams.get("nip") ?? ""
    ).trim();

    const kategori = String(
      searchParams.get("kategori") ?? ""
    ).trim();

    const jenisDokumen = String(
      searchParams.get("jenis_dokumen") ?? ""
    ).trim();

    const mode = String(
      searchParams.get("mode") ?? ""
    )
      .trim()
      .toLowerCase();

    // ==========================================
    // DAFTAR SELURUH PEGAWAI
    // KHUSUS PENGELOLA KEPEGAWAIAN
    // ==========================================

    if (mode === "pegawai") {
      if (!isAdminKepegawaian) {
        return NextResponse.json(
          {
            success: false,
            message: "Anda tidak memiliki akses.",
          },
          { status: 403 }
        );
      }

      const {
        data: pegawai,
        error: pegawaiError,
      } = await supabaseAdmin
        .from("pengguna")
        .select(`
          id,
          nama,
          username,
          role,
          status
        `)
        .order("nama", {
          ascending: true,
        });

      if (pegawaiError) {
        console.error(
          "Gagal mengambil daftar pegawai:",
          pegawaiError
        );

        return NextResponse.json(
          {
            success: false,
            message: "Gagal mengambil daftar pegawai.",
            detail: pegawaiError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        jumlah: pegawai?.length ?? 0,
        data: pegawai ?? [],
      });
    }

    // ==========================================
    // TENTUKAN NIP YANG BOLEH DILIHAT
    // ==========================================

    let nipTarget = username;

    if (isAdminKepegawaian && nipParameter) {
      nipTarget = nipParameter;
    }

    // ==========================================
    // QUERY ARSIP
    // ==========================================

    let query = supabaseAdmin
      .from("arsip_kepegawaian")
      .select(`
        id,
        pengguna_id,
        nip,
        nama_pegawai,
        kategori,
        jenis_dokumen,
        nama_dokumen,
        nomor_dokumen,
        tanggal_dokumen,
        tahun,
        nama_file,
        file_path,
        keterangan,
        uploaded_by,
        created_at,
        updated_at
      `)
      .eq("nip", nipTarget)
      .order("created_at", {
        ascending: false,
      });

    if (kategori) {
      query = query.eq(
        "kategori",
        kategori.toUpperCase()
      );
    }

    if (jenisDokumen) {
      query = query.eq(
        "jenis_dokumen",
        jenisDokumen
      );
    }

    const {
      data: arsip,
      error: arsipError,
    } = await query;

    if (arsipError) {
      console.error(
        "Gagal mengambil arsip:",
        arsipError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data arsip.",
          detail: arsipError.message,
        },
        { status: 500 }
      );
    }

    const arsipDenganUrl = await Promise.all(
      (arsip ?? []).map(async (item) => {
        const {
          data: signedUrlData,
          error: signedUrlError,
        } = await supabaseAdmin.storage
          .from(BUCKET)
          .createSignedUrl(
            item.file_path,
            300
          );

        if (signedUrlError) {
          console.error(
            "Gagal membuat signed URL:",
            signedUrlError
          );
        }

        return {
          ...item,
          file_url:
            signedUrlData?.signedUrl ?? null,
        };
      })
    );

    return NextResponse.json({
      success: true,

      pemilik: {
        nip: nipTarget,
        mode: isAdminKepegawaian
          ? nipParameter
            ? "admin-melihat-pegawai"
            : "admin-sendiri"
          : "pegawai-sendiri",
      },

      jumlah: arsipDenganUrl.length,

      data: arsipDenganUrl,
    });
  } catch (error) {
    console.error(
      "ERROR API ARSIP KEPEGAWAIAN:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
export async function DELETE(req: Request) {
  try {
    // ==========================================
    // 1. CEK LOGIN
    // ==========================================
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda harus login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    const username = String(
      (session.user as any).username ?? ""
    ).trim();

    const role = String(
      (session.user as any).role ?? ""
    )
      .trim()
      .toLowerCase();

    if (!username) {
      return NextResponse.json(
        {
          success: false,
          message: "Username/NIP tidak ditemukan pada session.",
        },
        { status: 401 }
      );
    }

    const isAdminKepegawaian =
      ROLE_ADMIN_KEPEGAWAIAN.includes(role);

    // ==========================================
    // 2. AMBIL ID ARSIP
    // ==========================================
    const { searchParams } = new URL(req.url);

    const id = String(
      searchParams.get("id") ?? ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID arsip tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 3. CARI DATA ARSIP
    // ==========================================
    const {
      data: arsip,
      error: arsipError,
    } = await supabaseAdmin
      .from("arsip_kepegawaian")
      .select(`
        id,
        nip,
        nama_file,
        file_path,
        uploaded_by
      `)
      .eq("id", id)
      .maybeSingle();

    if (arsipError) {
      console.error(
        "Gagal mencari arsip:",
        arsipError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mencari data arsip.",
          detail: arsipError.message,
        },
        { status: 500 }
      );
    }

    if (!arsip) {
      return NextResponse.json(
        {
          success: false,
          message: "Dokumen arsip tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // ==========================================
    // 4. KEAMANAN
    // ==========================================
    // Pegawai biasa hanya boleh menghapus
    // arsip miliknya sendiri.
    if (!isAdminKepegawaian && arsip.nip !== username) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda tidak memiliki izin untuk menghapus dokumen ini.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // 5. HAPUS FILE DARI STORAGE
    // ==========================================
    if (arsip.file_path) {
      const {
        error: storageError,
      } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove([arsip.file_path]);

      if (storageError) {
        console.error(
          "Gagal menghapus file storage:",
          storageError
        );

        return NextResponse.json(
          {
            success: false,
            message: "File gagal dihapus dari Storage.",
            detail: storageError.message,
          },
          { status: 500 }
        );
      }
    }

    // ==========================================
    // 6. HAPUS METADATA DATABASE
    // ==========================================
    const {
      error: deleteError,
    } = await supabaseAdmin
      .from("arsip_kepegawaian")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error(
        "Gagal menghapus metadata arsip:",
        deleteError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "File sudah dihapus dari Storage, tetapi metadata gagal dihapus.",
          detail: deleteError.message,
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 7. RESPONSE
    // ==========================================
    return NextResponse.json({
      success: true,
      message: "Dokumen berhasil dihapus.",
    });
  } catch (error) {
    console.error(
      "ERROR API DELETE ARSIP KEPEGAWAIAN:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server saat menghapus dokumen.",
      },
      { status: 500 }
    );
  }
}