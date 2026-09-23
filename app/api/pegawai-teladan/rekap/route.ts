import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabaseAdmin } from "@/lib/supabase-admin";

function isPengelolaRekap(role: string | null | undefined) {
  if (!role) return false;

  const normalized = role.trim();

  return (
    normalized === "Admin" ||
    normalized === "Pengelola Kepegawaian" ||
    normalized === "Kaur Kepegawaian"
  );
}

function isObjekPenilaian(role: string | null | undefined) {
  if (!role) return false;

  const normalized = role.trim();

  // Yang TIDAK menjadi objek penilaian
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

export async function GET(request: Request) {
  try {
    // =====================================================
    // SESSION
    // =====================================================

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

    const sessionRole = String(
      session.user?.role ?? ""
    ).trim();

    if (!isPengelolaRekap(sessionRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda tidak memiliki akses ke rekap penilaian.",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // PERIODE ID
    // =====================================================

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

    // =====================================================
    // 1. AMBIL PERIODE
    // =====================================================

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

    // =====================================================
    // 2. AMBIL SEMUA PENGGUNA AKTIF
    // =====================================================

    const { data: pengguna, error: penggunaError } =
      await supabaseAdmin
        .from("pengguna")
        .select(`
          id,
          nama,
          username,
          role,
          status
        `)
        .eq("status", "Aktif")
        .order("nama", { ascending: true });

    if (penggunaError) {
      console.error(
        "Error mengambil pengguna:",
        penggunaError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil daftar pegawai.",
          error: penggunaError.message,
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 3. FILTER OBJEK PENILAIAN
    //    LOGIKA SAMA DENGAN API PENILAIAN
    // =====================================================

    const objekPenilaian = (pengguna ?? []).filter(
      (item: any) => isObjekPenilaian(item.role)
    );

    console.log(
      "REKAP - total pengguna aktif:",
      pengguna?.length ?? 0
    );

    console.log(
      "REKAP - total objek penilaian:",
      objekPenilaian.length
    );

    // =====================================================
    // 4. AMBIL REKAP YANG SUDAH DINILAI
    // =====================================================

    const {
      data: rekapPegawai,
      error: rekapPegawaiError,
    } = await supabaseAdmin
      .from("v_pegawai_teladan_rekap_pegawai")
      .select("*")
      .eq("periode_id", periodeId);

    if (rekapPegawaiError) {
      console.error(
        "Error mengambil rekap pegawai:",
        rekapPegawaiError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil rekap pegawai.",
          error: rekapPegawaiError.message,
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 5. AMBIL DETAIL PENILAIAN
    // =====================================================

    const {
      data: detailPenilaian,
      error: detailError,
    } = await supabaseAdmin
      .from("v_pegawai_teladan_rekap_penilaian")
      .select("*")
      .eq("periode_id", periodeId);
// =====================================================
// 5B. AMBIL CATATAN PENILAI
// =====================================================

const {
  data: catatanPenilaian,
  error: catatanError,
} = await supabaseAdmin
  .from("pegawai_teladan_penilaian")
  .select(`
    id,
    pegawai_username,
    pegawai_nama,
    penilai_username,
    penilai_nama,
    penilai_role,
    catatan,
    tanggal_dikirim
  `)
  .eq("periode_id", periodeId)
  .neq("status", "dibatalkan");

if (catatanError) {
  console.error(
    "Error mengambil catatan penilaian:",
    catatanError
  );

  return NextResponse.json(
    {
      success: false,
      message: "Gagal mengambil catatan penilai.",
      error: catatanError.message,
    },
    { status: 500 }
  );
}
    if (detailError) {
      console.error(
        "Error mengambil detail penilaian:",
        detailError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil detail penilaian.",
          error: detailError.message,
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 6. MAP HASIL PENILAIAN
    // =====================================================

    const rekapMap = new Map<string, any>();

    (rekapPegawai ?? []).forEach((item: any) => {
      const username = String(
        item.pegawai_username ?? ""
      ).trim();

      if (username) {
        rekapMap.set(username, item);
      }
    });
// =====================================================
// 5C. PETAKAN CATATAN PENILAI PER PEGAWAI
// =====================================================

const catatanMap = new Map<
  string,
  {
    catatan: string;
    penilai_username: string;
    penilai_nama: string;
    penilai_role: string;
    tanggal_dikirim: string | null;
  }
>();

(catatanPenilaian ?? []).forEach((item: any) => {
  const username = String(
    item.pegawai_username ?? ""
  ).trim();

  if (!username) return;

  catatanMap.set(username, {
    catatan: item.catatan ?? "",
    penilai_username: item.penilai_username ?? "",
    penilai_nama: item.penilai_nama ?? "",
    penilai_role: item.penilai_role ?? "",
    tanggal_dikirim:
      item.tanggal_dikirim ?? null,
  });
});
    // =====================================================
    // 7. GABUNGKAN SEMUA 84 OBJEK
    // =====================================================

    const rekapLengkap = objekPenilaian.map(
      (pegawai: any) => {
        const username = String(
          pegawai.username ?? ""
        ).trim();

        const hasil = rekapMap.get(username);

        return {
          pegawai_id: pegawai.id,

          pegawai_username: username,

          pegawai_nama: pegawai.nama,

          pegawai_nip: username,

          pegawai_role: String(
            pegawai.role ?? ""
          ).trim(),

          sudah_dinilai: Boolean(hasil),

          jumlah_penilai: hasil
            ? Number(hasil.jumlah_penilai ?? 0)
            : 0,

          nilai_rata_rata:
            hasil?.nilai_rata_rata != null
              ? Number(hasil.nilai_rata_rata)
              : null,

          nilai_terendah:
            hasil?.nilai_terendah != null
              ? Number(hasil.nilai_terendah)
              : null,

          nilai_tertinggi:
            hasil?.nilai_tertinggi != null
              ? Number(hasil.nilai_tertinggi)
              : null,
            catatan_penilai:
  catatanMap.get(username)?.catatan ?? null,

penilai_nama:
  catatanMap.get(username)?.penilai_nama ?? null,

penilai_role:
  catatanMap.get(username)?.penilai_role ?? null,

tanggal_dikirim:
  catatanMap.get(username)?.tanggal_dikirim ?? null, 
        };
      }
    );

    // =====================================================
    // 8. URUTKAN
    // =====================================================

    rekapLengkap.sort(
      (a: any, b: any) => {
        // Sudah dinilai di atas
        if (
          a.sudah_dinilai &&
          !b.sudah_dinilai
        ) {
          return -1;
        }

        if (
          !a.sudah_dinilai &&
          b.sudah_dinilai
        ) {
          return 1;
        }

        // Yang sudah dinilai:
        // nilai tertinggi terlebih dahulu
        if (
          a.sudah_dinilai &&
          b.sudah_dinilai
        ) {
          return (
            Number(
              b.nilai_rata_rata ?? 0
            ) -
            Number(
              a.nilai_rata_rata ?? 0
            )
          );
        }

        // Yang belum dinilai:
        // urut nama
        return String(
          a.pegawai_nama ?? ""
        ).localeCompare(
          String(
            b.pegawai_nama ?? ""
          ),
          "id"
        );
      }
    );

    // =====================================================
    // 9. RINGKASAN
    // =====================================================

    const totalObjek =
      rekapLengkap.length;

    const sudahDinilai =
      rekapLengkap.filter(
        (item: any) =>
          item.sudah_dinilai
      ).length;

    const belumDinilai =
      totalObjek - sudahDinilai;

    // =====================================================
    // 10. PENILAI UNIK
    // =====================================================

    const penilaiUnik =
      new Set<string>();

    (
      detailPenilaian ?? []
    ).forEach((item: any) => {
      const username =
        item.penilai_username ??
        item.username_penilai ??
        item.dinilai_oleh_username ??
        item.dibuat_oleh_username;

      if (username) {
        penilaiUnik.add(
          String(username).trim()
        );
      }
    });

    // =====================================================
    // 11. RESPONSE
    // =====================================================

    return NextResponse.json({
      success: true,

      periode,

      ringkasan: {
        total_objek: totalObjek,

        sudah_dinilai: sudahDinilai,

        belum_dinilai: belumDinilai,

        total_penilai:
          penilaiUnik.size,

        total_detail_penilaian:
          detailPenilaian?.length ?? 0,
      },

      rekap_pegawai:
        rekapLengkap,

      detail_penilaian:
        detailPenilaian ?? [],
    });
  } catch (error: any) {
    console.error(
      "API rekap pegawai teladan error:",
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