import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// Resolve the NextAuth secret at boot. In production we MUST fail loudly if it
// is missing — silently falling back to a hard-coded string would let anyone
// forge JWTs. In development we tolerate a fallback for convenience.
function resolveNextAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXTAUTH_SECRET is missing or too short (min 16 chars). Set a strong random value in your production environment before starting the app."
    );
  }
  // Development fallback only. Logged once.
  console.warn(
    "[auth] WARNING: NEXTAUTH_SECRET is missing — using insecure development fallback. Set NEXTAUTH_SECRET in .env before deploying."
  );
  return "shafaq-atelier-dev-secret-change-me";
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/", // we use a modal instead of a dedicated page
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role?: string }).role ?? "customer";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = token.id as string;
        (session.user as { id?: string; role?: string }).role = (
          token.role as string
        );
      }
      return session;
    },
  },
  secret: resolveNextAuthSecret(),
};
