import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const authOptions: NextAuthOptions = {
  providers: [
    /**
     * LOGIN NIP + PASSWORD SIMASDI
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
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = credentials.username.trim();
        const password = credentials.password;

        /**
         * Query dilakukan DI SERVER menggunakan service role.
         *
         * Untuk tahap 1 kita masih menggunakan password plaintext
         * karena database SIMASDI saat ini masih menyimpan password
         * dalam bentuk tersebut.
         *
         * HASH PASSWORD akan kita kerjakan pada tahap berikutnya.
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
            "Gagal memeriksa login SIMASDI:",
            error.message
          );

          return null;
        }

        if (!data) {
          return null;
        }

        if (data.status === "Nonaktif") {
          return null;
        }

        /**
         * Perbarui waktu login.
         */
        const { error: updateError } = await supabaseAdmin
          .from("pengguna")
          .update({
            terakhir_login: new Date().toISOString(),
          })
          .eq("id", data.id);

        if (updateError) {
          console.error(
            "Gagal memperbarui terakhir_login:",
            updateError.message
          );
        }

        /**
         * Data yang masuk ke JWT/session.
         *
         * Jangan masukkan password.
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
     * LOGIN GOOGLE
     *
     * Tetap digunakan untuk koneksi Google Drive.
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
     * Simpan identitas pengguna SIMASDI ke JWT.
     */
    async jwt({ token, user, account }) {
      /**
       * Login NIP/password
       */
      if (user) {
        token.penggunaId = user.id;
        token.username = (user as any).username;
        token.role = (user as any).role;
        token.name = user.name;
      }

      /**
       * Login Google
       *
       * Access token Google tetap disimpan untuk Google Drive.
       */
      if (account?.provider === "google") {
        token.accessToken = account.access_token;
      }

      return token;
    },

    /**
     * Masukkan data JWT ke session.
     */
    async session({ session, token }) {
      (session as any).penggunaId = token.penggunaId;
      (session as any).username = token.username;
      (session as any).role = token.role;
      (session as any).accessToken = token.accessToken;

  session.user = {
  ...session.user,
  name: token.name,
  username: token.username,
  role: token.role,
};

      return session;
    },
  },
};