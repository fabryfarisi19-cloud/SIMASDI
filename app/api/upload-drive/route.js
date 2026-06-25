import { google } from "googleapis";
import { NextResponse } from "next/server";

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

    const credentials = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
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
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: file.type || "application/octet-stream",
        body: buffer,
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
        error: error.message || "Upload Google Drive gagal.",
      },
      { status: 500 }
    );
  }
}