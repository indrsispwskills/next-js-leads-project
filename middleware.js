import { NextResponse } from "next/server";

const protectedPaths = ["/dashboard", "/workspace", "/api/workspace", "/api/task", "/api/dashboard", "/api/upload"];

export function middleware(request) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/workspace/:path*", "/api/workspace/:path*", "/api/task/:path*", "/api/dashboard/:path*", "/api/upload/:path*"],
};
