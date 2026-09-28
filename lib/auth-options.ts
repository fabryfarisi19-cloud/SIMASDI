import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const authOptions: NextAuthOptions = {
  providers: [
    /**
     * =========================================================
     * LOGIN NIP + PASSWORD SIMASDI
     * =========================================================
     */
    CredentialsProvider({
      name: "SIMASDI",

      credentials: {
        username: {
          label: "NIP",
          type: "text",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (
          !credentials?.username ||
          !credentials?.password
        ) {
          return null;
        }

        const username = credentials.username.trim();
        const password = credentials.password;

        /**
         * =====================================================
         * CATATAN
         * =====================================================
         * Untuk sementara database masih menggunakan password
         * plaintext.
         *
         * Nanti sebaiknya dimigrasikan ke bcrypt/argon2.
         * =====================================================
         */

        const { data, error } = await supabaseAdmin
          .from("pengguna")
          .select(
            "id, nama, username, role, status"
          )
          .eq("username", username)
          .eq("password", password)
          .maybeSingle();

        if (error) {
          console.error(
            "Gagal mencari akun SIMASDI:",
            error
          );

          return null;
        }

        if (!data) {
          return null;
        }

        /**
         * Akun nonaktif tidak boleh login.
         */
        if (
          String(data.status || "")
            .trim()
            .toLowerCase() !== "aktif"
        ) {
          return null;
        }

        /**
         * Update waktu login.
         */
        const { error: updateError } =
          await supabaseAdmin
            .from("pengguna")
            .update({
              terakhir_login:
                new Date().toISOString(),
            })
            .eq("id", data.id);

        if (updateError) {
          console.error(
            "Gagal memperbarui terakhir_login:",
            updateError
          );
        }

        /**
         * Jangan pernah masukkan password
         * ke JWT/session.
         */
        return {
          id: String(data.id),
          name: data.nama,
          username: data.username,
          role: data.role,
        };
      },
    }),

    /**
     * =========================================================
     * LOGIN GOOGLE
     * =========================================================
     *
     * Tetap digunakan untuk Google Drive.
     */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,

      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/drive.file",

          access_type: "offline",

          prompt: "consent",
        },
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  callbacks: {
    /**
     * =========================================================
     * JWT
     * =========================================================
     */
    async jwt({
      token,
      user,
      account,
    }) {
      /**
       * Login NIP + Password SIMASDI
       */
      if (user) {
        token.penggunaId = user.id;

        token.username = (user as any).username;

        token.role = (user as any).role;

        token.name = user.name;
      }

      /**
       * Login Google.
       *
       * Access token tetap disimpan untuk Google Drive.
       */
      if (account?.provider === "google") {
        token.accessToken =
          account.access_token;
      }

      return token;
    },

    /**
     * =========================================================
     * SESSION
     * =========================================================
     */
    async session({
      session,
      token,
    }) {
      const sessionAny = session as any;

      sessionAny.penggunaId =
        token.penggunaId;

      sessionAny.username =
        token.username;

      sessionAny.role =
        token.role;

      sessionAny.accessToken =
        token.accessToken;

      session.user = {
        ...session.user,

        name:
          token.name ||
          session.user?.name ||
          null,

        username:
          token.username ||
          null,

        role:
          token.role ||
          null,
      } as any;

      return session;
    },
  },
};