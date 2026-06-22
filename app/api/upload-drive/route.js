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

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File tidak ditemukan." },
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

    const buffer = Buffer.from(await file.arrayBuffer());

    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: file.type || "application/octet-stream",
        body: buffer,
      },
      fields: "id, webViewLink",
    });

    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    return NextResponse.json({
      success: true,
      fileUrl:
        response.data.webViewLink ||
        `https://drive.google.com/file/d/${response.data.id}/view`,
    });
  } catch (err) {
    console.error("UPLOAD DRIVE ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Upload gagal ke Google Drive.",
      },
      { status: 500 }
    );
  }
}