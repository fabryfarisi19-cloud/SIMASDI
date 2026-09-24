
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "@/lib/supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        (token as any).accessToken = account.access_token;
      }

      return token;
    },

    async session({ session, token }) {
      try {
        const namaGoogle = session.user?.name;

        if (namaGoogle) {
          const { data: pengguna, error } = await supabase
            .from("pengguna")
            .select(`
              id,
              nama,
              username,
              role,
              status
            `)
            .eq("nama", namaGoogle)
            .maybeSingle();

          if (error) {
            console.error(
              "GAGAL MENGAMBIL DATA PENGGUNA:",
              error
            );
          }

          if (pengguna) {
            (session.user as any).penggunaId =
              pengguna.id;

            (session.user as any).username =
              pengguna.username;

            (session.user as any).nama =
              pengguna.nama;

            (session.user as any).role =
              pengguna.role;

            (session.user as any).status =
              pengguna.status;
          }
        }

        (session.user as any).accessToken =
          (token as any).accessToken;

        return session;
      } catch (error) {
        console.error(
          "ERROR SESSION NEXTAUTH:",
          error
        );

        return session;
      }
    },
  },
};

