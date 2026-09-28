import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BUCKET = "pengaduan-sarpras";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Sesi login tidak ditemukan.",
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Foto wajib diunggah.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Format foto tidak diperbolehkan. Gunakan JPG, JPEG, PNG, atau WEBP.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Ukuran foto maksimal 10 MB.",
        },
        { status: 400 }
      );
    }

    const extension =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : "jpg";

    const username =
      session.user.username ||
      session.user.name ||
      "pengguna";

    const safeUsername = String(username)
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 50);

    const timestamp = Date.now();

    const fileName = `${safeUsername}-${timestamp}.${extension}`;

    const filePath = `laporan/${new Date()
      .toISOString()
      .slice(0, 10)}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, Buffer.from(arrayBuffer), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("UPLOAD FOTO ERROR:", uploadError);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengunggah foto.",
          error: uploadError.message,
        },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      message: "Foto berhasil diunggah.",
      path: filePath,
      url: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error("UPLOAD SARPRAS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat mengunggah foto.",
      },
      { status: 500 }
    );
  }
}