import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    /**
     * Ambil session pengguna yang sedang login.
     */
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Sesi pengguna tidak ditemukan. Silakan login kembali.",
        },
        { status: 401 }
      );
    }

    /**
     * Ambil pengguna ID dari session NextAuth.
     */
    const penggunaId = (session as any).penggunaId;

    if (!penggunaId) {
      return NextResponse.json(
        {
          success: false,
          message: "Identitas pengguna tidak ditemukan dalam sesi.",
        },
        { status: 401 }
      );
    }

    /**
     * Ambil data dari request.
     */
    const body = await request.json();

    const passwordLama = String(body.passwordLama ?? "");
    const passwordBaru = String(body.passwordBaru ?? "");
    const konfirmasiPassword = String(
      body.konfirmasiPassword ?? ""
    );

    /**
     * Validasi input kosong.
     */
    if (!passwordLama || !passwordBaru || !konfirmasiPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Semua kolom password wajib diisi.",
        },
        { status: 400 }
      );
    }

    /**
     * Password baru tidak boleh sama dengan password lama.
     */
    if (passwordLama === passwordBaru) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password baru harus berbeda dengan password lama.",
        },
        { status: 400 }
      );
    }

    /**
     * Konfirmasi password baru.
     */
    if (passwordBaru !== konfirmasiPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Konfirmasi password baru tidak sama.",
        },
        { status: 400 }
      );
    }

    /**
     * Validasi panjang password.
     *
     * Minimal 8 karakter agar lebih aman.
     */
    if (passwordBaru.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password baru minimal 8 karakter.",
        },
        { status: 400 }
      );
    }

    /**
     * Ambil data pengguna berdasarkan ID dari session.
     *
     * Kita tidak menggunakan username dari form.
     * ID dari session lebih aman untuk menentukan
     * akun mana yang boleh diubah.
     */
    const { data: pengguna, error: penggunaError } =
      await supabaseAdmin
        .from("pengguna")
        .select("id, nama, username, password, status")
        .eq("id", penggunaId)
        .maybeSingle();

    if (penggunaError) {
      console.error(
        "Gagal mengambil data pengguna:",
        penggunaError.message
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Terjadi kesalahan saat memeriksa akun pengguna.",
        },
        { status: 500 }
      );
    }

    if (!pengguna) {
      return NextResponse.json(
        {
          success: false,
          message: "Data pengguna tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    /**
     * Cek status akun.
     */
    if (pengguna.status === "Nonaktif") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Akun Anda tidak aktif. Perubahan password tidak dapat dilakukan.",
        },
        { status: 403 }
      );
    }

    /**
     * Verifikasi password lama.
     *
     * Database SIMASDI saat ini masih menyimpan
     * password plaintext sehingga dibandingkan
     * langsung.
     */
    if (pengguna.password !== passwordLama) {
      return NextResponse.json(
        {
          success: false,
          message: "Password lama yang Anda masukkan salah.",
        },
        { status: 400 }
      );
    }

    /**
     * Update password baru.
     *
     * Tetap menggunakan kolom "password"
     * karena struktur tabel saat ini belum
     * menggunakan password_hash.
     */
    const { error: updateError } = await supabaseAdmin
      .from("pengguna")
      .update({
        password: passwordBaru,
      })
      .eq("id", penggunaId);

    if (updateError) {
      console.error(
        "Gagal mengubah password:",
        updateError.message
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Password gagal diubah. Silakan coba lagi.",
        },
        { status: 500 }
      );
    }

    /**
     * Berhasil.
     */
    return NextResponse.json(
      {
        success: true,
        message:
          "Password berhasil diubah. Silakan login kembali menggunakan password baru.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Error API change-password:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}