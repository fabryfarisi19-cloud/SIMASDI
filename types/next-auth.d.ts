import "next-auth";
import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    penggunaId?: string;
    username?: string;
    role?: string;
    accessToken?: string;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    username?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    penggunaId?: string;
    username?: string;
    role?: string;
    accessToken?: string;
  }
}
