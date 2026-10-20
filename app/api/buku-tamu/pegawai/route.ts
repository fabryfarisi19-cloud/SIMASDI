
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const roleDikecualikan = [
  "PPNPN",
  "KIOSK",
  "BUKU TAMU",
  "DISPLAY TV",
  "TV",
  "PETUGAS LOKET",
  "PETUGAS PIKET",
  "ADMIN",
];

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("pengguna")
      .select("id, nama, role")
      .order("nama", { ascending: true });

    if (error) {
      console.error("GET PEGAWAI BUKU TAMU:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil daftar pegawai",
        },
        { status: 500 }
      );
    }

    const hasil = (data || [])
      .filter((pegawai) => {
        const role = String(pegawai.role || "")
          .trim()
          .toUpperCase();

        const nama = String(pegawai.nama || "")
          .trim()
          .toUpperCase();

        if (roleDikecualikan.includes(role)) {
          return false;
        }

        if (
          nama === "PETUGAS LOKET" ||
          nama === "DISPLAY TV"
        ) {
          return false;
        }

        return true;
      })
      .map((pegawai) => ({
        id: pegawai.id,
        nama: pegawai.nama,
        role: pegawai.role,
      }));

    return NextResponse.json(
      {
        success: true,
        data: hasil,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET PEGAWAI ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil daftar pegawai",
      },
      { status: 500 }
    );
  }
}
