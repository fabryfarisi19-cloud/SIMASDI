import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const TIMEZONE = "Asia/Jakarta";
const NIP_ABSENSI_FINGER = [
  "196802081997032001", // Manawati
  "198305052009122007", // Dwi Asti
  "197103261993032001", // Thiurma
];
// ==========================================
// Helper: tanggal & waktu Indonesia
// ==========================================
function getIndonesiaDateTime(now: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const date = formatter.format(now);

  return {
    date,
    timestamp: now.toISOString(),
  };
}

// ==========================================
// Helper: hitung jarak GPS
// Haversine formula
// ==========================================
function hitungJarakMeter(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// ==========================================
// GET
// Melihat status absensi hari ini
// ==========================================
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda belum login.",
        },
        { status: 401 }
      );
    }

    const user = session.user as any;

    const penggunaId =
      user.penggunaId ||
      user.id;
      const username = String(user.username || "").trim();

if (!NIP_ABSENSI_FINGER.includes(username)) {
  return NextResponse.json(
    {
      success: false,
      code: "ABSENSI_NOT_ALLOWED",
      message:
        "Fitur Absen Finger sementara hanya diperuntukkan bagi pegawai yang telah ditetapkan.",
    },
    { status: 403 }
  );
}
const nip = String(user.username || "").trim();

