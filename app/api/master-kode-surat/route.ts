
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabaseAdmin } from "@/lib/supabase-admin";


const ROLE_ADMIN = ["admin", "kaur umum"];


function normalizeRole(role: unknown) {
  return String(role ?? "")
    .trim()
    .toLowerCase();
}

function isAllowedRole(role: unknown) {
  return ROLE_ADMIN.includes(normalizeRole(role));
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function formatKode(
  kode_unit: string,
  klasifikasi: string,
  kode_angka_1: string,
  kode_angka_2: string
) {
  return `${kode_unit}${klasifikasi}${kode_angka_1}${kode_angka_2}`;
}

/**
 * GET
 * Menampilkan seluruh master kode surat
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:  "Unauthorized",
        },
        { status: 401 }
      );
    }

   const role = String(
  (session as any).role ??
    (session.user as any)?.role ??
    ""
)
  .trim()
  .toLowerCase();
  
    if (!isAllowedRole(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda tidak memiliki akses ke Master Kode Surat.",
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("master_kode_surat")
      .select("*")
      .order("kode_unit", { ascending: true })
      .order("klasifikasi", { ascending: true })
      .order("kode_angka_1", { ascending: true })
      .order("kode_angka_2", { ascending: true });

    if (error) {
      console.error("GET MASTER KODE ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    const hasil = (data ?? []).map((item) => ({
      ...item,
      kode_lengkap: formatKode(
        item.kode_unit,
        item.klasifikasi,
        item.kode_angka_1,
        item.kode_angka_2
      ),
    }));

    return NextResponse.json({
      success: true,
      data: hasil,
    });
  } catch (error) {
    console.error("GET MASTER KODE EXCEPTION:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 * Menambahkan master kode baru
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
        ""
    ).trim();

    if (!isAllowedRole(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Hanya Admin atau Kaur Umum yang dapat menambah kode.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const kode_unit = clean(body.kode_unit);
    const klasifikasi = clean(body.klasifikasi);
    const kode_angka_1 = clean(body.kode_angka_1);
    const kode_angka_2 = clean(body.kode_angka_2);
    const keterangan = clean(body.keterangan);

    const aktif =
      typeof body.aktif === "boolean"
        ? body.aktif
        : true;

    if (
      !kode_unit ||
      !klasifikasi ||
      !kode_angka_1 ||
      !kode_angka_2
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Semua bagian kode wajib diisi.",
        },
        { status: 400 }
      );
    }

    const kode_lengkap = formatKode(
      kode_unit,
      klasifikasi,
      kode_angka_1,
      kode_angka_2
    );

    // Cek apakah kode sudah ada
    const { data: existing, error: existingError } =
      await supabaseAdmin
        .from("master_kode_surat")
        .select("id, aktif")
        .eq("kode_unit", kode_unit)
        .eq("klasifikasi", klasifikasi)
        .eq("kode_angka_1", kode_angka_1)
        .eq("kode_angka_2", kode_angka_2)
        .maybeSingle();

    if (existingError) {
      console.error("CEK MASTER KODE ERROR:", existingError);

      return NextResponse.json(
        {
          success: false,
          message: existingError.message,
        },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `Kode ${kode_lengkap} sudah ada di Master Kode Surat.`,
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("master_kode_surat")
      .insert({
        kode_unit,
        klasifikasi,
        kode_angka_1,
        kode_angka_2,
        keterangan: keterangan || null,
        aktif,
      })
      .select()
      .single();

    if (error) {
      console.error("INSERT MASTER KODE ERROR:", error);

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
      message: `Kode ${kode_lengkap} berhasil ditambahkan.`,
      data: {
        ...data,
        kode_lengkap,
      },
    });
  } catch (error) {
    console.error("POST MASTER KODE EXCEPTION:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server.",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH
 * Mengubah master kode / aktif-nonaktif
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
        { status: 401 }
      );
    }

    const role = String(
      (session as any).role ??
        (session.user as any)?.role ??
        ""
    ).trim();

    if (!isAllowedRole(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Hanya Admin atau Kaur Umum yang dapat mengubah kode.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const id = clean(body.id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID master kode tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.kode_unit !== undefined) {
      updateData.kode_unit = clean(body.kode_unit);
    }

    if (body.klasifikasi !== undefined) {
      updateData.klasifikasi = clean(body.klasifikasi);
    }

    if (body.kode_angka_1 !== undefined) {
      updateData.kode_angka_1 = clean(body.kode_angka_1);
    }

    if (body.kode_angka_2 !== undefined) {
      updateData.kode_angka_2 = clean(body.kode_angka_2);
    }

    if (body.keterangan !== undefined) {
      updateData.keterangan = clean(body.keterangan) || null;
    }

    if (body.aktif !== undefined) {
      updateData.aktif = Boolean(body.aktif);
    }

    // Validasi bagian kode
    if (
      updateData.kode_unit !== undefined &&
      !updateData.kode_unit
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Kode unit tidak boleh kosong.",
        },
        { status: 400 }
      );
    }

    if (
      updateData.klasifikasi !== undefined &&
      !updateData.klasifikasi
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Klasifikasi tidak boleh kosong.",
        },
        { status: 400 }
      );
    }

    if (
      updateData.kode_angka_1 !== undefined &&
      !updateData.kode_angka_1
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Kode angka pertama tidak boleh kosong.",
        },
        { status: 400 }
      );
    }

    if (
      updateData.kode_angka_2 !== undefined &&
      !updateData.kode_angka_2
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Kode angka kedua tidak boleh kosong.",
        },
        { status: 400 }
      );
    }

    // Jika bagian kode diubah, cek duplikasi
    if (
      updateData.kode_unit !== undefined ||
      updateData.klasifikasi !== undefined ||
      updateData.kode_angka_1 !== undefined ||
      updateData.kode_angka_2 !== undefined
    ) {
      const { data: current, error: currentError } =
        await supabaseAdmin
          .from("master_kode_surat")
          .select("*")
          .eq("id", id)
          .single();

      if (currentError || !current) {
        return NextResponse.json(
          {
            success: false,
            message: "Master kode tidak ditemukan.",
          },
          { status: 404 }
        );
      }

      const kode_unit =
        updateData.kode_unit !== undefined
          ? String(updateData.kode_unit)
          : current.kode_unit;

      const klasifikasi =
        updateData.klasifikasi !== undefined
          ? String(updateData.klasifikasi)
          : current.klasifikasi;

      const kode_angka_1 =
        updateData.kode_angka_1 !== undefined
          ? String(updateData.kode_angka_1)
          : current.kode_angka_1;

      const kode_angka_2 =
        updateData.kode_angka_2 !== undefined
          ? String(updateData.kode_angka_2)
          : current.kode_angka_2;

      const { data: duplicate } = await supabaseAdmin
        .from("master_kode_surat")
        .select("id")
        .eq("kode_unit", kode_unit)
        .eq("klasifikasi", klasifikasi)
        .eq("kode_angka_1", kode_angka_1)
        .eq("kode_angka_2", kode_angka_2)
        .neq("id", id)
        .maybeSingle();

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message: `Kode ${formatKode(
              kode_unit,
              klasifikasi,
              kode_angka_1,
              kode_angka_2
            )} sudah digunakan.`,
          },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from("master_kode_surat")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("UPDATE MASTER KODE ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    const kode_lengkap = formatKode(
      data.kode_unit,
      data.klasifikasi,
      data.kode_angka_1,
      data.kode_angka_2
    );

    return NextResponse.json({
      success: true,
      message: `Master kode ${kode_lengkap} berhasil diperbarui.`,
      data: {
        ...data,
        kode_lengkap,
      },
    });
  } catch (error) {
    console.error("PATCH MASTER KODE EXCEPTION:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server.",
      },
      { status: 500 }
    );
  }
}