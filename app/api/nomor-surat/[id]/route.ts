import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthenticatedUser } from "@/lib/authenticated-user";


// ============================================================
// ROLE ADMIN NOMOR SURAT
// ============================================================

function isAdminNomorSurat(role: string) {
  const roleNormal = String(role || "")
    .toLowerCase()
    .trim();

  return [
    "admin",
    "kaur umum",
    "pimpinan",
  ].includes(roleNormal);
}


// ============================================================
// PATCH
//
// ADMIN:
// - memberikan nomor
// - menolak permintaan
//
// IDENTITAS ADMIN:
// - DIAMBIL DARI NEXTAUTH SESSION
// - DIVERIFIKASI KEMBALI KE DATABASE
// - TIDAK MENGGUNAKAN HEADER CLIENT
// ============================================================

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {

    // ========================================================
    // AUTENTIKASI SERVER-SIDE
    // ========================================================

    const user =
      await getAuthenticatedUser();


    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sesi autentikasi tidak valid atau akun tidak aktif.",
        },
        { status: 401 }
      );
    }


    // ========================================================
    // VALIDASI ROLE ADMIN
    // ========================================================

    if (
      !isAdminNomorSurat(user.role)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda tidak memiliki hak untuk memproses nomor surat.",
        },
        { status: 403 }
      );
    }


    // ========================================================
    // AMBIL ID PERMINTAAN
    // ========================================================

    const { id } =
      await context.params;


    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ID permintaan tidak ditemukan.",
        },
        { status: 400 }
      );
    }


    // ========================================================
    // BACA BODY
    // ========================================================

    const body =
      await request.json();


  const {
  action,
  no_urut,
  catatan,
} = body;

