import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, authIsConfigured, getAuthTokenFromHeader, isValidAuthToken } from "./src/lib/auth";

function isPrivatePath(pathname: string) {
  return pathname === "/" || pathname === "/import" || pathname.startsWith("/import/") || pathname.startsWith("/api/");
}

export function proxy(request: NextRequest) {
  if (!isPrivatePath(request.nextUrl.pathname) || request.nextUrl.pathname.startsWith("/api/auth/")) return NextResponse.next();

  const configured = authIsConfigured();
  const developmentBypass = process.env.NODE_ENV !== "production" && !configured;
  const cookieToken = request.cookies.get(AUTH_COOKIE)?.value;
  const authorized = developmentBypass || isValidAuthToken(cookieToken ?? getAuthTokenFromHeader(request.headers.get("authorization")));
  if (authorized) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: configured ? "Authentication required" : "Authentication is not configured" }, { status: configured ? 401 : 503 });
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ["/", "/import/:path*", "/api/:path*"] };
