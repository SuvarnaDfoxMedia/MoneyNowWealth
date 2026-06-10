import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const userToken = req.cookies.get("user_token")?.value;
  const adminToken = req.cookies.get("admin_token")?.value;
  const { pathname } = req.nextUrl;

  // Protect ALL /user routes
  if (pathname.startsWith("/user")) {
    // Explicitly reject admin token-only sessions on public user routes.
    if (!userToken || (!!adminToken && !userToken)) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  return NextResponse.next();
}

// Apply middleware ONLY to /user routes
export const config = {
  matcher: ["/user/:path*"],
};
