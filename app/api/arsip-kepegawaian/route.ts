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
const ROLE_DILARANG_ARSIP_KEPEGAWAIAN = [
  "petugas",
  "kiosk",
  "display",
  "admin",
];
// ======================================================
// NORMALISASI TEKS
// ======================================================

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

// ======================================================
// GET
// ======================================================

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

    const role = normalizeText(
      (session.user as any).role ?? ""
    );
// ======================================================
// BLOKIR AKSES ROLE YANG TIDAK BOLEH MENGAKSES ARSIP
// ======================================================

if (ROLE_DILARANG_ARSIP_KEPEGAWAIAN.includes(role)) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Akun Anda tidak memiliki akses ke Arsip Kepegawaian.",
    },
    { status: 403 }
  );
}
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

    const kategoriParameter = String(
      searchParams.get("kategori") ?? ""
    ).trim();

    const jenisDokumenParameter = String(
      searchParams.get("jenis_dokumen") ?? ""
    ).trim();

    const mode = normalizeText(
      searchParams.get("mode") ?? ""
    );

    // ======================================================
    // DAFTAR PEGAWAI
    // ======================================================

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
  .not("username", "in", '("admin","display","kiosk","petugas")')
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

    // ======================================================
    // TENTUKAN NIP TARGET
    // ======================================================

    let nipTarget = username;

    if (isAdminKepegawaian && nipParameter) {
      nipTarget = nipParameter;
    }

    // ======================================================
    // VALIDASI NIP
    // ======================================================

    if (!nipTarget) {
      return NextResponse.json(
        {
          success: false,
          message: "NIP pegawai tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    // ======================================================
    // QUERY SEMUA ARSIP
    //
    // PENTING:
    // Jangan membatasi data berdasarkan kategori di sini
    // kecuali memang diminta secara eksplisit.
    //
    // Page.tsx akan melakukan pencocokan kategori.
    // Ini mencegah arsip lama "hilang".
    // ======================================================

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

    // ======================================================
    // FILTER KATEGORI HANYA JIKA URL MEMINTA
    //
    // Gunakan ilike supaya:
    // SK JABATAN
    // sk jabatan
    // Sk Jabatan
    // tetap dianggap sama.
    // ======================================================

    if (kategoriParameter) {
      query = query.ilike(
        "kategori",
        kategoriParameter
      );
    }

    // ======================================================
    // FILTER JENIS DOKUMEN
    // ======================================================

    if (jenisDokumenParameter) {
      query = query.ilike(
        "jenis_dokumen",
        jenisDokumenParameter
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

    // ======================================================
    // BUAT SIGNED URL
    //
    // 1 JAM
    // Tidak lagi 5 menit.
    // ======================================================

    const arsipDenganUrl = await Promise.all(
      (arsip ?? []).map(async (item) => {
        let fileUrl: string | null = null;

        if (item.file_path) {
          const {
            data: signedUrlData,
            error: signedUrlError,
          } = await supabaseAdmin.storage
            .from(BUCKET)
            .createSignedUrl(
              item.file_path,
              60 * 60
            );

          if (signedUrlError) {
            console.error(
              `Gagal membuat signed URL untuk ${item.nama_file}:`,
              signedUrlError
            );
          } else {
            fileUrl =
              signedUrlData?.signedUrl ?? null;
          }
        }

        return {
          ...item,

          // URL untuk Lihat / Print / Download
          file_url: fileUrl,

          // Informasi tambahan agar page mudah debugging
          file_tersedia:
            Boolean(item.file_path),

          signed_url_berhasil:
            Boolean(fileUrl),
        };
      })
    );

    // ======================================================
    // RESPONSE
    // ======================================================

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
      "ERROR API ARSIP KEPEGAWAIAN GET:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE
// ======================================================

export async function DELETE(req: Request) {
  try {
    // ======================================================
    // 1. CEK LOGIN
    // ======================================================

    const session = await getServerSession(
      authOptions
    );

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda harus login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    const username = String(
      (session.user as any).username ?? ""
    ).trim();

    const role = normalizeText(
      (session.user as any).role ?? ""
    );
// ======================================================
// BLOKIR AKSES ROLE YANG TIDAK BOLEH MENGAKSES ARSIP
// ======================================================

if (ROLE_DILARANG_ARSIP_KEPEGAWAIAN.includes(role)) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Akun Anda tidak memiliki akses ke Arsip Kepegawaian.",
    },
    { status: 403 }
  );
}
    if (!username) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Username/NIP tidak ditemukan pada session.",
        },
        { status: 401 }
      );
    }

    const isAdminKepegawaian =
      ROLE_ADMIN_KEPEGAWAIAN.includes(role);

    // ======================================================
    // 2. AMBIL ID
    // ======================================================

    const { searchParams } = new URL(req.url);

    const id = String(
      searchParams.get("id") ?? ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ID arsip tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    // ======================================================
    // 3. CARI DATA
    // ======================================================

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
          message:
            "Gagal mencari data arsip.",
          detail:
            arsipError.message,
        },
        { status: 500 }
      );
    }

    if (!arsip) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Dokumen arsip tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // ======================================================
    // 4. CEK HAK AKSES
    // ======================================================

    if (
      !isAdminKepegawaian &&
      String(arsip.nip ?? "").trim() !== username
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda tidak memiliki izin untuk menghapus dokumen ini.",
        },
        { status: 403 }
      );
    }

    // ======================================================
    // 5. HAPUS STORAGE
    // ======================================================

    if (arsip.file_path) {
      const {
        error: storageError,
      } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove([
          arsip.file_path,
        ]);

      if (storageError) {
        console.error(
          "Gagal menghapus file Storage:",
          storageError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "File gagal dihapus dari Storage.",
            detail:
              storageError.message,
          },
          { status: 500 }
        );
      }
    }

    // ======================================================
    // 6. HAPUS DATABASE
    // ======================================================

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
          detail:
            deleteError.message,
        },
        { status: 500 }
      );
    }

    // ======================================================
    // 7. BERHASIL
    // ======================================================

    return NextResponse.json({
      success: true,
      message:
        "Dokumen berhasil dihapus.",
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