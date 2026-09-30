import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { authConfig, SESSION_MAX_AGE } from "./auth.config";
import type { Role } from "./permissions";
import { assertLoginAllowed, recordLoginFailure, recordLoginSuccess } from "./rate-limit";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
    };
  }
  interface User {
    role: Role;
  }
}

if (process.env.NODE_ENV === "production") {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET (или NEXTAUTH_SECRET) должен быть задан в Vercel и не меняться между деплоями — иначе все сессии сбрасываются",
    );
  }
}

/** Раз в час сверяем active/role с БД (только Node runtime, не Edge) */
const JWT_REFRESH_MS = 60 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: 24 * 60 * 60,
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
        token.name = user.name;
        token.email = user.email;
        token.checkedAt = Date.now();
        delete token.error;
        return token;
      }

      const checkedAt = typeof token.checkedAt === "number" ? token.checkedAt : 0;
      if (token.id && Date.now() - checkedAt > JWT_REFRESH_MS) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              active: true,
              archivedAt: true,
              role: true,
              name: true,
              email: true,
            },
          });
          if (!dbUser || !dbUser.active || dbUser.archivedAt) {
            return { ...token, error: "SessionInvalid" };
          }
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.checkedAt = Date.now();
        } catch {
          token.checkedAt = Date.now() - JWT_REFRESH_MS + 60_000;
        }
      }

      return token;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email || "").toLowerCase().trim();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const ip =
          request?.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ||
          request?.headers?.get?.("x-real-ip") ||
          "unknown";

        const gate = assertLoginAllowed(email, ip);
        if (!gate.ok) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.active || user.archivedAt) {
          recordLoginFailure(email, ip);
          return null;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          recordLoginFailure(email, ip);
          return null;
        }

        recordLoginSuccess(email, ip);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
        };
      },
    }),
  ],
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return session!.user;
}
