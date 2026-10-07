import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * =========================================================
 * GET
 * Mengambil notifikasi milik pengguna yang sedang login.
 *
 * Default  : 20 notifikasi terbaru
 * ?semua=true : semua notifikasi
 * =========================================================
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Belum login",
        },
        { status: 401 }
      );
    }

    /*
     * Ambil identitas pengguna dari session.
     *
     * SIMASDI menggunakan beberapa kemungkinan field
     * karena session sudah mengalami beberapa pengembangan.
     */
    const username =
      (session.user as any)?.username ||
      (session as any)?.username ||
      "";

    const namaLogin =
      session.user.name ||
      (session.user as any)?.nama ||
      "";

    /*
     * Prioritas pencarian:
     * 1. username/NIP dari session
     * 2. nama pengguna
     */
    let pengguna: {
      id: string;
      nama: string;
      username: string;
      role: string;
    } | null = null;

    /*
     * -------------------------------------------------------
     * CARI BERDASARKAN USERNAME
     * -------------------------------------------------------
     */
    if (username) {
      const { data, error } = await supabaseAdmin
        .from("pengguna")
        .select("id, nama, username, role")
        .eq("username", username)
        .maybeSingle();

      if (error) {
        console.error(
          "ERROR CARI PENGGUNA BERDASARKAN USERNAME:",
          error
        );
      }

      if (data) {
        pengguna = data;
      }
    }

    /*
     * -------------------------------------------------------
     * FALLBACK CARI BERDASARKAN NAMA
     * -------------------------------------------------------
     */
    if (!pengguna && namaLogin) {
      const { data, error } = await supabaseAdmin
        .from("pengguna")
        .select("id, nama, username, role")
        .eq("nama", namaLogin)
        .maybeSingle();

      if (error) {
        console.error(
          "ERROR CARI PENGGUNA BERDASARKAN NAMA:",
          error
        );
      }

      if (data) {
        pengguna = data;
      }
    }

    /*
     * -------------------------------------------------------
     * PENGGUNA TIDAK DITEMUKAN
     * -------------------------------------------------------
     */
    if (!pengguna) {
      return NextResponse.json(
        {
          success: false,
          message: "Data pengguna tidak ditemukan",
        },
        { status: 404 }
      );
    }
/*
 * -------------------------------------------------------
 * NOTIFIKASI ULANG TAHUN PEGAWAI
 *
 * Tanggal lahir diambil dari 8 digit pertama NIP:
 * YYYYMMDD
 *
 * Penerima:
 * 1. Pegawai yang sedang berulang tahun
 * 2. Admin
 * 3. Kaur Umum
 * -------------------------------------------------------
 */

const nip = pengguna.username || "";

// Ambil tanggal Jakarta
const tanggalSekarang = new Intl.DateTimeFormat(
  "en-CA",
  {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }
).formatToParts(new Date());

const tahunSekarang =
  tanggalSekarang.find(
    (p) => p.type === "year"
  )?.value || "";

const bulanSekarang =
  tanggalSekarang.find(
    (p) => p.type === "month"
  )?.value || "";

const hariSekarang =
  tanggalSekarang.find(
    (p) => p.type === "day"
  )?.value || "";

/*
 * Cari pegawai yang ulang tahun hari ini.
 *
 * Username harus NIP 18 digit dan
 * 8 digit pertama berformat YYYYMMDD.
 */
const { data: pegawaiUlangTahun, error: errorPegawai } =
  await supabaseAdmin
    .from("pengguna")
    .select("id, nama, username, role")
    .like("username", "______________%");

