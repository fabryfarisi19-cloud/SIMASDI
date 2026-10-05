import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export async function GET() {
  try {
    // =====================================================
    // CEK LOGIN DAN ROLE
    // Hanya akun Buku Tamu yang boleh mengambil daftar pegawai
    // =====================================================

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda harus login terlebih dahulu",
        },
        {
          status: 401,
        }
      );
    }

    const sessionData = session as any;
    const user = sessionData?.user as any;

    const roleAsli =
      sessionData?.role ||
      user?.role ||
      user?.jabatan ||
      "";

    const role = String(roleAsli)
      .trim()
      .toLowerCase();

    if (role !== "buku tamu") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Akses ditolak. Hanya akun Buku Tamu yang dapat mengambil daftar pegawai.",
        },
        {
          status: 403,
        }
      );
    }

    // =====================================================
    // AMBIL DATA PEGAWAI
    // =====================================================

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

  const nama = String(pegawai.nama || "")
    .trim()
    .toUpperCase();

  // Berdasarkan ROLE
  if (roleDikecualikan.includes(role)) {
    return false;
  }

  // Khusus Petugas Loket berdasarkan NAMA
  if (nama === "PETUGAS LOKET") {
    return false;
  }

  return true;
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