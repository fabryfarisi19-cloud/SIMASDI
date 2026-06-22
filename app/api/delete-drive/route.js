import { google } from "googleapis";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Silakan login Google kembali terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    const { fileId } = await req.json();

    if (!fileId) {
      return NextResponse.json(
        {
          success: false,
          error: "ID file Google Drive tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    const auth = new google.auth.OAuth2();

    auth.setCredentials({
      access_token: session.accessToken,
    });

    const drive = google.drive({
      version: "v3",
      auth,
    });

    await drive.files.delete({
      fileId,
    });

    return NextResponse.json({
      success: true,
      message: "File berhasil dihapus dari Google Drive.",
    });
  } catch (err) {
    console.error("DELETE DRIVE ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Gagal menghapus file dari Google Drive.",
      },
      { status: 500 }
    );
  }
}