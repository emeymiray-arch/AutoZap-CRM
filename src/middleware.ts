import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

/**
 * Явная ссылка на секреты — иначе Edge Middleware на Vercel может
 * собрать бандл без AUTH_SECRET и Auth.js сгенерирует новый ключ
 * на каждом инстансе → все вылетают из аккаунтов после деплоя.
 */
void process.env.AUTH_SECRET;
void process.env.NEXTAUTH_SECRET;

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const path = req.nextUrl.pathname;
  const isLogin = path.startsWith("/login");
  const isRegister = path.startsWith("/register");
  const isApiAuth = path.startsWith("/api/auth");
  const isHealth = path.startsWith("/api/health");
  const isCron = path.startsWith("/api/cron");
  const isPublic = isLogin || isRegister || isHealth || isCron;

  if (isApiAuth || isHealth || isCron) return NextResponse.next();

  if (
    path.startsWith("/crm/contacts") ||
    path.startsWith("/crm/leads") ||
    path.startsWith("/crm/deals") ||
    path.startsWith("/crm/companies") ||
    path.startsWith("/activities")
  ) {
    return NextResponse.redirect(new URL("/partners", req.nextUrl.origin));
  }

  if (!isLoggedIn && !isPublic) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && (isLogin || isRegister)) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Protect everything including /uploads — files served only via authenticated API
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