const aksi = action;
const catatan_admin = catatan;

    // ========================================================
    // VALIDASI AKSI
    // ========================================================

    if (
      aksi !== "BERIKAN" &&
      aksi !== "TOLAK"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Aksi tidak dikenali.",
        },
        { status: 400 }
      );
    }


    // ========================================================
    // AMBIL DATA PERMINTAAN
    // ========================================================

    const {
      data: permintaan,
      error: getError,
    } =
      await supabaseAdmin
        .from("permintaan_nomor_surat")
        .select("*")
        .eq("id", id)
        .maybeSingle();


    if (getError) {
      console.error(
        "Gagal mengambil permintaan nomor surat:",
        getError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil data permintaan nomor surat.",
        },
        { status: 500 }
      );
    }


    if (!permintaan) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Permintaan nomor surat tidak ditemukan.",
        },
        { status: 404 }
      );
    }


    // ========================================================
    // HANYA PERMINTAAN MENUNGGU YANG BOLEH DIPROSES
    // ========================================================

    if (
      permintaan.status !==
      "MENUNGGU"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Permintaan sudah diproses sebelumnya.",
        },
        { status: 409 }
      );
    }


    // ========================================================
    // TOLAK PERMINTAAN
    // ========================================================

    if (aksi === "TOLAK") {

      const catatan =
        typeof catatan_admin === "string" &&
        catatan_admin.trim()
          ? catatan_admin.trim()
          : "Permintaan ditolak.";


      const {
        data,
        error,
      } =
        await supabaseAdmin
          .from("permintaan_nomor_surat")
          .update({

            status: "DITOLAK",

            catatan_admin:
              catatan,

            /**
             * IDENTITAS ADMIN BERASAL DARI
             * SESSION SERVER.
             */
            diberikan_oleh_id:
              user.id,

            diberikan_oleh_username:
              user.username,

            diberikan_oleh_nama:
              user.nama ||
              user.username,

            diberikan_at:
              new Date().toISOString(),

          })
          .eq("id", id)
          .eq(
            "status",
            "MENUNGGU"
          )
          .select("*")
          .maybeSingle();


      if (error) {

        console.error(
          "Gagal menolak permintaan:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Gagal menolak permintaan nomor surat.",
          },
          { status: 500 }
        );
      }


      if (!data) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Permintaan sudah diproses oleh pengguna lain.",
          },
          { status: 409 }
        );
      }


      return NextResponse.json({
        success: true,

        message:
          "Permintaan berhasil ditolak.",

        data,
      });
    }


    // ========================================================
    // BERIKAN NOMOR
    // ========================================================

    // Pastikan nomor urut berasal dari input admin.

    const nomorUrut =
      Number(no_urut);


    if (
      !Number.isInteger(
        nomorUrut
      ) ||
      nomorUrut <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Nomor urut harus berupa angka bulat lebih dari 0.",
        },
        { status: 400 }
      );
    }


    // ========================================================
    // BENTUK NOMOR SURAT DI SERVER
    //
    // CONTOH:
    //
    // WP.10.PAS.8-
    // PK.
    // 03.
    // 02.
    // 466
    //
    // HASIL:
    //
    // WP.10.PAS.8-PK.03.02.466
    // ========================================================

    const nomorFinal =
      `${permintaan.kode_unit}` +
      `${permintaan.klasifikasi}` +
      `${permintaan.kode_angka_1}` +
      `${permintaan.kode_angka_2}` +
      `${nomorUrut}`;


    // ========================================================
    // CEK NOMOR URUT SUDAH DIGUNAKAN
    //
    // Nomor urut hanya unik dalam kombinasi:
    //
    // kode_unit
    // + klasifikasi
    // + kode_angka_1
    // + kode_angka_2
    // ========================================================

    const {
      data: nomorLama,
      error: nomorLamaError,
    } =
      await supabaseAdmin
        .from(
          "permintaan_nomor_surat"
        )
        .select("id")
        .eq(
          "kode_unit",
          permintaan.kode_unit
        )
        .eq(
          "klasifikasi",
          permintaan.klasifikasi
        )
        .eq(
          "kode_angka_1",
          permintaan.kode_angka_1
        )
        .eq(
          "kode_angka_2",
          permintaan.kode_angka_2
        )
        .eq(
          "no_urut",
          nomorUrut
        )
        .neq(
          "id",
          id
        )
        .limit(1);


    if (nomorLamaError) {
      console.error(
        "Gagal memeriksa nomor urut:",
        nomorLamaError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal memeriksa penggunaan nomor urut.",
        },
        { status: 500 }
      );
    }


    if (
      nomorLama &&
      nomorLama.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Nomor urut tersebut sudah pernah digunakan untuk kode surat yang sama.",
        },
        { status: 409 }
      );
    }


    // ========================================================
    // CEK NOMOR SURAT FINAL
    // ========================================================

    const {
      data: nomorFinalLama,
      error: nomorFinalError,
    } =
      await supabaseAdmin
        .from(
          "permintaan_nomor_surat"
        )
        .select("id")
        .eq(
          "nomor_surat",
          nomorFinal
        )
        .neq(
          "id",
          id
        )
        .limit(1);


    if (nomorFinalError) {
      console.error(
        "Gagal memeriksa nomor surat:",
        nomorFinalError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal memeriksa nomor surat.",
        },
        { status: 500 }
      );
    }


    if (
      nomorFinalLama &&
      nomorFinalLama.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Nomor surat tersebut sudah pernah digunakan.",
        },
        { status: 409 }
      );
    }


    // ========================================================
    // UPDATE
    // ========================================================
    //
    // PENTING:
    //
    // nomor_surat dari client TIDAK DIGUNAKAN.
    //
    // Server membentuk sendiri nomor surat.
    //
    // Identitas pemberi nomor juga berasal dari session.
    // ========================================================

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "permintaan_nomor_surat"
        )
        .update({

          no_urut:
            nomorUrut,

          nomor_surat:
            nomorFinal,

          status:
            "DIBERIKAN",

          diberikan_oleh_id:
            user.id,

          diberikan_oleh_username:
            user.username,

          diberikan_oleh_nama:
            user.nama ||
            user.username,

          diberikan_at:
            new Date().toISOString(),

          catatan_admin:
            typeof catatan_admin ===
              "string" &&
            catatan_admin.trim()
              ? catatan_admin.trim()
              : null,

          /**
           * Operator berasal dari akun admin
           * yang memproses.
           */
          operator:
            user.username,

        })
        .eq(
          "id",
          id
        )
        .eq(
          "status",
          "MENUNGGU"
        )
        .select("*")
        .maybeSingle();


    // ========================================================
    // ERROR UPDATE
    // ========================================================

    if (error) {

      console.error(
        "UPDATE NOMOR SURAT ERROR:",
        error
      );


      /**
       * PostgreSQL unique violation.
       *
       * Ini menjadi lapisan pengaman terakhir
       * apabila dua admin mencoba memberikan
       * nomor yang sama hampir bersamaan.
       */
      if (
        error.code ===
        "23505"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Nomor surat tersebut sudah digunakan.",
          },
          { status: 409 }
        );
      }


      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal memberikan nomor surat.",
        },
        { status: 500 }
      );
    }


    // ========================================================
    // TIDAK ADA BARIS YANG BERHASIL DIUPDATE
    // ========================================================

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Permintaan sudah diproses oleh pengguna lain atau statusnya bukan MENUNGGU.",
        },
        { status: 409 }
      );
    }


    // ========================================================
    // BERHASIL
    // ========================================================

    return NextResponse.json({
      success: true,

      message:
        "Nomor surat berhasil diberikan.",

      data,
    });

  } catch (error: any) {

    console.error(
      "PATCH /api/nomor-surat/[id]:",
      error
    );


    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Terjadi kesalahan server.",
      },
      { status: 500 }
    );
  }
}