import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUserByEmail } from "@/lib/data";
import bcrypt from 'bcryptjs';

export const authOptions = {
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

          const user = await getUserByEmail(credentials.email);

          if (!user) {
            // By returning null, NextAuth will redirect to the login page with a generic error.
            // Throwing an error provides a specific message.
            throw new Error("No user found with this email.");
          }

          if (!user.password) {
            // User signed up with an OAuth provider (e.g., Google)
            throw new Error("This account was created with a different sign-in method.");
          }

          const passwordsMatch = await bcrypt.compare(credentials.password, user.password);

          if (!passwordsMatch) {
            throw new Error("Incorrect password.");
          }
          
          // Return user object but without the password
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
    async signIn({ user, account, profile }: { user: any, account: any, profile: any }) {
      if (account.provider === "google") {
        const userRef = doc(db, "users", user.id);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          // If it's a new user, create a document in Firestore
          await setDoc(userRef, {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            createdAt: serverTimestamp(),
          });
        }
        return true;
      }
      if (account.provider === "credentials") {
          return true;
      }
      return false; // Prevent sign-in from other providers if any
    },
    async session({ session, token }: { session: any, token: any }) {
      // Add user ID to the session object
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
