import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  // Protect ALL /user routes
  if (pathname.startsWith("/user")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  return NextResponse.next();
}

// Apply middleware ONLY to /user routes
export const config = {
  matcher: ["/user/:path*"],
};
