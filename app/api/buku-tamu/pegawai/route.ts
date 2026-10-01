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
      console.error("GET PEGAWAI BUKU TAMU:", error);

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

    // =====================================================
    // ROLE YANG TIDAK BOLEH MENJADI TUJUAN TAMU
    // =====================================================
    const roleDikecualikan = [
      "PPNPN",
      "KIOSK",
      "DISPLAY TV",
      "TV",
      "PETUGAS LOKET",
      "PETUGAS PIKET",
      "ADMIN",
    ];

    // =====================================================
    // FILTER PEGAWAI
    // =====================================================
    const hasil = (data || []).filter((pegawai) => {
      const role = String(pegawai.role || "")
        .trim()
        .toUpperCase();

      // Hanya berdasarkan ROLE.
      // Nama dan username tidak ikut difilter.
      return !roleDikecualikan.includes(role);
    });

    return NextResponse.json({
      success: true,
      data: hasil,
    });
  } catch (error) {
    console.error("GET PEGAWAI ERROR:", error);

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