if (errorPegawai) {
  console.error(
    "ERROR CARI PEGAWAI ULANG TAHUN:",
    errorPegawai
  );
} else if (pegawaiUlangTahun) {
  const daftarUlangTahun =
    pegawaiUlangTahun.filter((pegawai) => {
      const nipPegawai =
        pegawai.username || "";

      if (!/^\d{18}$/.test(nipPegawai)) {
        return false;
      }

      const bulanLahir =
        nipPegawai.substring(4, 6);

      const hariLahir =
        nipPegawai.substring(6, 8);

      return (
        bulanLahir === bulanSekarang &&
        hariLahir === hariSekarang
      );
    });

  /*
   * Proses setiap pegawai yang ulang tahun hari ini.
   */
  for (const pegawai of daftarUlangTahun) {
    const nipUlangTahun =
      pegawai.username;

    const referensiKodeDasar =
      `ULTAH-${tahunSekarang}-${nipUlangTahun}`;

    /*
     * Penerima:
     * - Pegawai yang ulang tahun
     * - Admin
     * - Kaur Umum
     */
    const penerima = new Set<string>();

    penerima.add(nipUlangTahun);

    const { data: adminKaurUmum } =
      await supabaseAdmin
        .from("pengguna")
        .select("username, role")
        .in("role", [
          "Admin",
          "Kaur Umum",
        ]);

    if (adminKaurUmum) {
      for (const penerimaData of adminKaurUmum) {
        if (penerimaData.username) {
          penerima.add(
            penerimaData.username
          );
        }
      }
    }

    /*
     * Buat notifikasi untuk setiap penerima.
     */
    for (const nipPenerima of penerima) {
      const referensiKode =
        `${referensiKodeDasar}-${nipPenerima}`;

      const {
  data: riwayatSudahAda,
  error: cekRiwayatError,
} = await supabaseAdmin
  .from("notifikasi_riwayat")
  .select("id")
  .eq(
    "nip_penerima",
    nipPenerima
  )
  .eq(
    "referensi_kode",
    referensiKode
  )
  .maybeSingle();

if (cekRiwayatError) {
  console.error(
    "ERROR CEK RIWAYAT NOTIFIKASI ULANG TAHUN:",
    cekRiwayatError
  );
  continue;
}

    if (cekRiwayatError) {
  console.error(
    "ERROR CEK RIWAYAT NOTIFIKASI ULANG TAHUN:",
    cekRiwayatError
  );
  continue;
}
    if (!riwayatSudahAda) {
        const { error: insertError } =
          await supabaseAdmin
            .from("notifikasi")
            .insert({
              nip_penerima:
                nipPenerima,
              judul:
                "🎂 Ulang Tahun Pegawai",
              pesan:
                `Hari ini adalah ulang tahun ${pegawai.nama}. Semoga senantiasa diberikan kesehatan, kebahagiaan, dan kesuksesan dalam menjalankan tugas.`,
              tipe:
                "ulang_tahun",
              dibaca: false,
              referensi_id: null,
              referensi_kode:
                referensiKode,
            });

        if (insertError) {
          console.error(
            "ERROR BUAT NOTIFIKASI ULANG TAHUN:",
            insertError
          );
        }
        else {
  const { error: riwayatError } =
    await supabaseAdmin
      .from("notifikasi_riwayat")
      .insert({
        nip_penerima: nipPenerima,
        referensi_kode: referensiKode,
      });

  if (riwayatError) {
    console.error(
      "ERROR SIMPAN RIWAYAT NOTIFIKASI ULANG TAHUN:",
      riwayatError
    );
  }
}
      }
    }
  }
}
    /*
     * -------------------------------------------------------
     * AMBIL NOTIFIKASI
     * -------------------------------------------------------
     */

    const { searchParams } = new URL(request.url);

    const semua =
      searchParams.get("semua") === "true";

    let query = supabaseAdmin
      .from("notifikasi")
      .select("*")
      .eq("nip_penerima", pengguna.username)
      .order("created_at", {
        ascending: false,
      });

    if (!semua) {
      query = query.limit(20);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "ERROR AMBIL NOTIFIKASI:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil notifikasi",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      jumlah: data?.length || 0,
    });
  } catch (error: any) {
    console.error(
      "ERROR GET NOTIFIKASI:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat mengambil notifikasi",
        error:
          error?.message ||
          "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * =========================================================
 * POST
 * Membuat notifikasi baru.
 *
 * Digunakan antara lain untuk:
 * Pinjam Mobil Dinas
 * =========================================================
 */
export async function POST(request: Request) {
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

    const body = await request.json();

    const {
      nip_penerima,
      judul,
      pesan,
      tipe,
      referensi_id,
      referensi_kode,
    } = body;

    if (
      !nip_penerima ||
      !judul ||
      !pesan
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "nip_penerima, judul, dan pesan wajib diisi",
        },
        { status: 400 }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("notifikasi")
        .insert({
          nip_penerima,
          judul,
          pesan,
          tipe: tipe || "info",
          dibaca: false,
          referensi_id:
            referensi_id || null,
          referensi_kode:
            referensi_kode || null,
        })
        .select("*")
        .single();

    if (error) {
      console.error(
        "ERROR BUAT NOTIFIKASI:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal membuat notifikasi",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Notifikasi berhasil dibuat",
      data,
    });
  } catch (error: any) {
    console.error(
      "ERROR POST NOTIFIKASI:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat membuat notifikasi",
        error:
          error?.message ||
          "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * =========================================================
 * PATCH
 *
 * Menandai:
 * - satu notifikasi sebagai sudah dibaca
 * - atau semua notifikasi sebagai sudah dibaca
 *
 * Body satu:
 * {
 *   id: "uuid"
 * }
 *
 * Body semua:
 * {
 *   semua: true
 * }
 * =========================================================
 */
export async function PATCH(request: Request) {
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

    const username =
      (session.user as any)?.username ||
      (session as any)?.username ||
      "";

    const namaLogin =
      session.user.name ||
      (session.user as any)?.nama ||
      "";

    let pengguna: {
      username: string;
    } | null = null;

    /*
     * Cari berdasarkan username
     */
    if (username) {
      const { data, error } =
        await supabaseAdmin
          .from("pengguna")
          .select("username")
          .eq("username", username)
          .maybeSingle();

      if (error) {
        console.error(
          "ERROR CARI USER PATCH:",
          error
        );
      }

      if (data) {
        pengguna = data;
      }
    }

    /*
     * Fallback berdasarkan nama
     */
    if (!pengguna && namaLogin) {
      const { data, error } =
        await supabaseAdmin
          .from("pengguna")
          .select("username")
          .eq("nama", namaLogin)
          .maybeSingle();

      if (error) {
        console.error(
          "ERROR CARI USER PATCH BERDASARKAN NAMA:",
          error
        );
      }

      if (data) {
        pengguna = data;
      }
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

    const body = await request.json();

    const id = body?.id;
    const semua = body?.semua === true;

    /*
     * -------------------------------------------------------
     * TANDAI SEMUA
     * -------------------------------------------------------
     */
    if (semua) {
   const { error } =
  await supabaseAdmin
    .from("notifikasi")
    .delete()
    .eq(
      "nip_penerima",
      pengguna.username
    )
    .eq("dibaca", false);

      if (error) {
        console.error(
          "ERROR BACA SEMUA NOTIFIKASI:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Gagal menandai semua notifikasi",
            error: error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          "Semua notifikasi telah dibaca",
      });
    }

    /*
     * -------------------------------------------------------
     * ID WAJIB UNTUK SATU NOTIFIKASI
     * -------------------------------------------------------
     */
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ID notifikasi wajib diisi",
        },
        { status: 400 }
      );
    }

    /*
     * Pastikan notifikasi memang milik
     * pengguna yang sedang login.
     */
    const {
      data: notifikasi,
      error: cekError,
    } = await supabaseAdmin
      .from("notifikasi")
      .select("id")
      .eq("id", id)
      .eq(
        "nip_penerima",
        pengguna.username
      )
      .maybeSingle();

    if (cekError) {
      console.error(
        "ERROR CEK NOTIFIKASI:",
        cekError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal memeriksa notifikasi",
          error: cekError.message,
        },
        { status: 500 }
      );
    }

    if (!notifikasi) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Notifikasi tidak ditemukan",
        },
        { status: 404 }
      );
    }

    /*
     * -------------------------------------------------------
     * UPDATE SATU NOTIFIKASI
     * -------------------------------------------------------
     */
 const { error } =
  await supabaseAdmin
    .from("notifikasi")
    .delete()
    .eq("id", id)
    .eq(
      "nip_penerima",
      pengguna.username
    );

if (error) {
  console.error(
    "ERROR HAPUS NOTIFIKASI:",
    error
  );

  return NextResponse.json(
    {
      success: false,
      message:
        "Gagal menghapus notifikasi",
      error: error.message,
    },
    { status: 500 }
  );
}

return NextResponse.json({
  success: true,
  message:
    "Notifikasi telah dihapus",
});
  } catch (error: any) {
    console.error(
      "ERROR PATCH NOTIFIKASI:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat memperbarui notifikasi",
        error:
          error?.message ||
          "Unknown error",
      },
      { status: 500 }
    );
  }
}