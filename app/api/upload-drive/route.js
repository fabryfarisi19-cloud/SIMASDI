import { google } from "googleapis";
import { NextResponse } from "next/server";
import { Readable } from "stream";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "File belum dipilih." },
        { status: 400 }
      );
    }

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!clientEmail || !privateKey || !folderId) {
      return NextResponse.json(
        { error: "Konfigurasi Google Drive belum lengkap di Vercel." },
        { status: 500 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({
      version: "v3",
      auth,
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    const hasilUpload = await drive.files.create({
      requestBody: {
        name: `${Date.now()}-${file.name}`,
        parents: [folderId],
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