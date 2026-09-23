import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * =========================================================
 * ROLE YANG BOLEH MENGELOLA PERIODE
 * =========================================================
 */

const ROLE_ADMIN = [
  "Admin",
  "Kaur Kepegawaian",
];

/**
 * =========================================================
 * GET
 *
 * Mengambil daftar periode penilaian.
 *
 * Semua pengguna yang sudah login boleh melihat periode.
 * Pengelolaan periode tetap dibatasi berdasarkan role.
 * =========================================================
 */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda belum login.",
        },
        {
          status: 401,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("pegawai_teladan_periode")
      .select(`
        id,
        tahun,
        bulan,
        nama_periode,
        status,
        tanggal_mulai,
        tanggal_selesai,
        keterangan,
        dibuat_oleh_username,
        dibuat_oleh_nama,
        created_at,
        updated_at
      `)
      .order("tahun", {
        ascending: false,
      })
      .order("bulan", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Gagal mengambil periode pegawai teladan:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data periode.",
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
    });
  } catch (error) {
    console.error(
      "Error GET /api/pegawai-teladan/periode:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      {
        status: 500,
      }
    );
  }
}


/**
 * =========================================================
 * POST
 *
 * Membuat periode baru.
 *
 * Hanya:
 * - Admin
 * - Pengelola Kepegawaian
 * - Kaur Kepegawaian
 * =========================================================
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
        {
          status: 401,
        }
      );
    }

    const role = String(
      (session as any).role ??
        (session.user as any)?.role ??
        ""
    ).trim();

    const username = String(
      (session as any).username ??
        (session.user as any)?.username ??
        ""
    ).trim();

    const nama = String(
      session.user?.name ?? ""
    ).trim();

    /**
     * Cek hak akses.
     */
    if (!ROLE_ADMIN.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda tidak memiliki hak untuk membuat periode penilaian.",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request.json();

    const tahun = Number(body.tahun);
    const bulan = Number(body.bulan);

    const nama_periode =
      String(body.nama_periode ?? "").trim();

    const status =
      String(body.status ?? "draft").trim();

    const tanggal_mulai =
      body.tanggal_mulai || null;

    const tanggal_selesai =
      body.tanggal_selesai || null;

    const keterangan =
      body.keterangan
        ? String(body.keterangan).trim()
        : null;

    /**
     * Validasi tahun.
     */
    if (
      !Number.isInteger(tahun) ||
      tahun < 2020 ||
      tahun > 2100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Tahun tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * Validasi bulan.
     */
    if (
      !Number.isInteger(bulan) ||
      bulan < 1 ||
      bulan > 12
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Bulan harus antara 1 sampai 12.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * Jika nama periode tidak diisi,
     * sistem membuat otomatis.
     */
    const namaPeriodeFinal =
      nama_periode ||
      new Date(
        tahun,
        bulan - 1,
        1
      ).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });

    /**
     * Validasi status.
     */
    const statusValid = [
      "draft",
      "dibuka",
      "ditutup",
    ];

    if (!statusValid.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Status periode tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * Cek apakah periode sudah ada.
     */
    const { data: existing, error: existingError } =
      await supabaseAdmin
        .from("pegawai_teladan_periode")
        .select("id")
        .eq("tahun", tahun)
        .eq("bulan", bulan)
        .maybeSingle();

    if (existingError) {
      console.error(
        "Gagal mengecek periode:",
        existingError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memeriksa periode.",
        },
        {
          status: 500,
        }
      );
    }

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Periode penilaian untuk bulan tersebut sudah ada.",
        },
        {
          status: 409,
        }
      );
    }

    /**
     * Simpan periode.
     */
    const { data, error } =
      await supabaseAdmin
        .from("pegawai_teladan_periode")
        .insert({
          tahun,
          bulan,
          nama_periode: namaPeriodeFinal,
          status,
          tanggal_mulai,
          tanggal_selesai,
          keterangan,
          dibuat_oleh_username:
            username || null,
          dibuat_oleh_nama:
            nama || null,
        })
        .select(`
          id,
          tahun,
          bulan,
          nama_periode,
          status,
          tanggal_mulai,
          tanggal_selesai,
          keterangan,
          dibuat_oleh_username,
          dibuat_oleh_nama,
          created_at,
          updated_at
        `)
        .single();

    if (error) {
      console.error(
        "Gagal membuat periode:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal membuat periode penilaian.",
          error: error.message,
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
          "Periode penilaian berhasil dibuat.",
        data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error POST /api/pegawai-teladan/periode:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server.",
      },
      {
        status: 500,
      }
    );
  }
}


/**
 * =========================================================
 * PATCH
 *
 * Mengubah periode.
 *
 * Dipakai Pengelola Kepegawaian / Kaur Kepegawaian / Admin
 * untuk:
 *
 * - membuka periode
 * - menutup periode
 * - mengubah tanggal
 * - mengubah keterangan
 * =========================================================
 */

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda belum login.",
        },
        {
          status: 401,
        }
      );
    }

    const role = String(
      (session as any).role ??
        (session.user as any)?.role ??
        ""
    ).trim();

    if (!ROLE_ADMIN.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda tidak memiliki hak untuk mengubah periode.",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request.json();

    const id = String(body.id ?? "").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID periode wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    const updateData: Record<string, any> = {};

    if (body.nama_periode !== undefined) {
      updateData.nama_periode =
        String(body.nama_periode).trim();
    }

    if (body.status !== undefined) {
      const status =
        String(body.status).trim();

      if (
        ![
          "draft",
          "dibuka",
          "ditutup",
        ].includes(status)
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Status periode tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.status = status;
    }

    if (body.tanggal_mulai !== undefined) {
      updateData.tanggal_mulai =
        body.tanggal_mulai || null;
    }

    if (body.tanggal_selesai !== undefined) {
      updateData.tanggal_selesai =
        body.tanggal_selesai || null;
    }

    if (body.keterangan !== undefined) {
      updateData.keterangan =
        body.keterangan
          ? String(body.keterangan).trim()
          : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tidak ada data yang diubah.",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("pegawai_teladan_periode")
        .update(updateData)
        .eq("id", id)
        .select(`
          id,
          tahun,
          bulan,
          nama_periode,
          status,
          tanggal_mulai,
          tanggal_selesai,
          keterangan,
          dibuat_oleh_username,
          dibuat_oleh_nama,
          created_at,
          updated_at
        `)
        .single();

    if (error) {
      console.error(
        "Gagal memperbarui periode:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal memperbarui periode.",
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Periode berhasil diperbarui.",
      data,
    });
  } catch (error) {
    console.error(
      "Error PATCH /api/pegawai-teladan/periode:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server.",
      },
      {
        status: 500,
      }
    );
  }
}