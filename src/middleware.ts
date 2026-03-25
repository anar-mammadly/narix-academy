import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/server/config/constants";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/admin") && !hasSession) {
    const u = new URL("/login", req.url);
    u.searchParams.set("next", pathname);
    return NextResponse.redirect(u);
  }

  if (pathname.startsWith("/dashboard") && !hasSession) {
    const u = new URL("/login", req.url);
    u.searchParams.set("next", pathname);
    return NextResponse.redirect(u);
  }

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/login"],
};
