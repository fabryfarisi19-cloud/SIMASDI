import { google } from "googleapis";
import { NextResponse } from "next/server";
import { Readable } from "stream";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

async function getOrCreateFolder(drive, folderName, parentId) {
  const result = await drive.files.list({
    q: `
      name = '${folderName}'
      and mimeType = 'application/vnd.google-apps.folder'
      and '${parentId}' in parents
      and trashed = false
    `,
    fields: "files(id, name)",
  });

  if (result.data.files && result.data.files.length > 0) {
    return result.data.files[0].id;
  }

  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });

  return folder.data.id;
}
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
    const kategori = formData.get("kategori") || "Arsip Lainnya";
const tahun = new Date().getFullYear().toString();

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
const stream = Readable.from(buffer);
const folderUtama = process.env.GOOGLE_DRIVE_FOLDER_ID;

const folderKategori = await getOrCreateFolder(
  drive,
  kategori.toString(),
  folderUtama
);

const folderTahun = await getOrCreateFolder(
  drive,
  tahun,
  folderKategori
);


    const response = await drive.files.create({
      requestBody: {
        name: file.name,
parents: [folderTahun],
      },
      media: {
        mimeType: file.type || "application/octet-stream",
        body: stream,
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
  fileId: response.data.id,
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