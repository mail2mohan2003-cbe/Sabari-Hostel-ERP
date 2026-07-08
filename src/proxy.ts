import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "sabari_admin_session";

function getSecret() {
  const secret = process.env.SESSION_SECRET || "dev-only-insecure-secret";
  return new TextEncoder().encode(secret);
}

async function isAuthenticated(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublicAdminPath = pathname === "/admin/login";
  const isPublicApiPath = pathname === "/api/admin/login";

  if (isPublicAdminPath || isPublicApiPath) {
    return NextResponse.next();
  }

  const authed = await isAuthenticated(req);

  if (!authed) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
