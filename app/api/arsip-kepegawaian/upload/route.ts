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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(req: Request) {
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

    const namaSession = String(
      (session.user as any).name ??
        (session.user as any).nama ??
        ""
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
    // 2. AMBIL FORM DATA
    // ==========================================
    const formData = await req.formData();

    const file = formData.get("file");

    const nipParameter = String(
      formData.get("nip") ?? ""
    ).trim();

    const kategori = String(
      formData.get("kategori") ?? ""
    ).trim();

    const jenisDokumen = String(
      formData.get("jenis_dokumen") ?? ""
    ).trim();

    const namaDokumen = String(
      formData.get("nama_dokumen") ?? ""
    ).trim();

    const nomorDokumen = String(
      formData.get("nomor_dokumen") ?? ""
    ).trim();

    const tanggalDokumen = String(
      formData.get("tanggal_dokumen") ?? ""
    ).trim();

    const tahun = String(
      formData.get("tahun") ?? ""
    ).trim();

    const keterangan = String(
      formData.get("keterangan") ?? ""
    ).trim();

    // ==========================================
    // 3. VALIDASI FILE
    // ==========================================
    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "File dokumen belum dipilih.",
        },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "File kosong atau tidak valid.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Ukuran file maksimal 10 MB.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Format file harus PDF, JPG, PNG, atau WEBP.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 4. VALIDASI DATA WAJIB
    // ==========================================
    if (!kategori) {
      return NextResponse.json(
        {
          success: false,
          message: "Kategori dokumen wajib dipilih.",
        },
        { status: 400 }
      );
    }

    if (!namaDokumen) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama dokumen wajib diisi.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 5. TENTUKAN NIP TARGET
    // ==========================================
    let nipTarget = username;

    // Pegawai biasa hanya boleh upload
    // untuk dirinya sendiri.
    if (!isAdminKepegawaian) {
      nipTarget = username;
    }

    // Pengelola Kepegawaian boleh upload
    // untuk pegawai yang dipilih.
    if (isAdminKepegawaian && nipParameter) {
      nipTarget = nipParameter;
    }

    // ==========================================
    // 6. CARI DATA PEGAWAI
    // ==========================================
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
      .eq("username", nipTarget)
      .maybeSingle();

    if (pegawaiError) {
      console.error(
        "Gagal mencari pegawai:",
        pegawaiError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mencari data pegawai.",
          detail: pegawaiError.message,
        },
        { status: 500 }
      );
    }

    if (!pegawai) {
      return NextResponse.json(
        {
          success: false,
          message: `Pegawai dengan NIP ${nipTarget} tidak ditemukan.`,
        },
        { status: 404 }
      );
    }

    // ==========================================
    // 7. BUAT NAMA FILE AMAN
    // ==========================================
    const extension =
      file.name.split(".").pop()?.toLowerCase() || "bin";

    const timestamp = Date.now();

    const safeNamaDokumen = namaDokumen
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const fileName =
      `${timestamp}-${safeNamaDokumen}.${extension}`;

    // ==========================================
    // 8. BUAT PATH STORAGE
    // ==========================================
    const kategoriPath = kategori
      .toUpperCase()
      .replace(/[^A-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const filePath =
      `${nipTarget}/${kategoriPath}/${fileName}`;

    // ==========================================
    // 9. UPLOAD KE SUPABASE STORAGE
    // ==========================================
    const arrayBuffer = await file.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    const {
      error: uploadError,
    } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error(
        "Gagal upload file:",
        uploadError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengupload file.",
          detail: uploadError.message,
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 10. SIMPAN METADATA KE DATABASE
    // ==========================================
    const {
      data: arsip,
      error: arsipError,
    } = await supabaseAdmin
      .from("arsip_kepegawaian")
      .insert({
        pengguna_id: pegawai.id,
        nip: pegawai.username,
        nama_pegawai: pegawai.nama,
        kategori: kategori.toUpperCase(),
      jenis_dokumen:
  jenisDokumen || namaDokumen,
        nama_dokumen: namaDokumen,
        nomor_dokumen:
          nomorDokumen || null,
        tanggal_dokumen:
          tanggalDokumen || null,
        tahun: tahun
          ? Number(tahun)
          : null,
        nama_file: file.name,
        file_path: filePath,
        keterangan:
          keterangan || null,
        uploaded_by: username,
      })
      .select()
      .single();

    if (arsipError) {
      console.error(
        "Gagal menyimpan metadata arsip:",
        arsipError
      );

      // ==========================================
      // ROLLBACK FILE STORAGE
      // ==========================================
      await supabaseAdmin.storage
        .from(BUCKET)
        .remove([filePath]);

      return NextResponse.json(
        {
          success: false,
          message:
            "File berhasil diupload tetapi metadata gagal disimpan.",
          detail: arsipError.message,
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 11. BUAT SIGNED URL
    // ==========================================
    const {
      data: signedUrlData,
    } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(
        filePath,
        300
      );

    // ==========================================
    // 12. RESPONSE
    // ==========================================
    return NextResponse.json({
      success: true,
      message: "Dokumen berhasil diupload.",
      data: {
        ...arsip,
        file_url:
          signedUrlData?.signedUrl ?? null,
      },
    });
  } catch (error) {
    console.error(
      "ERROR API UPLOAD ARSIP KEPEGAWAIAN:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server saat upload.",
      },
      { status: 500 }
    );
  }
}