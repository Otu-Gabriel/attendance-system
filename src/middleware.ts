import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  }) as { role?: string; id?: string } | null;

  const path = req.nextUrl.pathname;

  // If no token and trying to access protected routes, redirect to login
  if (!token) {
    if (
      path.startsWith("/admin") ||
      path.startsWith("/employee") ||
      path.startsWith("/api/attendance") ||
      path.startsWith("/api/employees") ||
      path.startsWith("/api/admin")
    ) {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // Admin routes - only accessible by ADMIN role
  if (path.startsWith("/admin")) {
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/employee/dashboard", req.url));
    }
  }

  // Employee routes - only accessible by EMPLOYEE role
  if (path.startsWith("/employee")) {
    if (token.role !== "EMPLOYEE") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
  }

  // API routes protection
  if (path.startsWith("/api/attendance") || path.startsWith("/api/employees") || path.startsWith("/api/admin")) {
    // Admin-only API routes
    if (path.startsWith("/api/employees") || path.startsWith("/api/admin")) {
      if (token.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/employee/:path*",
    "/api/attendance/:path*",
    "/api/employees/:path*",
    "/api/admin/:path*",
  ],
};
