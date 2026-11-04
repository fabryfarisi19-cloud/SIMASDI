import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { supabaseAdmin } from "@/lib/supabase-admin";


export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.penggunaId) {
      return NextResponse.json(
        {
          success: false,
          error: "Sesi pengguna tidak ditemukan.",
        },
        { status: 401 }
      );
    }

    if (session.role !== "Admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Hanya Admin yang boleh mengimpor jadwal.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = body?.data;

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Data jadwal pelayanan kosong atau tidak valid.",
        },
        { status: 400 }
      );
    }

    const tanggalPertama = data[0]?.tanggal;

    if (
      typeof tanggalPertama !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(tanggalPertama)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Format tanggal tidak valid.",
        },
        { status: 400 }
      );
    }

    const [tahun, bulan] = tanggalPertama.split("-").map(Number);

    if (
      !Number.isInteger(tahun) ||
      tahun < 2000 ||
      !Number.isInteger(bulan) ||
      bulan < 1 ||
      bulan > 12
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Periode bulan atau tahun tidak valid.",
        },
        { status: 400 }
      );
    }

    const jumlahHari = new Date(tahun, bulan, 0).getDate();
    const prefixBulan = `${tahun}-${String(bulan).padStart(2, "0")}-`;
if (data.length > jumlahHari) {
  return NextResponse.json(
    {
      success: false,
      error: `Jumlah jadwal melebihi jumlah hari dalam bulan tersebut (${jumlahHari}).`,
    },
    { status: 400 }
  );
}

    const tanggalValid = new Set<string>();

    const kolomWajib = [
      "duta_layanan",
      "pelayanan_publik",
      "maganghub",
      "pengawas",
      "koordinator",
    ] as const;

    for (const item of data) {
      if (
        !item ||
        typeof item.tanggal !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(item.tanggal) ||
        !item.tanggal.startsWith(prefixBulan) ||
        tanggalValid.has(item.tanggal)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Tanggal tidak valid, berbeda bulan, atau duplikat.",
          },
          { status: 400 }
        );
      }

      const nomorHari = Number(item.tanggal.slice(8, 10));

      if (
        nomorHari < 1 ||
        nomorHari > jumlahHari ||
        new Date(
          Date.UTC(tahun, bulan - 1, nomorHari)
        ).toISOString().slice(0, 10) !== item.tanggal
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Tanggal ${item.tanggal} tidak valid.`,
          },
          { status: 400 }
        );
      }

      for (const kolom of kolomWajib) {
        if (
          typeof item[kolom] !== "string" ||
          item[kolom].trim().length === 0
        ) {
          return NextResponse.json(
            {
              success: false,
              error: `Petugas ${kolom} tanggal ${item.tanggal} wajib diisi.`,
            },
            { status: 400 }
          );
        }
      }

      tanggalValid.add(item.tanggal);
    }

    const dataSimpan = data.map((item) => ({
      tanggal: item.tanggal,
      duta_layanan: item.duta_layanan.trim(),
      pelayanan_publik: item.pelayanan_publik.trim(),
      maganghub: item.maganghub.trim(),
      pengawas: item.pengawas.trim(),
      koordinator: item.koordinator.trim(),
      aktif: true,
    }));

    const { data: hasil, error } = await supabaseAdmin
      .from("jadwal_pelayanan_publik")
      .upsert(dataSimpan, {
        onConflict: "tanggal",
      })
      .select();

    if (error) {
      console.error("Gagal menyimpan jadwal pelayanan:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      );
    }

    const namaBulan = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    return NextResponse.json({
      success: true,
      total: dataSimpan.length,
      message: `${dataSimpan.length} jadwal pelayanan bulan ${namaBulan[bulan - 1]} ${tahun} berhasil disimpan.`,
      data: hasil,
    });
  } catch (error) {
    console.error("API jadwal-pelayanan error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
