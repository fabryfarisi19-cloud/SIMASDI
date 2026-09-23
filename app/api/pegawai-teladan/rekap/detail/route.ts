import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ROLE_ADMIN = [
  "Admin",
  "Pengelola Kepegawaian",
  "Kaur Kepegawaian",
];

export async function GET(request: Request) {
  try {
    // =========================================================
    // CEK SESSION
    // =========================================================

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda belum login.",
        },
        { status: 401 }
      );
    }

    // =========================================================
    // CEK ROLE
    // =========================================================

    const sessionRole = String(
      session.user?.role ?? ""
    ).trim();

    if (!ROLE_ADMIN.includes(sessionRole)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda tidak memiliki akses untuk melihat rekap penilaian.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // PARAMETER
    // =========================================================

    const { searchParams } = new URL(request.url);

    const periodeId =
      searchParams.get("periode_id")?.trim() || "";

    const pegawaiUsername =
      searchParams.get("pegawai_username")?.trim() || "";

    if (!periodeId) {
      return NextResponse.json(
        {
          success: false,
          message: "Periode penilaian wajib dipilih.",
        },
        { status: 400 }
      );
    }

    if (!pegawaiUsername) {
      return NextResponse.json(
        {
          success: false,
          message: "NIP/username pegawai wajib diisi.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // AMBIL PERIODE
    // =========================================================

    const { data: periode, error: periodeError } =
      await supabaseAdmin
        .from("pegawai_teladan_periode")
        .select(`
          id,
          tahun,
          bulan,
          nama_periode,
          status,
          tanggal_mulai,
          tanggal_selesai,
          keterangan
        `)
        .eq("id", periodeId)
        .maybeSingle();

    if (periodeError) {
      console.error(
        "Error mengambil periode:",
        periodeError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data periode.",
          error: periodeError.message,
        },
        { status: 500 }
      );
    }

    if (!periode) {
      return NextResponse.json(
        {
          success: false,
          message: "Periode penilaian tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // AMBIL DATA PEGAWAI
    // =========================================================

    const { data: pegawai, error: pegawaiError } =
      await supabaseAdmin
        .from("pengguna")
        .select(
          "id, nama, username, role, status"
        )
        .eq("username", pegawaiUsername)
        .maybeSingle();

    if (pegawaiError) {
      console.error(
        "Error mengambil data pegawai:",
        pegawaiError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data pegawai.",
          error: pegawaiError.message,
        },
        { status: 500 }
      );
    }

    if (!pegawai) {
      return NextResponse.json(
        {
          success: false,
          message: "Pegawai tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // AMBIL HEADER PENILAIAN
    // =========================================================

    const {
      data: penilaian,
      error: penilaianError,
    } = await supabaseAdmin
      .from("v_pegawai_teladan_rekap_penilaian")
      .select("*")
      .eq("periode_id", periodeId)
      .eq(
        "pegawai_username",
        pegawaiUsername
      )
      .order("tanggal_dikirim", {
        ascending: false,
      });

    if (penilaianError) {
      console.error(
        "Error mengambil header penilaian:",
        penilaianError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil data penilaian.",
          error: penilaianError.message,
        },
        { status: 500 }
      );
    }

    // =========================================================
    // AMBIL DETAIL NILAI
    // =========================================================

    const {
      data: detail,
      error: detailError,
    } = await supabaseAdmin
      .from("v_pegawai_teladan_detail")
      .select("*")
      .eq("periode_id", periodeId)
      .eq(
        "pegawai_username",
        pegawaiUsername
      )
      .order("kode_kriteria", {
        ascending: true,
      });

    if (detailError) {
      console.error(
        "Error mengambil detail penilaian:",
        detailError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil detail penilaian.",
          error: detailError.message,
        },
        { status: 500 }
      );
    }

    // =========================================================
    // AMBIL DATA KRITERIA
    // =========================================================
    //
    // indikator dan pedoman_nilai berada di tabel
    // pegawai_teladan_kriteria, bukan pada view detail.
    //

    const {
      data: kriteria,
      error: kriteriaError,
    } = await supabaseAdmin
      .from("pegawai_teladan_kriteria")
      .select(`
        id,
        kode,
        nama_kriteria,
        deskripsi,
        indikator,
        pedoman_nilai,
        bobot,
        nilai_min,
        nilai_max,
        urutan,
        aktif
      `)
      .eq("aktif", true)
      .order("urutan", {
        ascending: true,
      });

    if (kriteriaError) {
      console.error(
        "Error mengambil kriteria:",
        kriteriaError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil data kriteria penilaian.",
          error: kriteriaError.message,
        },
        { status: 500 }
      );
    }

    // =========================================================
    // GABUNGKAN DETAIL + KRITERIA
    // =========================================================

    const detailDenganKriteria =
      (detail ?? []).map((item: any) => {
        const kriteriaItem =
          (kriteria ?? []).find(
            (k: any) =>
              String(k.kode).trim() ===
              String(
                item.kode_kriteria ?? ""
              ).trim()
          );

        return {
          ...item,

          indikator:
            kriteriaItem?.indikator ??
            null,

          pedoman_nilai:
            kriteriaItem?.pedoman_nilai ??
            null,

          deskripsi:
            kriteriaItem?.deskripsi ??
            null,

          nilai_min:
            kriteriaItem?.nilai_min ??
            0,

          nilai_max:
            kriteriaItem?.nilai_max ??
            100,

          urutan:
            kriteriaItem?.urutan ??
            null,
        };
      });

    // =========================================================
    // RESPONSE
    // =========================================================

    return NextResponse.json({
      success: true,

      periode,

      pegawai,

      penilaian:
        penilaian ?? [],

      detail:
        detailDenganKriteria,

      kriteria:
        kriteria ?? [],

      jumlah_penilaian:
        penilaian?.length ?? 0,

      jumlah_detail:
        detailDenganKriteria.length,
    });
  } catch (error: any) {
    console.error(
      "API detail rekap pegawai teladan error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server.",
        error:
          error?.message ??
          "Unknown error",
      },
      { status: 500 }
    );
  }
}