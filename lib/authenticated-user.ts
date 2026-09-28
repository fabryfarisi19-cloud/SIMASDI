import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type AuthenticatedUser = {
  id: string;
  username: string;
  nama: string;
  role: string;
  status: string;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return null;
    }

    const sessionAny = session as any;

    const penggunaId = String(
      sessionAny.penggunaId ||
        sessionAny.user?.id ||
        ""
    ).trim();

    const username = String(
      sessionAny.username ||
        sessionAny.user?.username ||
        ""
    ).trim();

    if (!penggunaId && !username) {
      return null;
    }

    /**
     * Jangan langsung percaya role dari session.
     *
     * Role dan status diverifikasi kembali ke database.
     */
    let query = supabaseAdmin
      .from("pengguna")
      .select("id, nama, username, role, status");

    if (penggunaId) {
      query = query.eq("id", penggunaId);
    } else {
      query = query.eq("username", username);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error(
        "Gagal memverifikasi pengguna:",
        error
      );

      return null;
    }

    if (!data) {
      return null;
    }

    /**
     * Akun nonaktif tidak boleh menggunakan API.
     */
    if (
      String(data.status || "")
        .trim()
        .toLowerCase() !== "aktif"
    ) {
      return null;
    }

    return {
      id: String(data.id),
      username: String(data.username || ""),
      nama: String(data.nama || ""),
      role: String(data.role || ""),
      status: String(data.status || ""),
    };
  } catch (error) {
    console.error(
      "Kesalahan validasi autentikasi:",
      error
    );

    return null;
  }
}