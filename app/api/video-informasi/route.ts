import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const BUCKET = "video-informasi";

export async function POST(request: Request) {
  try {
    // =====================================================
    // CEK LOGIN
    // =====================================================

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

    // =====================================================
    // CEK ROLE
    // =====================================================

    const role =
      (session.user as any).role ?? "";

    if (role !== "Admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Akses hanya untuk Admin",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // AMBIL FORM DATA
    // =====================================================

    const formData = await request.formData();

    const file = formData.get("file");
    const judul = String(
      formData.get("judul") ?? ""
    ).trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "File video belum dipilih",
        },
        { status: 400 }
      );
    }

    if (!judul) {
      return NextResponse.json(
        {
          success: false,
          message: "Judul video wajib diisi",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // VALIDASI FILE
    // =====================================================

    if (file.type !== "video/mp4") {
      return NextResponse.json(
        {
          success: false,
          message: "Format video harus MP4",
        },
        { status: 400 }
      );
    }

    // Batas 50 MB mengikuti batas Storage Supabase
    const MAX_SIZE = 50 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ukuran video maksimal 50 MB",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // BUAT NAMA FILE UNIK
    // =====================================================

    const timestamp = Date.now();

    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/\s+/g, "_");

    const storagePath =
      `${timestamp}-${safeName}`;

    // =====================================================
    // UPLOAD KE SUPABASE STORAGE
    // =====================================================

    const arrayBuffer =
      await file.arrayBuffer();

    const buffer = Buffer.from(
      arrayBuffer
    );

    const { error: uploadError } =
      await supabaseAdmin.storage
        .from(BUCKET)
        .upload(
          storagePath,
          buffer,
          {
            contentType: "video/mp4",
            upsert: false,
          }
        );

    if (uploadError) {
      console.error(
        "UPLOAD VIDEO ERROR:",
        uploadError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengupload video",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // AMBIL URL PUBLIC
    // =====================================================

    const {
      data: publicUrlData,
    } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const url =
      publicUrlData.publicUrl;

    // =====================================================
    // SIMPAN KE DATABASE
    // =====================================================

    const { data, error: dbError } =
      await supabaseAdmin
        .from("video_informasi")
        .insert({
          judul,
          nama_file: file.name,
          storage_path: storagePath,
          url,
          aktif: false,
        })
        .select()
        .single();

    if (dbError) {
      console.error(
        "DATABASE VIDEO ERROR:",
        dbError
      );

      // Jika database gagal, hapus file
      // yang sudah terlanjur diupload.
      await supabaseAdmin.storage
        .from(BUCKET)
        .remove([storagePath]);

      return NextResponse.json(
        {
          success: false,
          message:
            "Video berhasil diupload tetapi gagal disimpan ke database",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // BERHASIL
    // =====================================================

    return NextResponse.json({
      success: true,
      message:
        "Video berhasil diupload",
      data,
    });
  } catch (error) {
    console.error(
      "VIDEO INFORMASI ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server",
      },
      { status: 500 }
    );
  }
}
export async function GET() {
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

    const role =
      (session.user as any).role ?? "";

    if (role !== "Admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Akses hanya untuk Admin",
        },
        { status: 403 }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("video_informasi")
        .select(
          "id, judul, nama_file, storage_path, url, aktif, created_at, updated_at"
        )
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(
        "GET VIDEO INFORMASI ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil daftar video",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
    });
  } catch (error) {
    console.error(
      "GET VIDEO INFORMASI ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server",
      },
      { status: 500 }
    );
  }
}
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

    const role =
      (session.user as any).role ?? "";

    if (role !== "Admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Akses hanya untuk Admin",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const videoId = Number(body.id);

    if (!videoId || Number.isNaN(videoId)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID video tidak valid",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // MATIKAN SEMUA VIDEO TERLEBIH DAHULU
    // =====================================================

    const { error: resetError } =
      await supabaseAdmin
        .from("video_informasi")
        .update({
          aktif: false,
          updated_at: new Date().toISOString(),
        })
        .eq("aktif", true);

    if (resetError) {
      console.error(
        "RESET VIDEO ERROR:",
        resetError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal menonaktifkan video sebelumnya",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // AKTIFKAN VIDEO YANG DIPILIH
    // =====================================================

    const { data, error } =
      await supabaseAdmin
        .from("video_informasi")
        .update({
          aktif: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", videoId)
        .select()
        .single();

    if (error) {
      console.error(
        "ACTIVE VIDEO ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengaktifkan video",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Video berhasil diaktifkan",
      data,
    });
  } catch (error) {
    console.error(
      "PATCH VIDEO ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server",
      },
      { status: 500 }
    );
  }
}
export async function DELETE(request: Request) {
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

    const role =
      (session.user as any).role ?? "";

    if (role !== "Admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Akses hanya untuk Admin",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const videoId = Number(body.id);

    if (!videoId || Number.isNaN(videoId)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID video tidak valid",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // AMBIL DATA VIDEO
    // =====================================================

    const { data: video, error: findError } =
      await supabaseAdmin
        .from("video_informasi")
        .select(
          "id, storage_path, aktif"
        )
        .eq("id", videoId)
        .single();

    if (findError || !video) {
      return NextResponse.json(
        {
          success: false,
          message: "Video tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // JANGAN HAPUS VIDEO YANG SEDANG AKTIF
    // =====================================================

    if (video.aktif) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Video yang sedang aktif tidak dapat dihapus. Aktifkan video lain terlebih dahulu.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // HAPUS FILE DARI STORAGE
    // =====================================================

    const { error: storageError } =
      await supabaseAdmin.storage
        .from(BUCKET)
        .remove([
          video.storage_path,
        ]);

    if (storageError) {
      console.error(
        "DELETE STORAGE ERROR:",
        storageError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal menghapus file video",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // HAPUS DATA DATABASE
    // =====================================================

    const { error: dbError } =
      await supabaseAdmin
        .from("video_informasi")
        .delete()
        .eq("id", videoId);

    if (dbError) {
      console.error(
        "DELETE DATABASE ERROR:",
        dbError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "File video sudah dihapus tetapi data database gagal dihapus",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Video berhasil dihapus",
    });
  } catch (error) {
    console.error(
      "DELETE VIDEO ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server",
      },
      { status: 500 }
    );
  }
}