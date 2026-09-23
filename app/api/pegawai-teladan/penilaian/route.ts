import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * ============================================================
 * ROLE PENILAI
 * ============================================================
 *
 * Role berikut diperbolehkan memberikan nilai.
 *
 * Pengelola Kepegawaian TIDAK termasuk di sini.
 */
function isPenilai(role: string | null | undefined) {
  if (!role) return false;

  const normalized = role.trim();

  return (
    normalized === "Kabapas" ||
    normalized === "Kasubag TU" ||
    normalized === "Kaur Kepegawaian" ||
    normalized === "Kaur Umum" ||
    normalized === "Kaur Keuangan" ||
    normalized.startsWith("Kasi ") ||
    normalized.startsWith("Kasubsi ")
  );
}

/**
 * ============================================================
 * ROLE PENGELOLA
 * ============================================================
 *
 * Pengelola Kepegawaian:
 * - boleh membuka menu Pegawai Teladan
 * - boleh melihat data
 * - boleh memantau penilaian
 * - boleh melihat rekap
 * - TIDAK boleh memberikan nilai
 */
function isPengelola(role: string | null | undefined) {
  if (!role) return false;

  return role.trim() === "Pengelola Kepegawaian";
}

/**
 * ============================================================
 * ROLE YANG BOLEH MENGAKSES DATA PEGAWAI TELADAN
 * ============================================================
 */
function isBolehAkses(role: string | null | undefined) {
  return isPenilai(role) || isPengelola(role);
}

/**
 * ============================================================
 * OBJEK PENILAIAN
 * ============================================================
 *
 * PPNPN, akun sistem, dan akun pelayanan teknis
 * tidak menjadi objek Pegawai Teladan.
 */
function isObjekPenilaian(role: string | null | undefined) {
  if (!role) return false;

  const normalized = role.trim();

  const excludedRoles = [
    "PPNPN",
    "Admin",
    "Display",
    "Kiosk",
    "Petugas",
  ];

  if (excludedRoles.includes(normalized)) {
    return false;
  }

  return true;
}

/**
 * ============================================================
 * GET
 * ============================================================
 *
 * Penilai:
 * - melihat objek pegawai
 * - melihat penilaian miliknya sendiri
 *
 * Pengelola Kepegawaian:
 * - melihat objek pegawai
 * - melihat SELURUH penilaian periode
 * - tidak menjadi penilai
 *
 * Query:
 * /api/pegawai-teladan/penilaian?periode_id=UUID
 */
