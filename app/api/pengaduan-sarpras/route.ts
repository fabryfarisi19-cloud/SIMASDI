import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

/*
|--------------------------------------------------------------------------
| KONFIGURASI
|--------------------------------------------------------------------------
*/

const KATEGORI_VALID = [
  "Komputer/Laptop",
  "Printer",
  "AC",
  "Listrik/Penerangan",
  "Toilet/Sanitasi",
  "Meubelair",
  "Kendaraan",
  "Gedung/Ruangan",
  "Jaringan/Internet",
  "Mobil Dinas",
  "Lainnya",
];

const STATUS_VALID = [
  "Menunggu",
  "Diproses",
  "Menunggu Perbaikan/Pihak Ketiga",
  "Selesai",
  "Ditolak",
];

const ROLE_LIHAT_SEMUA = [
  "admin",
  "admin umum",
  "kaur umum",
  "pimpinan",
];

const ROLE_KELOLA = [
  "admin umum",
  "kaur umum",
];

/*
|--------------------------------------------------------------------------
| HELPER SESSION
|--------------------------------------------------------------------------
*/

async function getPenggunaLogin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      session: null,
      pengguna: null,
      role: "",
    };
  }

  const namaLogin =
    (session.user as any)?.name ||
    (session.user as any)?.nama ||
    "";

  const usernameSession =
    (session.user as any)?.username ||
    "";

  let pengguna = null;

  /*
   * Prioritas pertama:
   * cari berdasarkan username/NIP jika tersedia di session.
   */
  if (usernameSession) {
    const { data } = await supabaseAdmin
      .from("pengguna")
      .select("*")
      .eq("username", usernameSession)
      .maybeSingle();

    pengguna = data;
  }

  /*
   * Jika belum ditemukan, cari berdasarkan nama.
   */
  if (!pengguna && namaLogin) {
    const { data } = await supabaseAdmin
      .from("pengguna")
      .select("*")
      .eq("nama", namaLogin)
      .maybeSingle();

    pengguna = data;
  }

  /*
   * Fallback role dari session jika data pengguna
   * tidak ditemukan.
   */
  const roleSession =
    (session.user as any)?.role ||
    (session.user as any)?.jabatan ||
    "";

  const role = String(
    pengguna?.role || roleSession || ""
  )
    .trim()
    .toLowerCase();

  return {
    session,
    pengguna,
    role,
  };
}

/*
|--------------------------------------------------------------------------
| HELPER NOMOR LAPORAN
|--------------------------------------------------------------------------
|
| Format:
| PS-20260924-001
|
*/

