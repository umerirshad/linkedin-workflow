export const AUTH_COOKIE = "lw_session";

export function requestUsesHttps(request: Request) {
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  return (forwardedProtocol ?? new URL(request.url).protocol.replace(":", "")) === "https";
}

function configuredAuthToken() {
  return process.env.APP_AUTH_TOKEN?.trim() || undefined;
}

export function authIsConfigured() {
  return Boolean(configuredAuthToken());
}

export function isValidAuthToken(candidate: string | undefined) {
  const expected = configuredAuthToken();
  const normalizedCandidate = candidate?.trim();
  if (!expected || !normalizedCandidate) return false;
  if (expected.length !== normalizedCandidate.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected.charCodeAt(index) ^ normalizedCandidate.charCodeAt(index);
  return difference === 0;
}

export function getAuthTokenFromHeader(header: string | null) {
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length).trim() || undefined;
}

export function isRequestAuthenticated(request: Request) {
  const cookie = request.headers.get("cookie")?.match(/(?:^|;\s*)lw_session=([^;]+)/)?.[1];
  return isValidAuthToken(cookie ?? getAuthTokenFromHeader(request.headers.get("authorization")));
}

export function privateRouteIsAuthorized(request: Request) {
  return process.env.NODE_ENV !== "production" && !authIsConfigured() ? true : isRequestAuthenticated(request);
}
