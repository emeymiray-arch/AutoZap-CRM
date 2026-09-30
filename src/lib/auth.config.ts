import type { NextAuthConfig } from "next-auth";

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

/** 30 дней — сессия переживает деплои, пока AUTH_SECRET не меняют */
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export const authConfig = {
  pages: { signIn: "/login" },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  trustHost: true,
  secret: authSecret,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      if (path.startsWith("/api/auth")) return true;
      if (path.startsWith("/api/health")) return true;
      if (path.startsWith("/api/cron")) return true;
      if (path.startsWith("/login") || path.startsWith("/register")) return true;
      return !!auth?.user;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
        token.name = user.name;
        token.email = user.email;
        token.checkedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (token.error === "SessionInvalid") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).error = "SessionInvalid";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user = undefined as any;
        return session;
      }
      if (session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role;
        session.user.name = (token.name as string) || "";
        session.user.email = (token.email as string) || "";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