if (!NIP_ABSENSI_FINGER.includes(nip)) {
  return NextResponse.json(
    {
      success: false,
      code: "ABSENSI_NOT_ALLOWED",
      message:
        "Fitur Absen Finger sementara hanya diperuntukkan bagi pegawai yang telah ditetapkan.",
    },
    { status: 403 }
  );
}
    if (!penggunaId) {
      return NextResponse.json(
        {
          success: false,
          message: "ID pengguna tidak ditemukan dalam session.",
        },
        { status: 400 }
      );
    }

    const { date } = getIndonesiaDateTime();

    const { data, error } = await supabaseAdmin
      .from("absensi_finger")
      .select(`
        id,
        tanggal,
        jam_masuk,
        jam_pulang,
        latitude_masuk,
        longitude_masuk,
        akurasi_masuk,
        jarak_masuk,
        latitude_pulang,
        longitude_pulang,
        akurasi_pulang,
        jarak_pulang,
        status,
        keterangan
      `)
      .eq("pengguna_id", penggunaId)
      .eq("tanggal", date)
      .maybeSingle();

    if (error) {
      console.error("GET ABSENSI ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal membaca data absensi.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || null,
    });
  } catch (error) {
    console.error("GET ABSENSI EXCEPTION:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// POST
// Absen masuk / pulang
// ==========================================
export async function POST(request: NextRequest) {
  try {
    // --------------------------------------
    // 1. Cek session
    // --------------------------------------
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda belum login.",
        },
        { status: 401 }
      );
    }

    const user = session.user as any;

    const penggunaId =
      user.penggunaId ||
      user.id;
const nip = String(user.username || "").trim();

if (!NIP_ABSENSI_FINGER.includes(nip)) {
  return NextResponse.json(
    {
      success: false,
      code: "ABSENSI_NOT_ALLOWED",
      message:
        "Fitur Absen Finger sementara hanya diperuntukkan bagi pegawai yang telah ditetapkan.",
    },
    { status: 403 }
  );
}
    if (!penggunaId) {
      return NextResponse.json(
        {
          success: false,
          message: "ID pengguna tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------
    // 2. Baca request
    // --------------------------------------
    const body = await request.json();

    const {
      tipe,
      latitude,
      longitude,
      accuracy,
    } = body;

    // tipe harus masuk atau pulang
    if (tipe !== "masuk" && tipe !== "pulang") {
      return NextResponse.json(
        {
          success: false,
          message: "Jenis absensi tidak valid.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------
    // 3. Validasi GPS
    // --------------------------------------
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Lokasi GPS tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Koordinat GPS tidak valid.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------
    // 4. Ambil pengaturan lokasi kantor
    // --------------------------------------
    const { data: lokasi, error: lokasiError } =
      await supabaseAdmin
        .from("pengaturan_absensi")
        .select(`
          id,
          nama_lokasi,
          latitude,
          longitude,
          radius_meter,
          aktif
        `)
        .eq("aktif", true)
        .limit(1)
        .maybeSingle();

    if (lokasiError) {
      console.error("LOKASI ABSENSI ERROR:", lokasiError);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal membaca pengaturan lokasi kantor.",
        },
        { status: 500 }
      );
    }

    if (!lokasi) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Lokasi absensi belum dikonfigurasi oleh administrator.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------
    // 5. Hitung jarak
    // --------------------------------------
    const jarak = hitungJarakMeter(
      lokasi.latitude,
      lokasi.longitude,
      latitude,
      longitude
    );

    const jarakBulat = Math.round(jarak);

    // --------------------------------------
    // 6. Tolak jika di luar radius
    // --------------------------------------
    if (jarak > lokasi.radius_meter) {
      return NextResponse.json(
        {
          success: false,
          code: "OUTSIDE_RADIUS",
          message:
            "Absensi ditolak. Anda berada di luar area kantor.",
          data: {
            jarak_meter: jarakBulat,
            radius_meter: lokasi.radius_meter,
            nama_lokasi: lokasi.nama_lokasi,
          },
        },
        { status: 403 }
      );
    }

    // --------------------------------------
    // 7. Cek akurasi GPS
    // --------------------------------------
    if (
      typeof accuracy === "number" &&
      accuracy > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "GPS_ACCURACY_LOW",
          message:
            "Akurasi GPS terlalu rendah. Silakan aktifkan lokasi dengan akurasi tinggi dan coba kembali.",
          data: {
            akurasi_meter: Math.round(accuracy),
          },
        },
        { status: 400 }
      );
    }

    // --------------------------------------
    // 8. Tanggal Indonesia
    // --------------------------------------
 // --------------------------------------
// 8. WAKTU RESMI SERVER
// --------------------------------------
// Waktu absensi TIDAK berasal dari browser.
// Tanggal dihitung server menggunakan zona Asia/Jakarta.
// Timestamp disimpan dalam UTC ISO untuk database.
const serverNow = new Date();

const { date } = getIndonesiaDateTime(serverNow);

const now = serverNow.toISOString();
    // --------------------------------------
    // 9. Cek absensi hari ini
    // --------------------------------------
    const { data: absensiHariIni, error: cekError } =
      await supabaseAdmin
        .from("absensi_finger")
        .select(`
          id,
          tanggal,
          jam_masuk,
          jam_pulang,
          status
        `)
        .eq("pengguna_id", penggunaId)
        .eq("tanggal", date)
        .maybeSingle();

    if (cekError) {
      console.error("CEK ABSENSI ERROR:", cekError);

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memeriksa absensi hari ini.",
        },
        { status: 500 }
      );
    }

    // ======================================
    // 10. ABSEN MASUK
    // ======================================
    if (tipe === "masuk") {
      if (absensiHariIni?.jam_masuk) {
        return NextResponse.json(
          {
            success: false,
            code: "ALREADY_CHECKIN",
            message: "Anda sudah melakukan absen masuk hari ini.",
          },
          { status: 409 }
        );
      }

      // Jika record sudah ada, update
      if (absensiHariIni) {
        const { data, error } = await supabaseAdmin
          .from("absensi_finger")
          .update({
            jam_masuk: now,
            latitude_masuk: latitude,
            longitude_masuk: longitude,
            akurasi_masuk:
              typeof accuracy === "number"
                ? accuracy
                : null,
            jarak_masuk: jarakBulat,
            status: "Hadir",
            updated_at: now,
          })
          .eq("id", absensiHariIni.id)
          .select()
          .single();

        if (error) {
          console.error("UPDATE ABSEN MASUK ERROR:", error);

          return NextResponse.json(
            {
              success: false,
              message: "Gagal menyimpan absen masuk.",
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Absen masuk berhasil.",
          data,
        });
      }

      // Jika belum ada record, insert
      const { data, error } = await supabaseAdmin
        .from("absensi_finger")
        .insert({
          pengguna_id: penggunaId,
          tanggal: date,
          jam_masuk: now,
          latitude_masuk: latitude,
          longitude_masuk: longitude,
          akurasi_masuk:
            typeof accuracy === "number"
              ? accuracy
              : null,
          jarak_masuk: jarakBulat,
          status: "Hadir",
        })
        .select()
        .single();

      if (error) {
        console.error("INSERT ABSEN MASUK ERROR:", error);

        return NextResponse.json(
          {
            success: false,
            message: "Gagal menyimpan absen masuk.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Absen masuk berhasil.",
        data,
      });
    }

    // ======================================
    // 11. ABSEN PULANG
    // ======================================
    if (tipe === "pulang") {
      if (!absensiHariIni) {
        return NextResponse.json(
          {
            success: false,
            code: "NO_CHECKIN",
            message:
              "Anda belum melakukan absen masuk hari ini.",
          },
          { status: 400 }
        );
      }

      if (!absensiHariIni.jam_masuk) {
        return NextResponse.json(
          {
            success: false,
            code: "NO_CHECKIN",
            message:
              "Anda belum melakukan absen masuk hari ini.",
          },
          { status: 400 }
        );
      }

      if (absensiHariIni.jam_pulang) {
        return NextResponse.json(
          {
            success: false,
            code: "ALREADY_CHECKOUT",
            message:
              "Anda sudah melakukan absen pulang hari ini.",
          },
          { status: 409 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("absensi_finger")
        .update({
          jam_pulang: now,
          latitude_pulang: latitude,
          longitude_pulang: longitude,
          akurasi_pulang:
            typeof accuracy === "number"
              ? accuracy
              : null,
          jarak_pulang: jarakBulat,
          updated_at: now,
        })
        .eq("id", absensiHariIni.id)
        .select()
        .single();

      if (error) {
        console.error("UPDATE ABSEN PULANG ERROR:", error);

        return NextResponse.json(
          {
            success: false,
            message: "Gagal menyimpan absen pulang.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Absen pulang berhasil.",
        data,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Permintaan tidak valid.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("ABSENSI FINGER EXCEPTION:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server.",
      },
      { status: 500 }
    );
  }
}