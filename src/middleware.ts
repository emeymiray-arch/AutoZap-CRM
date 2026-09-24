import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const isLogin = path.startsWith("/login");
  const isRegister = path.startsWith("/register");
  const isApiAuth = path.startsWith("/api/auth");
  const isPublic = isLogin || isRegister;

  if (isApiAuth) return NextResponse.next();

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
