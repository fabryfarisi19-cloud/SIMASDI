import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { Readable } from "stream";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        {
          error:
            "Silakan login Google terlebih dahulu dengan akun backupumum.bapasjakbar@gmail.com.",
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "File belum dipilih." },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: session.accessToken,
    });

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    const hasilUpload = await drive.files.create({
      requestBody: {
        name: `${Date.now()}-${file.name}`,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: file.type || "application/octet-stream",
        body: Readable.from(buffer),
      },
      fields: "id, webViewLink",
    });

    await drive.permissions.create({
      fileId: hasilUpload.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    return NextResponse.json({
      success: true,
      fileId: hasilUpload.data.id,
      url:
        hasilUpload.data.webViewLink ||
        `https://drive.google.com/file/d/${hasilUpload.data.id}/view`,
    });
  } catch (error) {
    console.error("UPLOAD DRIVE ERROR:", error);

    return NextResponse.json(
      {
        error: error?.message || "Upload Google Drive gagal.",
      },
      { status: 500 }
    );
  }
}