export async function GET(request: Request) {
  try {
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

    const role = String(
      (session as any).role ??
        (session.user as any)?.role ??
        (session.user as any)?.jabatan ??
        ""
    ).trim();

    const username = String(
      (session as any).username ??
        (session.user as any)?.username ??
        ""
    ).trim();

    /**
     * ========================================================
     * CEK AKSES
     * ========================================================
     */
    if (!isBolehAkses(role)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Akun Anda tidak memiliki kewenangan untuk mengakses Pegawai Teladan.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const periodeId = searchParams.get("periode_id");

    if (!periodeId) {
      return NextResponse.json(
        {
          success: false,
          message: "periode_id wajib diisi.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 1. AMBIL PERIODE
    // ============================================================

    const { data: periode, error: periodeError } =
      await supabaseAdmin
        .from("pegawai_teladan_periode")
        .select("*")
        .eq("id", periodeId)
        .maybeSingle();

    if (periodeError) {
      console.error("Error periode:", periodeError);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil periode.",
          error: periodeError.message,
        },
        { status: 500 }
      );
    }

    if (!periode) {
      return NextResponse.json(
        {
          success: false,
          message: "Periode tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // ============================================================
    // 2. AMBIL KRITERIA AKTIF
    // ============================================================

    const { data: kriteria, error: kriteriaError } =
      await supabaseAdmin
        .from("pegawai_teladan_kriteria")
        .select(
          "id, kode, nama_kriteria, deskripsi, indikator, pedoman_nilai, bobot, nilai_min, nilai_max, urutan"
        )
        .eq("aktif", true)
        .order("urutan", { ascending: true });

    if (kriteriaError) {
      console.error("Error kriteria:", kriteriaError);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil kriteria.",
          error: kriteriaError.message,
        },
        { status: 500 }
      );
    }

    // ============================================================
    // 3. AMBIL SELURUH PENGGUNA AKTIF
    // ============================================================

    const { data: pengguna, error: penggunaError } =
      await supabaseAdmin
        .from("pengguna")
        .select("id, nama, username, role, status")
        .eq("status", "Aktif")
        .order("nama", { ascending: true });

    if (penggunaError) {
      console.error("Error pengguna:", penggunaError);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil daftar pegawai.",
          error: penggunaError.message,
        },
        { status: 500 }
      );
    }

    // ============================================================
    // 4. FILTER OBJEK PENILAIAN
    // ============================================================

    const objekPenilaian = (pengguna ?? []).filter((pegawai) =>
      isObjekPenilaian(pegawai.role)
    );

    // ============================================================
    // 5. AMBIL DATA PENILAIAN
    // ============================================================
    //
    // Penilai:
    // hanya penilaian yang dibuat oleh dirinya sendiri.
    //
    // Pengelola Kepegawaian:
    // seluruh penilaian pada periode.
    // ============================================================

    let penilaianQuery = supabaseAdmin
      .from("pegawai_teladan_penilaian")
      .select(
        `
        id,
        periode_id,
        pegawai_username,
        pegawai_nama,
        pegawai_nip,
        penilai_username,
        penilai_nama,
        penilai_role,
        status,
        catatan,
        tanggal_dikirim,
        created_at,
        updated_at
      `
      )
      .eq("periode_id", periodeId)
      .neq("status", "dibatalkan")
      .order("pegawai_nama", { ascending: true });

    /**
     * Pengelola melihat semua penilaian.
     *
     * Penilai hanya melihat miliknya sendiri.
     */
    if (!isPengelola(role)) {
      penilaianQuery = penilaianQuery.eq(
        "penilai_username",
        username
      );
    }

    const { data: penilaian, error: penilaianError } =
      await penilaianQuery;

    if (penilaianError) {
      console.error("Error penilaian:", penilaianError);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data penilaian.",
          error: penilaianError.message,
        },
        { status: 500 }
      );
    }

    // ============================================================
    // 6. AMBIL NILAI DETAIL
    // ============================================================

    const penilaianIds = (penilaian ?? []).map(
      (item) => item.id
    );

    let nilai: any[] = [];

    if (penilaianIds.length > 0) {
      const { data: nilaiData, error: nilaiError } =
        await supabaseAdmin
          .from("pegawai_teladan_nilai")
          .select(
            `
            id,
            penilaian_id,
            kriteria_id,
            nilai,
            catatan
          `
          )
          .in("penilaian_id", penilaianIds);

      if (nilaiError) {
        console.error("Error nilai:", nilaiError);

        return NextResponse.json(
          {
            success: false,
            message: "Gagal mengambil detail nilai.",
            error: nilaiError.message,
          },
          { status: 500 }
        );
      }

      nilai = nilaiData ?? [];
    }

    // ============================================================
    // 7. IDENTITAS PENILAI
    // ============================================================
    //
    // Untuk Pengelola Kepegawaian, akun bukan penilai.
    // Jadi kita tetap kirim informasi user yang sedang login,
    // tetapi tidak menganggapnya sebagai penilai.
    // ============================================================

    const namaUser = String(
      (session as any).name ??
        (session.user as any)?.name ??
        ""
    ).trim();

    return NextResponse.json({
      success: true,

      pengguna_login: {
        username,
        nama: namaUser,
        role,
      },

      /**
       * Tetap dikirim agar kompatibel dengan page lama.
       *
       * Untuk Pengelola Kepegawaian:
       * penilai = null karena bukan penilai.
       */
      penilai: isPenilai(role)
        ? {
            username,
            nama: namaUser,
            role,
          }
        : null,

      periode,

      kriteria: kriteria ?? [],

      total_kriteria: kriteria?.length ?? 0,

      objek_penilaian: objekPenilaian,

      total_objek_penilaian: objekPenilaian.length,

      penilaian: penilaian ?? [],

      total_penilaian: penilaian?.length ?? 0,

      nilai,
    });
  } catch (error: any) {
    console.error("API penilaian GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
        error: error?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * ============================================================
 * POST
 * ============================================================
 *
 * HANYA PENILAI yang boleh mengirim nilai.
 *
 * Pengelola Kepegawaian akan selalu mendapat 403.
 */
export async function POST(request: Request) {
  try {
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

    const role = String(
      (session as any).role ??
        (session.user as any)?.role ??
        (session.user as any)?.jabatan ??
        ""
    ).trim();

    const penilaiUsername = String(
      (session as any).username ??
        (session.user as any)?.username ??
        ""
    ).trim();

    const penilaiNama = String(
      (session as any).name ??
        (session.user as any)?.name ??
        ""
    ).trim();

    /**
     * ========================================================
     * PENTING
     * ========================================================
     *
     * Pengelola Kepegawaian TIDAK boleh masuk POST.
     *
     * Bahkan jika frontend dimanipulasi, API tetap menolak.
     */
    if (!isPenilai(role)) {
      return NextResponse.json(
        {
          success: false,
          message:
            isPengelola(role)
              ? "Pengelola Kepegawaian hanya dapat mengelola dan memantau Pegawai Teladan, bukan memberikan nilai."
              : "Akun Anda tidak memiliki kewenangan sebagai penilai.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const periodeId = String(
      body?.periode_id ?? ""
    ).trim();

    const pegawaiUsername = String(
      body?.pegawai_username ?? ""
    ).trim();

    const catatan = String(
      body?.catatan ?? ""
    ).trim();

    const nilaiInput = Array.isArray(body?.nilai)
      ? body.nilai
      : [];

    if (!periodeId) {
      return NextResponse.json(
        {
          success: false,
          message: "periode_id wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!pegawaiUsername) {
      return NextResponse.json(
        {
          success: false,
          message: "pegawai_username wajib diisi.",
        },
        { status: 400 }
      );
    }
if (!catatan) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Catatan Penilai wajib diisi sebelum penilaian dikirim.",
    },
    { status: 400 }
  );
}
    if (nilaiInput.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Nilai kriteria belum diisi.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 1. PASTIKAN PERIODE ADA DAN DIBUKA
    // ============================================================

    const { data: periode, error: periodeError } =
      await supabaseAdmin
        .from("pegawai_teladan_periode")
        .select("*")
        .eq("id", periodeId)
        .maybeSingle();

    if (periodeError) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal memeriksa periode.",
          error: periodeError.message,
        },
        { status: 500 }
      );
    }

    if (!periode) {
      return NextResponse.json(
        {
          success: false,
          message: "Periode tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    if (periode.status !== "dibuka") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Periode penilaian tidak sedang dibuka.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 2. PASTIKAN PEGAWAI AKTIF
    // ============================================================

    const { data: pegawai, error: pegawaiError } =
      await supabaseAdmin
        .from("pengguna")
        .select(
          "id, nama, username, role, status"
        )
        .eq("username", pegawaiUsername)
        .maybeSingle();

    if (pegawaiError) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal memeriksa pegawai.",
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

    if (pegawai.status !== "Aktif") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pegawai tidak berstatus aktif.",
        },
        { status: 400 }
      );
    }

    if (!isObjekPenilaian(pegawai.role)) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Role "${pegawai.role}" tidak dapat menjadi objek penilaian Pegawai Teladan.`,
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 3. TIDAK BOLEH MENILAI DIRI SENDIRI
    // ============================================================

    if (pegawaiUsername === penilaiUsername) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda tidak dapat menilai diri sendiri.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 4. AMBIL KRITERIA AKTIF
    // ============================================================

    const { data: kriteria, error: kriteriaError } =
      await supabaseAdmin
        .from("pegawai_teladan_kriteria")
        .select(
          "id, kode, nama_kriteria, bobot, nilai_min, nilai_max, urutan"
        )
        .eq("aktif", true)
        .order("urutan", {
          ascending: true,
        });

    if (kriteriaError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil kriteria.",
          error: kriteriaError.message,
        },
        { status: 500 }
      );
    }

    if (!kriteria || kriteria.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Belum ada kriteria penilaian aktif.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 5. VALIDASI NILAI
    // ============================================================

    const nilaiMap = new Map<string, any>();

    for (const item of nilaiInput) {
      const kriteriaId = String(
        item?.kriteria_id ?? ""
      ).trim();

      if (!kriteriaId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Ada nilai yang tidak memiliki kriteria_id.",
          },
          { status: 400 }
        );
      }

      if (nilaiMap.has(kriteriaId)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Ada kriteria yang dikirim lebih dari satu kali.",
          },
          { status: 400 }
        );
      }

      nilaiMap.set(kriteriaId, item);
    }

    if (nilaiMap.size !== kriteria.length) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Semua kriteria aktif wajib diberikan nilai.",
          detail: {
            jumlah_kriteria:
              kriteria.length,
            jumlah_nilai_diterima:
              nilaiMap.size,
          },
        },
        { status: 400 }
      );
    }

    let totalNilai = 0;

    const nilaiRows: any[] = [];

    for (const k of kriteria) {
      const item = nilaiMap.get(
        String(k.id)
      );

      if (!item) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Nilai untuk kriteria ${k.nama_kriteria} belum diisi.`,
          },
          { status: 400 }
        );
      }

      const angka = Number(item.nilai);

      if (!Number.isFinite(angka)) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Nilai ${k.nama_kriteria} harus berupa angka.`,
          },
          { status: 400 }
        );
      }

      const nilaiMin = Number(
        k.nilai_min ?? 0
      );

      const nilaiMax = Number(
        k.nilai_max ?? 100
      );

      if (
        angka < nilaiMin ||
        angka > nilaiMax
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Nilai ${k.nama_kriteria} harus antara ${nilaiMin} dan ${nilaiMax}.`,
          },
          { status: 400 }
        );
      }

      const bobot = Number(
        k.bobot ?? 0
      );

      totalNilai +=
        angka * (bobot / 100);

      nilaiRows.push({
        kriteria_id: k.id,
        nilai: angka,
        catatan:
          String(
            item.catatan ?? ""
          ).trim() || null,
      });
    }

   // ============================================================
