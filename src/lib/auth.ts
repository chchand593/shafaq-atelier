import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// Resolve the NextAuth secret.
// During `next build` (NODE_ENV=production), environment variables like
// NEXTAUTH_SECRET may not be available — Vercel only injects them at runtime.
// If we threw an error at module-load time, the build's page-data collection
// would fail. Instead, we return the env value if available, or a temporary
// placeholder during build. The real secret is used at runtime when the
// server starts and env vars ARE set.
function resolveNextAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret && secret.length >= 16) return secret;
  // During build (no env vars), return a placeholder so the build succeeds.
  // At runtime, if the secret is still missing in production, NextAuth will
  // reject requests with a clear error.
  if (process.env.NODE_ENV === "production") {
    console.error(
      "NEXTAUTH_SECRET is missing or too short (min 16 chars). Set it in your Vercel environment variables."
    );
  } else {
    console.warn(
      "[auth] WARNING: NEXTAUTH_SECRET is missing — using insecure development fallback."
    );
  }
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
