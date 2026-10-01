import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// =====================================================
// GET
// Mengambil daftar buku tamu
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const tanggal = searchParams.get("tanggal");
    const jenisPengunjung = searchParams.get("jenis_pengunjung");
    const search = searchParams.get("search");

    let query = supabaseAdmin
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
        alamat,
        instansi,
        jabatan,
        jenis_keperluan,
        keperluan,
        pengguna_tujuan_id,
        bertemu_dengan,
        jabatan_tujuan,
        tanda_tangan,
        keterangan,
        created_at
      `)
      .order("jam_kunjungan", {
        ascending: false,
      });

    if (tanggal) {
      query = query.eq("tanggal_kunjungan", tanggal);
    }

    if (jenisPengunjung) {
      query = query.eq(
        "jenis_pengunjung",
        jenisPengunjung
      );
    }

    if (search) {
      query = query.or(
        `nama.ilike.%${search}%,nik.ilike.%${search}%,instansi.ilike.%${search}%,nomor_kunjungan.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("GET BUKU TAMU:", error);

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

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("GET BUKU TAMU ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data buku tamu",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// POST
// Menyimpan kunjungan baru
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      jenis_pengunjung,
      nama,
      nik,
      no_hp,
      alamat,
      instansi,
      jabatan,
      jenis_keperluan,
      keperluan,
      pengguna_tujuan_id,
      tanda_tangan,
      keterangan,
    } = body;

    // -------------------------------------------------
    // VALIDASI JENIS PENGUNJUNG
    // -------------------------------------------------

    const jenisPengunjungValid = [
      "KLIEN_DEWASA",
      "KLIEN_ANAK",
      "TAMU_DINAS",
    ];

    if (!jenis_pengunjung) {
      return NextResponse.json(
        {
          success: false,
          message: "Jenis pengunjung wajib dipilih",
        },
        {
          status: 400,
        }
      );
    }

    if (!jenisPengunjungValid.includes(jenis_pengunjung)) {
      return NextResponse.json(
        {
          success: false,
          message: "Jenis pengunjung tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // VALIDASI NAMA
    // -------------------------------------------------

    if (!nama || !String(nama).trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama lengkap wajib diisi",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // VALIDASI KEPERLUAN
    // -------------------------------------------------

    if (
      !jenis_keperluan ||
      !String(jenis_keperluan).trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Jenis keperluan wajib dipilih",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // VALIDASI PETUGAS
    // -------------------------------------------------

    if (!pengguna_tujuan_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Petugas yang dituju wajib dipilih",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // CARI PEGAWAI
    // -------------------------------------------------

    const { data: pegawai, error: pegawaiError } =
      await supabaseAdmin
        .from("pengguna")
        .select("id, nama, username, role")
        .eq("id", pengguna_tujuan_id)
        .maybeSingle();

    if (pegawaiError) {
      console.error(
        "CARI PEGAWAI BUKU TAMU:",
        pegawaiError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mencari pegawai tujuan",
        },
        {
          status: 500,
        }
      );
    }

    if (!pegawai) {
      return NextResponse.json(
        {
          success: false,
          message: "Pegawai yang dituju tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }

    // -------------------------------------------------
    // KHUSUS TAMU DINAS
    // INSTANSI WAJIB
    // -------------------------------------------------

    if (
      jenis_pengunjung === "TAMU_DINAS" &&
      (!instansi || !String(instansi).trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Instansi wajib diisi untuk tamu dinas",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // TANDA TANGAN
    // -------------------------------------------------

    if (!tanda_tangan) {
      return NextResponse.json(
        {
          success: false,
          message: "Tanda tangan wajib diisi",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // GENERATE NOMOR KUNJUNGAN
    // -------------------------------------------------

    const {
      data: nomorKunjungan,
      error: nomorError,
    } = await supabaseAdmin.rpc(
      "generate_nomor_buku_tamu"
    );

    if (nomorError) {
      console.error(
        "GENERATE NOMOR BUKU TAMU:",
        nomorError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal membuat nomor kunjungan",
        },
        {
          status: 500,
        }
      );
    }

    // -------------------------------------------------
    // SIMPAN DATA
    // -------------------------------------------------

    const { data, error } = await supabaseAdmin
      .from("buku_tamu")
      .insert({
        nomor_kunjungan: nomorKunjungan,

        jenis_pengunjung,

        nama: String(nama).trim(),

        nik:
          nik && String(nik).trim()
            ? String(nik).trim()
            : null,

        no_hp:
          no_hp && String(no_hp).trim()
            ? String(no_hp).trim()
            : null,

        alamat:
          alamat && String(alamat).trim()
            ? String(alamat).trim()
            : null,

        instansi:
          instansi && String(instansi).trim()
            ? String(instansi).trim()
            : null,

        jabatan:
          jabatan && String(jabatan).trim()
            ? String(jabatan).trim()
            : null,

        jenis_keperluan:
          String(jenis_keperluan).trim(),

        keperluan:
          keperluan && String(keperluan).trim()
            ? String(keperluan).trim()
            : null,

        pengguna_tujuan_id:
          pengguna_tujuan_id,

        bertemu_dengan: pegawai.nama,

        jabatan_tujuan:
          pegawai.role || null,

        tanda_tangan,

        keterangan:
          keterangan && String(keterangan).trim()
            ? String(keterangan).trim()
            : null,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "INSERT BUKU TAMU:",
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

    return NextResponse.json(
      {
        success: true,
        message:
          "Kunjungan berhasil dicatat",
        data,
        nomor_kunjungan:
          nomorKunjungan,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST BUKU TAMU ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat menyimpan kunjungan",
      },
      {
        status: 500,
      }
    );
  }
}