async function generateNomorLaporan() {
  const sekarang = new Date();

  const tahun = sekarang.getFullYear();

  const bulan = String(
    sekarang.getMonth() + 1
  ).padStart(2, "0");

  const tanggal = String(
    sekarang.getDate()
  ).padStart(2, "0");

  const prefix = `PS-${tahun}${bulan}${tanggal}-`;

  /*
   * Ambil laporan dengan prefix tanggal yang sama.
   */
  const { data, error } = await supabaseAdmin
    .from("pengaduan_sarpras")
    .select("nomor_laporan")
    .like("nomor_laporan", `${prefix}%`)
    .order("nomor_laporan", {
      ascending: false,
    })
    .limit(1);

  if (error) {
    throw new Error(
      `Gagal membuat nomor laporan: ${error.message}`
    );
  }

  let nomorUrut = 1;

  if (data && data.length > 0) {
    const nomorTerakhir =
      data[0]?.nomor_laporan || "";

    const bagianNomor =
      nomorTerakhir.split("-").pop();

    const angkaTerakhir = Number(
      bagianNomor
    );

    if (
      Number.isFinite(angkaTerakhir) &&
      angkaTerakhir > 0
    ) {
      nomorUrut = angkaTerakhir + 1;
    }
  }

  return `${prefix}${String(
    nomorUrut
  ).padStart(3, "0")}`;
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
|
| Pegawai:
|   hanya melihat laporan sendiri
|
| Admin Umum / Kaur Umum / Pimpinan:
|   melihat seluruh laporan
|
*/

export async function GET(request: Request) {
  try {
    const {
      session,
      pengguna,
      role,
    } = await getPenggunaLogin();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Silakan login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    if (!pengguna) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Data pengguna tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const statusFilter =
      searchParams.get("status") || "";

    const kategoriFilter =
      searchParams.get("kategori") || "";

    const semuaParam =
      searchParams.get("semua");

    const bolehLihatSemua =
      ROLE_LIHAT_SEMUA.includes(role);

    let query = supabaseAdmin
      .from("pengaduan_sarpras")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    /*
     * Pegawai biasa hanya melihat laporan
     * miliknya sendiri.
     */
    if (!bolehLihatSemua) {
      query = query.eq(
        "nip_pelapor",
        pengguna.username
      );
    }

    /*
     * Filter status jika diberikan.
     */
    if (
      statusFilter &&
      STATUS_VALID.includes(statusFilter)
    ) {
      query = query.eq(
        "status",
        statusFilter
      );
    }

    /*
     * Filter kategori jika diberikan.
     */
    if (
      kategoriFilter &&
      KATEGORI_VALID.includes(
        kategoriFilter
      )
    ) {
      query = query.eq(
        "kategori",
        kategoriFilter
      );
    }

    /*
     * Parameter semua=true boleh digunakan
     * untuk kebutuhan rekap.
     */
    if (semuaParam === "true") {
      query = query.limit(1000);
    } else {
      query = query.limit(100);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "GET PENGADUAN ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil data pengaduan.",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      role,
      bolehLihatSemua,
      bolehKelola: ROLE_KELOLA.includes(role),
      kategori: KATEGORI_VALID,
      status: STATUS_VALID,
    });
  } catch (error: any) {
    console.error(
      "GET PENGADUAN EXCEPTION:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server.",
        error:
          error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
|
| Membuat laporan baru.
|
| Field:
| - kategori
| - lokasi
| - uraian
| - foto_url (opsional)
|
*/

export async function POST(request: Request) {
  try {
    const {
      session,
      pengguna,
    } = await getPenggunaLogin();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Silakan login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    if (!pengguna) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Data pengguna tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    /*
     * Pastikan pengguna aktif.
     */
    if (
      pengguna.status &&
      String(
        pengguna.status
      ).toLowerCase() !== "aktif"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Akun pengguna tidak aktif.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const kategori = String(
      body?.kategori || ""
    ).trim();

    const lokasi = String(
      body?.lokasi || ""
    ).trim();

    const uraian = String(
      body?.uraian || ""
    ).trim();

    const fotoUrl =
      body?.foto_url
        ? String(body.foto_url).trim()
        : null;

    /*
     * Validasi.
     */
    if (!kategori) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kategori pengaduan wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (
      !KATEGORI_VALID.includes(kategori)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kategori pengaduan tidak valid.",
        },
        { status: 400 }
      );
    }

    if (!lokasi) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Lokasi kerusakan wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!uraian) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Uraian pengaduan wajib diisi.",
        },
        { status: 400 }
      );
    }

    /*
     * Batasi panjang input agar data tetap aman
     * dan rapi.
     */
    if (lokasi.length > 500) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Lokasi terlalu panjang.",
        },
        { status: 400 }
      );
    }

    if (uraian.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Uraian terlalu panjang.",
        },
        { status: 400 }
      );
    }

    /*
     * Generate nomor laporan.
     */
    const nomorLaporan =
      await generateNomorLaporan();

    /*
     * Simpan laporan.
     */
    const { data, error } =
      await supabaseAdmin
        .from("pengaduan_sarpras")
        .insert({
          nomor_laporan:
            nomorLaporan,

          /*
           * pengguna.id pada tabel pengguna
           * berupa bigint.
           */
          pengguna_id:
            pengguna.id ?? null,

          nip_pelapor:
            pengguna.username || null,

          nama_pelapor:
            pengguna.nama || "Pengguna",

          kategori,

          lokasi,

          uraian,

          foto_url: fotoUrl,

          status: "Menunggu",

          catatan_petugas: null,

          tindak_lanjut: null,

          ditangani_oleh: null,

          tanggal_diproses: null,

          tanggal_selesai: null,
        })
        .select("*")
        .single();

    if (error) {
      console.error(
        "POST PENGADUAN ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal menyimpan pengaduan.",
          error: error.message,
        },
        { status: 500 }
      );
    }

    /*
     * Buat notifikasi untuk pengelola.
     *
     * Tidak menggagalkan laporan apabila
     * notifikasi gagal dibuat.
     */
    let notifikasiBerhasil =
      false;

    try {
      const { data: pengelolaList } =
        await supabaseAdmin
          .from("pengguna")
          .select("username, nama, role")
          .in("role", [
            "Kaur Umum",
            "Admin Umum",
            "kaur umum",
            "admin umum",
          ])
          .eq("status", "Aktif");

      if (
        pengelolaList &&
        pengelolaList.length > 0
      ) {
        const notifikasi =
          pengelolaList
            .filter(
              (p: any) =>
                p.username
            )
            .map((p: any) => ({
              nip_penerima:
                p.username,

              judul:
                "Pengaduan Sarpras Baru",

              pesan:
                `Laporan ${nomorLaporan} dari ${pengguna.nama} membutuhkan pemeriksaan. ` +
                `Kategori: ${kategori}. Lokasi: ${lokasi}.`,

              tipe: "info",

              dibaca: false,

              referensi_id:
                data.id,

              referensi_kode:
                nomorLaporan,
            }));

        if (notifikasi.length > 0) {
          const {
            error:
              notifikasiError,
          } = await supabaseAdmin
            .from("notifikasi")
            .insert(notifikasi);

          if (!notifikasiError) {
            notifikasiBerhasil =
              true;
          } else {
            console.error(
              "NOTIFIKASI PENGADUAN ERROR:",
              notifikasiError
            );
          }
        }
      }
    } catch (notifikasiError) {
      console.error(
        "NOTIFIKASI PENGADUAN EXCEPTION:",
        notifikasiError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Pengaduan berhasil dikirim.",
        data,
        notifikasi:
          notifikasiBerhasil,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "POST PENGADUAN EXCEPTION:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server.",
        error:
          error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH
|--------------------------------------------------------------------------
|
| Hanya Kaur Umum / Admin Umum yang dapat
| mengubah status dan tindak lanjut.
|
*/

export async function PATCH(request: Request) {
  try {
    const {
      session,
      pengguna,
      role,
    } = await getPenggunaLogin();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Silakan login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    if (!pengguna) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Data pengguna tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    /*
     * Hanya Kaur Umum dan Admin Umum
     * yang dapat mengelola laporan.
     */
    if (!ROLE_KELOLA.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Hanya Kaur Umum dan Admin Umum yang dapat memproses pengaduan.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const id = String(
      body?.id || ""
    ).trim();

    const status = String(
      body?.status || ""
    ).trim();

    const catatanPetugas =
      body?.catatan_petugas !==
      undefined
        ? String(
            body.catatan_petugas || ""
          ).trim()
        : undefined;

    const tindakLanjut =
      body?.tindak_lanjut !==
      undefined
        ? String(
            body.tindak_lanjut || ""
          ).trim()
        : undefined;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ID laporan wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Status laporan wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (
      !STATUS_VALID.includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Status laporan tidak valid.",
        },
        { status: 400 }
      );
    }

    /*
     * Ambil data lama.
     */
    const {
      data: laporanLama,
      error:
        laporanError,
    } = await supabaseAdmin
      .from("pengaduan_sarpras")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (laporanError) {
      console.error(
        "GET LAPORAN PATCH ERROR:",
        laporanError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil data laporan.",
          error:
            laporanError.message,
        },
        { status: 500 }
      );
    }

    if (!laporanLama) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Laporan tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    /*
     * Tentukan timestamp.
     */
    const sekarang =
      new Date().toISOString();

    const updateData: any = {
      status,
      updated_at: sekarang,
    };

    /*
     * Catatan petugas hanya diubah
     * apabila field dikirim.
     */
    if (
      catatanPetugas !==
      undefined
    ) {
      updateData.catatan_petugas =
        catatanPetugas ||
        null;
    }

    /*
     * Tindak lanjut hanya diubah
     * apabila field dikirim.
     */
    if (
      tindakLanjut !==
      undefined
    ) {
      updateData.tindak_lanjut =
        tindakLanjut ||
        null;
    }

    /*
     * Jika mulai diproses.
     */
    if (
      status === "Diproses" &&
      laporanLama.status !==
        "Diproses"
    ) {
      updateData.tanggal_diproses =
        sekarang;
    }

    /*
     * Jika selesai.
     */
    if (
      status === "Selesai"
    ) {
      updateData.tanggal_selesai =
        sekarang;
    }

    /*
     * Jika kembali ke Menunggu,
     * tanggal proses tidak perlu dihapus.
     *
     * Ini menjaga histori sederhana.
     */

    updateData.ditangani_oleh =
      pengguna.nama ||
      pengguna.username ||
      null;

    /*
     * Simpan perubahan.
     */
    const {
      data,
      error,
    } = await supabaseAdmin
      .from("pengaduan_sarpras")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error(
        "PATCH PENGADUAN ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal memperbarui pengaduan.",
          error: error.message,
        },
        { status: 500 }
      );
    }

    /*
     * Buat notifikasi kepada pelapor.
     */
    let notifikasiBerhasil =
      false;

    try {
      if (data.nip_pelapor) {
        let judul =
          "Pembaruan Pengaduan Sarpras";

        let tipe =
          "info";

        if (
          status === "Diproses"
        ) {
          judul =
            "Pengaduan Sarpras Sedang Diproses";
          tipe = "info";
        }

        if (
          status ===
          "Menunggu Perbaikan/Pihak Ketiga"
        ) {
          judul =
            "Pengaduan Sarpras Menunggu Perbaikan";
          tipe = "info";
        }

        if (
          status === "Selesai"
        ) {
          judul =
            "Pengaduan Sarpras Selesai";
          tipe = "success";
        }

        if (
          status === "Ditolak"
        ) {
          judul =
            "Pengaduan Sarpras Ditolak";
          tipe = "error";
        }

        let pesan =
          `Laporan ${data.nomor_laporan} sekarang berstatus ${status}.`;

        if (
          data.tindak_lanjut
        ) {
          pesan +=
            ` Tindak lanjut: ${data.tindak_lanjut}.`;
        }

        if (
          data.catatan_petugas
        ) {
          pesan +=
            ` Catatan: ${data.catatan_petugas}.`;
        }

        const {
          error:
            notifError,
        } = await supabaseAdmin
          .from("notifikasi")
          .insert({
            nip_penerima:
              data.nip_pelapor,

            judul,

            pesan,

            tipe,

            dibaca: false,

            referensi_id:
              data.id,

            referensi_kode:
              data.nomor_laporan,
          });

        if (!notifError) {
          notifikasiBerhasil =
            true;
        } else {
          console.error(
            "NOTIFIKASI STATUS ERROR:",
            notifError
          );
        }
      }
    } catch (notificationError) {
      console.error(
        "NOTIFIKASI STATUS EXCEPTION:",
        notificationError
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Pengaduan berhasil diperbarui.",
      data,
      notifikasi:
        notifikasiBerhasil,
    });
  } catch (error: any) {
    console.error(
      "PATCH PENGADUAN EXCEPTION:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server.",
        error:
          error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
|
| Untuk keamanan, penghapusan laporan dibatasi
| hanya untuk Admin.
|
*/

export async function DELETE(
  request: Request
) {
  try {
    const {
      session,
      role,
    } = await getPenggunaLogin();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Silakan login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    /*
     * Hanya Admin yang dapat menghapus.
     * Kaur Umum dan Admin Umum tidak diberi
     * hak hapus melalui API ini.
     */
    if (role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Hanya Admin yang dapat menghapus laporan.",
        },
        { status: 403 }
      );
    }

    const body =
      await request.json();

    const id = String(
      body?.id || ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ID laporan wajib diisi.",
        },
        { status: 400 }
      );
    }

    /*
     * Ambil data sebelum dihapus.
     */
    const {
      data: laporan,
      error:
        laporanError,
    } = await supabaseAdmin
      .from("pengaduan_sarpras")
      .select(
        "id, nomor_laporan, nip_pelapor"
      )
      .eq("id", id)
      .maybeSingle();

    if (laporanError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil laporan.",
          error:
            laporanError.message,
        },
        { status: 500 }
      );
    }

    if (!laporan) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Laporan tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    /*
     * Hapus laporan.
     */
    const {
      error,
    } = await supabaseAdmin
      .from("pengaduan_sarpras")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "DELETE PENGADUAN ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal menghapus laporan.",
          error: error.message,
        },
        { status: 500 }
      );
    }

    /*
     * Hapus notifikasi yang berkaitan
     * dengan laporan tersebut.
     */
    try {
      await supabaseAdmin
        .from("notifikasi")
        .delete()
        .eq(
          "referensi_id",
          laporan.id
        );
    } catch (notificationError) {
      console.error(
        "GAGAL HAPUS NOTIFIKASI:",
        notificationError
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Laporan berhasil dihapus.",
    });
  } catch (error: any) {
    console.error(
      "DELETE PENGADUAN EXCEPTION:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server.",
        error:
          error?.message || String(error),
      },
      { status: 500 }
    );
  }
}