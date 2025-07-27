
import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, createUser } from "@/lib/data";
import bcrypt from 'bcryptjs';
import dbConnect from "@/lib/mongodb";
import UserModel from "@/models/user";
import type { User } from "@/lib/types";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          await dbConnect();
          const user = await getUserByEmail(credentials.email);

          if (!user) {
            throw new Error("No user found with this email.");
          }

          if (!user.password) {
            throw new Error("This account was created with a different sign-in method.");
          }

          const passwordsMatch = await bcrypt.compare(credentials.password, user.password);

          if (!passwordsMatch) {
            throw new Error("Incorrect password.");
          }
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        }
      })
  ],
  callbacks: {
    async signIn({ user, account }: { user: any, account: any }) {
      await dbConnect();
      if (account.provider === "google") {
        const existingUser = await getUserByEmail(user.email);
        if (!existingUser) {
           await createUser({
            name: user.name,
            email: user.email,
            image: user.image,
          });
        }
        return true;
      }
      if (account.provider === "credentials") {
          return true;
      }
      return false; 
    },
    async session({ session, token }: { session: any, token: any }) {
      if (session.user) {
        const userFromDb = await getUserByEmail(session.user.email!);
        if(userFromDb){
          session.user.id = userFromDb.id;
          session.user.image = userFromDb.image;
        }
      }
      return session;
    },
    async jwt({ token, user } : {token: any, user: any}) {
        if (user) {
            token.sub = user.id;
            token.picture = user.image;
        }
        return token;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
