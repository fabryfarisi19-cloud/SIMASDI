import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sekarang = new Date();

    // Format tanggal Indonesia
    const tahun = sekarang.getFullYear();
    const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
    const tanggal = String(sekarang.getDate()).padStart(2, "0");

    const tanggalHariIni = `${tahun}-${bulan}-${tanggal}`;
    const bulanIni = `${tahun}-${bulan}-01`;
    const tahunIni = `${tahun}-01-01`;

    // =====================================================
    // TOTAL HARI INI
    // =====================================================

    const { count: totalHariIni, error: errorHariIni } =
      await supabaseAdmin
        .from("buku_tamu")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("tanggal_kunjungan", tanggalHariIni);

    if (errorHariIni) {
      console.error("DASHBOARD TOTAL HARI INI:", errorHariIni);

      return NextResponse.json(
        {
          success: false,
          message: errorHariIni.message,
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // KLIEN DEWASA HARI INI
    // =====================================================

    const { count: klienDewasa, error: errorDewasa } =
      await supabaseAdmin
        .from("buku_tamu")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("tanggal_kunjungan", tanggalHariIni)
        .eq("jenis_pengunjung", "KLIEN_DEWASA");

    if (errorDewasa) {
      console.error("DASHBOARD KLIEN DEWASA:", errorDewasa);

      return NextResponse.json(
        {
          success: false,
          message: errorDewasa.message,
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // KLIEN ANAK HARI INI
    // =====================================================

    const { count: klienAnak, error: errorAnak } =
      await supabaseAdmin
        .from("buku_tamu")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("tanggal_kunjungan", tanggalHariIni)
        .eq("jenis_pengunjung", "KLIEN_ANAK");

    if (errorAnak) {
      console.error("DASHBOARD KLIEN ANAK:", errorAnak);

      return NextResponse.json(
        {
          success: false,
          message: errorAnak.message,
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // TAMU DINAS HARI INI
    // =====================================================

    const { count: tamuDinas, error: errorDinas } =
      await supabaseAdmin
        .from("buku_tamu")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("tanggal_kunjungan", tanggalHariIni)
        .eq("jenis_pengunjung", "TAMU_DINAS");

    if (errorDinas) {
      console.error("DASHBOARD TAMU DINAS:", errorDinas);

      return NextResponse.json(
        {
          success: false,
          message: errorDinas.message,
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // TOTAL BULAN INI
    // =====================================================

    const { count: totalBulanIni, error: errorBulan } =
      await supabaseAdmin
        .from("buku_tamu")
        .select("*", {
          count: "exact",
          head: true,
        })
        .gte("tanggal_kunjungan", bulanIni)
        .lt(
          "tanggal_kunjungan",
          `${tahun}-${String(
            sekarang.getMonth() + 2
          ).padStart(2, "0")}-01`
        );

    // =====================================================
    // TOTAL TAHUN INI
    // =====================================================

    const { count: totalTahunIni, error: errorTahun } =
      await supabaseAdmin
        .from("buku_tamu")
        .select("*", {
          count: "exact",
          head: true,
        })
        .gte("tanggal_kunjungan", tahunIni)
        .lt(
          "tanggal_kunjungan",
          `${tahun + 1}-01-01`
        );

    if (errorBulan || errorTahun) {
      console.error(
        "DASHBOARD BULAN/TAHUN:",
        errorBulan || errorTahun
      );

      return NextResponse.json(
        {
          success: false,
          message:
            errorBulan?.message ||
            errorTahun?.message ||
            "Gagal mengambil rekap",
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // KUNJUNGAN TERBARU
    // =====================================================

    const { data: kunjunganTerbaru, error: errorTerbaru } =
      await supabaseAdmin
        .from("buku_tamu")
        .select(`
          id,
          nomor_kunjungan,
          tanggal_kunjungan,
          jam_kunjungan,
          jenis_pengunjung,
          nama,
          nik,
          no_hp,
          instansi,
          jabatan,
          jenis_keperluan,
          keperluan,
          bertemu_dengan,
          jabatan_tujuan
        `)
        .order("jam_kunjungan", {
          ascending: false,
        })
        .limit(50);

    if (errorTerbaru) {
      console.error(
        "DASHBOARD KUNJUNGAN TERBARU:",
        errorTerbaru
      );

      return NextResponse.json(
        {
          success: false,
          message: errorTerbaru.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,

      tanggal_hari_ini: tanggalHariIni,

      statistik: {
        total_hari_ini: totalHariIni || 0,
        klien_dewasa: klienDewasa || 0,
        klien_anak: klienAnak || 0,
        tamu_dinas: tamuDinas || 0,
        total_bulan_ini: totalBulanIni || 0,
        total_tahun_ini: totalTahunIni || 0,
      },

      kunjungan_terbaru: kunjunganTerbaru || [],
    });
  } catch (error) {
    console.error(
      "API DASHBOARD BUKU TAMU:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data dashboard Buku Tamu",
      },
      {
        status: 500,
      }
    );
  }
}