// 6. CEK APAKAH PENILAI SUDAH MENILAI 1 PEGAWAI
// ============================================================
//
// ATURAN:
// Setiap penilai hanya boleh memilih 1 pegawai
// dalam 1 periode.
//
// Contoh:
// Fabry → Abu Nasar
// Setelah disimpan, Fabry TIDAK boleh memilih Agung.
// ============================================================

const {
  data: existingPenilaian,
  error: existingPenilaianError,
} = await supabaseAdmin
  .from("pegawai_teladan_penilaian")
  .select(
    "id, pegawai_username, pegawai_nama, status"
  )
  .eq("periode_id", periodeId)
  .eq("penilai_username", penilaiUsername)
  .neq("status", "dibatalkan")
  .limit(1);

if (existingPenilaianError) {
  console.error(
    "Error cek penilaian penilai:",
    existingPenilaianError
  );

  return NextResponse.json(
    {
      success: false,
      message:
        "Gagal memeriksa penilaian penilai sebelumnya.",
      error:
        existingPenilaianError.message,
    },
    { status: 500 }
  );
}

const penilaianSebelumnya =
  existingPenilaian?.[0] ?? null;

if (penilaianSebelumnya) {
  return NextResponse.json(
    {
      success: false,
      message:
        `Anda sudah memberikan penilaian kepada ${penilaianSebelumnya.pegawai_nama} pada periode ini. Setiap penilai hanya diperbolehkan memilih 1 pegawai.`,
      penilaian_id:
        penilaianSebelumnya.id,
      pegawai_username:
        penilaianSebelumnya.pegawai_username,
      pegawai_nama:
        penilaianSebelumnya.pegawai_nama,
      status:
        penilaianSebelumnya.status,
    },
    { status: 409 }
  );
}

    // ============================================================
    // 7. SIMPAN HEADER PENILAIAN
    // ============================================================

    const {
      data: penilaian,
      error: insertPenilaianError,
    } = await supabaseAdmin
      .from(
        "pegawai_teladan_penilaian"
      )
      .insert({
        periode_id:
          periodeId,
        pegawai_username:
          pegawai.username,
        pegawai_nama:
          pegawai.nama,
        pegawai_nip:
          pegawai.username,
        penilai_username:
          penilaiUsername,
        penilai_nama:
          penilaiNama,
        penilai_role:
          role,
        status:
          "dikirim",
        catatan:
          catatan || null,
        tanggal_dikirim:
          new Date().toISOString(),
      })
      .select("*")
      .single();

    if (
      insertPenilaianError ||
      !penilaian
    ) {
      console.error(
        "Insert penilaian error:",
        insertPenilaianError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal menyimpan penilaian.",
          error:
            insertPenilaianError?.message,
        },
        { status: 500 }
      );
    }

    // ============================================================
    // 8. SIMPAN DETAIL NILAI
    // ============================================================

    const rows =
      nilaiRows.map(
        (item) => ({
          penilaian_id:
            penilaian.id,
          kriteria_id:
            item.kriteria_id,
          nilai:
            item.nilai,
          catatan:
            item.catatan,
        })
      );

    const {
      data: nilaiTersimpan,
      error: nilaiInsertError,
    } = await supabaseAdmin
      .from(
        "pegawai_teladan_nilai"
      )
      .insert(rows)
      .select("*");

    if (nilaiInsertError) {
      console.error(
        "Insert detail nilai error:",
        nilaiInsertError
      );

      // Rollback manual header
      await supabaseAdmin
        .from(
          "pegawai_teladan_penilaian"
        )
        .delete()
        .eq(
          "id",
          penilaian.id
        );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal menyimpan detail nilai. Penilaian dibatalkan.",
          error:
            nilaiInsertError.message,
        },
        { status: 500 }
      );
    }

    // ============================================================
    // 9. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,
        message:
          "Penilaian Pegawai Teladan berhasil disimpan.",
        data: {
          penilaian,
          nilai:
            nilaiTersimpan ?? [],
          total_nilai:
            Number(
              totalNilai.toFixed(2)
            ),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "API penilaian POST error:",
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