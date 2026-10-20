import { NextResponse } from "next/server";
import { authIsConfigured, AUTH_COOKIE, isValidAuthToken, requestUsesHttps } from "@/lib/auth";

export async function POST(request: Request) {
  if (!authIsConfigured()) return Response.json({ error: "Authentication is not configured" }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid login request" }, { status: 400 });
  }
  const token = body && typeof body === "object" && "token" in body && typeof body.token === "string" ? body.token : undefined;
  if (!token || !isValidAuthToken(token)) return Response.json({ error: "Invalid authentication token" }, { status: 401 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, token.trim(), { httpOnly: true, sameSite: "lax", secure: requestUsesHttps(request), path: "/" });
  return response;
}
