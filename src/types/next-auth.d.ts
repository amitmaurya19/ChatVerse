
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    image?: string | null;
  }
}
