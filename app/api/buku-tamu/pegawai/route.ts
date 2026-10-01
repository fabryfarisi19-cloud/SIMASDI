import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("pengguna")
      .select(`
        id,
        nama,
        username,
        role
      `)
      .order("nama", {
        ascending: true,
      });

    if (error) {
      console.error(
        "GET PEGAWAI BUKU TAMU:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        {
          status: 500,
        }
      );
    }

    // Role yang TIDAK BOLEH menjadi tujuan tamu
    const roleDikecualikan = [
      "PPNPN",
      "KIOSK",
      "Kiosk",
      "DISPLAY TV",
      "Display TV",
      "TV",
      "PETUGAS LOKET",
      "Petugas Loket",
      "PETUGAS PIKET",
      "Petugas Piket",
      "ADMIN",
      "Admin",
    ];

  const hasil = (data || []).filter((pegawai) => {
  const role = String(pegawai.role || "")
    .trim()
    .toUpperCase();

  const nama = String(pegawai.nama || "")
    .trim()
    .toUpperCase();

  const username = String(pegawai.username || "")
    .trim()
    .toUpperCase();

  const dikecualikan = [
    "PPNPN",
    "KIOSK",
    "DISPLAY TV",
    "TV",
    "PETUGAS LOKET",
    "PETUGAS PIKET",
    "ADMIN",
  ];

  const teks = `${role} ${nama} ${username}`;

  return !dikecualikan.some((kata) =>
    teks.includes(kata)
  );
});

    return NextResponse.json({
      success: true,
      data: hasil,
    });
  } catch (error) {
    console.error(
      "GET PEGAWAI ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil daftar pegawai",
      },
      {
        status: 500,
      }
    );
  }
}