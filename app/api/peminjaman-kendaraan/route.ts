import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/* =========================================================
   GET
   ========================================================= */

export async function GET() {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Belum login",
        },
        { status: 401 }
      );
    }

    const user =
      session.user as any;

    const namaLogin =
      user.name ||
      user.nama ||
      "";

    if (!namaLogin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Identitas pengguna tidak ditemukan",
        },
        { status: 400 }
      );
    }

    /* Cari data pengguna */

    const {
      data: pengguna,
      error: penggunaError,
    } = await supabase
      .from("pengguna")
      .select(`
        id,
        nama,
        username,
        role,
        status
      `)
      .eq("nama", namaLogin)
      .maybeSingle();

    if (penggunaError) {
      console.error(
        "GET CEK PENGGUNA:",
        penggunaError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil data pengguna",
        },
        { status: 500 }
      );
    }

    if (!pengguna) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Data pengguna tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const role =
      String(
        pengguna.role || ""
      ).toLowerCase();

    /*
     * Yang boleh melihat semua:
     * Admin
     * Admin Umum
     * Kaur Umum
     * Pimpinan
     */

    const bolehLihatSemua = [
      "admin",
      "admin umum",
      "kaur umum",
      "pimpinan",
    ].includes(role);

    /* Query utama */

    let query = supabase
      .from("peminjaman_kendaraan")
      .select(`
        id,
        kode_pengajuan,
        pengguna_id,
        nama_peminjam,
        nip,
        kendaraan_id,
        tanggal_peminjaman,
        jam_mulai,
        tujuan,
        keperluan,
        status,
        catatan_admin,
        disetujui_oleh,
        tanggal_persetujuan,
        jam_keluar,
        jam_kembali,
        km_awal,
        km_akhir,
        kondisi_awal,
        kondisi_akhir,
        catatan_pengembalian,
        created_at,
        updated_at,
        kendaraan:kendaraan_id (
          id,
          nama_kendaraan,
          nomor_polisi,
          jenis_kendaraan,
          status_kendaraan
        )
      `)
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    /*
     * Jika bukan pihak yang boleh melihat
     * seluruh data, hanya tampilkan miliknya
     * berdasarkan NIP.
     */

    if (!bolehLihatSemua) {
      query = query.eq(
        "nip",
        pengguna.username
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "GET PEMINJAMAN:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      role: pengguna.role,
      bolehLihatSemua,
    });
  } catch (error) {
    console.error(
      "ERROR GET PEMINJAMAN:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan server",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   Pengajuan baru
   ========================================================= */

export async function POST(
  req: NextRequest
) {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Belum login",
        },
        { status: 401 }
      );
    }

    const user =
      session.user as any;

    const namaLogin =
      user.name ||
      user.nama ||
      "";

    if (!namaLogin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Identitas pengguna tidak ditemukan",
        },
        { status: 400 }
      );
    }

    /* Cari pengguna */

    const {
      data: pengguna,
      error: penggunaError,
    } = await supabase
      .from("pengguna")
      .select(`
        id,
        nama,
        username,
        role,
        status
      `)
      .eq("nama", namaLogin)
      .maybeSingle();

    if (penggunaError) {
      console.error(
        "POST CEK PENGGUNA:",
        penggunaError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil data pengguna",
        },
        { status: 500 }
      );
    }

    if (!pengguna) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Data pengguna tidak ditemukan",
        },
        { status: 404 }
      );
    }

    if (
      String(
        pengguna.status || ""
      ).toLowerCase() !==
      "aktif"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Akun pengguna tidak aktif",
        },
        { status: 403 }
      );
    }

    /* Body */

    const body = await req.json();

    const {
      kendaraan_id,
      tanggal_peminjaman,
      jam_mulai,
      tujuan,
      keperluan,
    } = body;

    if (
      !kendaraan_id ||
      !tanggal_peminjaman ||
      !jam_mulai ||
      !tujuan ||
      !keperluan
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kendaraan, tanggal, jam mulai, tujuan dan keperluan wajib diisi",
        },
        { status: 400 }
      );
    }

    /* Cek kendaraan */

    const {
      data: kendaraan,
      error: kendaraanError,
    } = await supabase
      .from("kendaraan_dinas")
      .select(`
        id,
        nama_kendaraan,
        nomor_polisi,
        jenis_kendaraan,
        status_kendaraan
      `)
      .eq(
        "id",
        Number(kendaraan_id)
      )
      .eq(
        "status_kendaraan",
        "Tersedia"
      )
      .maybeSingle();

    if (kendaraanError) {
      console.error(
        "CEK KENDARAAN:",
        kendaraanError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengecek kendaraan",
        },
        { status: 500 }
      );
    }

    if (!kendaraan) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kendaraan tidak tersedia",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CEK BENTROK
       ===================================================== */

    const {
      data: bentrok,
      error: bentrokError,
    } = await supabase
      .from("peminjaman_kendaraan")
      .select(`
        id,
        kode_pengajuan,
        status
      `)
      .eq(
        "kendaraan_id",
        Number(kendaraan_id)
      )
      .eq(
        "tanggal_peminjaman",
        tanggal_peminjaman
      )
      .eq(
        "jam_mulai",
        jam_mulai
      )
      .in(
        "status",
        [
          "Menunggu Verifikasi",
          "Disetujui",
          "Digunakan",
        ]
      )
      .limit(1);

    if (bentrokError) {
      console.error(
        "CEK BENTROK:",
        bentrokError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengecek jadwal kendaraan",
        },
        { status: 500 }
      );
    }

    if (
      bentrok &&
      bentrok.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kendaraan sudah memiliki pengajuan pada tanggal dan jam tersebut",
        },
        { status: 409 }
      );
    }

    /* =====================================================
       GENERATE KODE
       ===================================================== */

    const tanggalKode =
      String(
        tanggal_peminjaman
      ).replaceAll(
        "-",
        ""
      );

    const {
      count,
      error: countError,
    } = await supabase
      .from("peminjaman_kendaraan")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        }
      )
      .eq(
        "tanggal_peminjaman",
        tanggal_peminjaman
      );

    if (countError) {
      console.error(
        "COUNT PENGAJUAN:",
        countError
      );
    }

    const nomor =
      String(
        (count || 0) + 1
      ).padStart(
        3,
        "0"
      );

    const kode_pengajuan =
      `PMD-${tanggalKode}-${nomor}`;

    /* =====================================================
       INSERT
       ===================================================== */

    const {
      data,
      error,
    } = await supabase
      .from("peminjaman_kendaraan")
      .insert({
        kode_pengajuan,

        /*
         * pengguna.id adalah BIGINT,
         * sedangkan pengguna_id pada tabel
         * peminjaman adalah UUID.
         *
         * Karena itu sementara identitas
         * pengguna disimpan melalui NIP.
         */
        pengguna_id: null,

        nama_peminjam:
          pengguna.nama,

        nip:
          pengguna.username,

        kendaraan_id:
          Number(kendaraan_id),

        tanggal_peminjaman,

        jam_mulai,

        tujuan,

        keperluan,

        status:
          "Menunggu Verifikasi",
      })
      .select(`
        id,
        kode_pengajuan,
        nama_peminjam,
        nip,
        kendaraan_id,
        tanggal_peminjaman,
        jam_mulai,
        tujuan,
        keperluan,
        status,
        catatan_admin,
        created_at,
        kendaraan:kendaraan_id (
          id,
          nama_kendaraan,
          nomor_polisi,
          jenis_kendaraan,
          status_kendaraan
        )
      `)
      .single();

    if (error) {
      console.error(
        "INSERT PEMINJAMAN:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Pengajuan peminjaman berhasil dibuat",
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "ERROR POST PEMINJAMAN:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan server",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH
   Hanya:
   - Kaur Umum
   - Admin Umum

   yang boleh approve / tolak
   ========================================================= */

export async function PATCH(
  req: NextRequest
) {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Belum login",
        },
        { status: 401 }
      );
    }

    const user =
      session.user as any;

    const namaLogin =
      user.name ||
      user.nama ||
      "";

    if (!namaLogin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Identitas pengguna tidak ditemukan",
        },
        { status: 400 }
      );
    }

    /* Cari pengguna */

    const {
      data: pengguna,
      error: penggunaError,
    } = await supabase
      .from("pengguna")
      .select(`
        id,
        nama,
        username,
        role,
        status
      `)
      .eq("nama", namaLogin)
      .maybeSingle();

    if (penggunaError) {
      console.error(
        "PATCH CEK PENGGUNA:",
        penggunaError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil data pengguna",
        },
        { status: 500 }
      );
    }

    if (!pengguna) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Data pengguna tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const role =
      String(
        pengguna.role || ""
      ).toLowerCase();

    /* =====================================================
       HANYA KAUR UMUM + ADMIN UMUM
       ===================================================== */

    const bolehVerifikasi = [
      "kaur umum",
      "admin umum",
    ].includes(role);

    if (!bolehVerifikasi) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Hanya Kaur Umum dan Admin Umum yang dapat menyetujui atau menolak pengajuan",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      id,
      status,
      catatan_admin,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ID pengajuan wajib diisi",
        },
        { status: 400 }
      );
    }

    if (
      ![
        "Disetujui",
        "Ditolak",
      ].includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Status tidak valid",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CEK PENGAJUAN
       ===================================================== */

    const {
      data: pengajuan,
      error: cekError,
    } = await supabase
      .from("peminjaman_kendaraan")
      .select(`
        id,
        kode_pengajuan,
        nama_peminjam,
        nip,
        status,
        kendaraan_id,
        tanggal_peminjaman,
        jam_mulai,
        tujuan,
        keperluan,
        kendaraan:kendaraan_id (
          id,
          nama_kendaraan,
          nomor_polisi
        )
      `)
      .eq(
        "id",
        id
      )
      .maybeSingle();

    if (cekError) {
      console.error(
        "CEK PENGAJUAN:",
        cekError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil pengajuan",
        },
        { status: 500 }
      );
    }

    if (!pengajuan) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pengajuan tidak ditemukan",
        },
        { status: 404 }
      );
    }

    if (
      pengajuan.status !==
      "Menunggu Verifikasi"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pengajuan sudah diproses sebelumnya",
        },
        { status: 409 }
      );
    }

    /* =====================================================
       JIKA DISETUJUI
       CEK SEKALI LAGI BENTROK
       ===================================================== */

    if (
      status === "Disetujui"
    ) {
      const {
        data: bentrok,
        error: bentrokError,
      } = await supabase
        .from("peminjaman_kendaraan")
        .select(`
          id,
          kode_pengajuan,
          status
        `)
        .eq(
          "kendaraan_id",
          pengajuan.kendaraan_id
        )
        .eq(
          "tanggal_peminjaman",
          pengajuan.tanggal_peminjaman
        )
        .eq(
          "jam_mulai",
          pengajuan.jam_mulai
        )
        .in(
          "status",
          [
            "Disetujui",
            "Digunakan",
          ]
        )
        .neq(
          "id",
          id
        )
        .limit(1);

      if (bentrokError) {
        console.error(
          "CEK BENTROK APPROVE:",
          bentrokError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Gagal mengecek jadwal kendaraan",
          },
          { status: 500 }
        );
      }

      if (
        bentrok &&
        bentrok.length > 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Kendaraan sudah digunakan atau sudah disetujui untuk pengajuan lain pada tanggal dan jam tersebut",
          },
          { status: 409 }
        );
      }
    }

    /* =====================================================
       UPDATE STATUS
       ===================================================== */

    const {
      data,
      error,
    } = await supabase
      .from("peminjaman_kendaraan")
      .update({
        status,

        catatan_admin:
          catatan_admin ||
          null,

        /*
         * Jangan isi disetujui_oleh dulu
         * karena kolom tersebut UUID,
         * sedangkan pengguna.id BIGINT.
         */

        disetujui_oleh:
          null,

        tanggal_persetujuan:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        id
      )
      .select(`
        id,
        kode_pengajuan,
        nama_peminjam,
        nip,
        kendaraan_id,
        tanggal_peminjaman,
        jam_mulai,
        tujuan,
        keperluan,
        status,
        catatan_admin,
        tanggal_persetujuan,
        created_at,
        updated_at,
        kendaraan:kendaraan_id (
          id,
          nama_kendaraan,
          nomor_polisi,
          jenis_kendaraan,
          status_kendaraan
        )
      `)
      .single();

    if (error) {
      console.error(
        "UPDATE STATUS PEMINJAMAN:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    /* =====================================================
       BUAT NOTIFIKASI PEMOHON
       ===================================================== */

    let notifikasiBerhasil = true;

    const namaKendaraan =
      (data as any)?.kendaraan?.nama_kendaraan ||
      "Kendaraan Dinas";

    const tanggalTampil =
      data.tanggal_peminjaman
        ? new Date(
            `${data.tanggal_peminjaman}T00:00:00`
          ).toLocaleDateString(
            "id-ID",
            {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }
          )
        : data.tanggal_peminjaman;

    let judul = "";
    let pesan = "";
    let tipe = "";

    if (status === "Disetujui") {
      judul =
        "Pengajuan Pinjam Mobil Disetujui";

      pesan =
        `Pengajuan ${data.kode_pengajuan} telah disetujui. ` +
        `Kendaraan: ${namaKendaraan}. ` +
        `Tanggal: ${tanggalTampil}. ` +
        `Jam mulai: ${data.jam_mulai}. ` +
        `Tujuan: ${data.tujuan}.`;

      tipe = "success";
    } else {
      judul =
        "Pengajuan Pinjam Mobil Ditolak";

      pesan =
        `Pengajuan ${data.kode_pengajuan} telah ditolak.`;

      if (data.catatan_admin) {
        pesan +=
          ` Alasan: ${data.catatan_admin}`;
      }

      tipe = "error";
    }

    /*
     * NIP pemohon digunakan sebagai penerima
     * karena pengguna.id BIGINT sedangkan
     * pengguna_id pada tabel peminjaman UUID.
     */
    if (data.nip) {
      const {
        error: notifikasiError,
      } = await supabase
        .from("notifikasi")
        .insert({
          nip_penerima: data.nip,
          judul,
          pesan,
          tipe,
          dibaca: false,
          referensi_id: data.id,
          referensi_kode:
            data.kode_pengajuan,
        });

      if (notifikasiError) {
        notifikasiBerhasil = false;

        console.error(
          "GAGAL MEMBUAT NOTIFIKASI:",
          notifikasiError
        );
      }
    } else {
      notifikasiBerhasil = false;

      console.error(
        "NOTIFIKASI TIDAK DIBUAT: NIP PEMOHON KOSONG"
      );
    }

    /* =====================================================
       RESPONSE
       ===================================================== */

    return NextResponse.json({
      success: true,

      message:
        status === "Disetujui"
          ? "Pengajuan berhasil disetujui"
          : "Pengajuan berhasil ditolak",

      data,

      notifikasi: notifikasiBerhasil,
    });
  } catch (error) {
    console.error(
      "ERROR PATCH PEMINJAMAN:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan server",
      },
      { status: 500 }
    );
  }
}