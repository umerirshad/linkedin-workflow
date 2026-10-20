import assert from "node:assert/strict";
import test from "node:test";
import { isRequestAuthenticated, isValidAuthToken, privateRouteIsAuthorized, requestUsesHttps } from "../src/lib/auth.ts";

const originalToken = process.env.APP_AUTH_TOKEN;
const originalNodeEnv = process.env.NODE_ENV;
const mutableEnv = process.env as Record<string, string | undefined>;

test.afterEach(() => {
  if (originalToken === undefined) delete mutableEnv.APP_AUTH_TOKEN;
  else mutableEnv.APP_AUTH_TOKEN = originalToken;
  if (originalNodeEnv === undefined) delete mutableEnv.NODE_ENV;
  else mutableEnv.NODE_ENV = originalNodeEnv;
});

test("accepts the configured token and rejects failed login tokens", () => {
  process.env.APP_AUTH_TOKEN = "test-workspace-token";

  assert.equal(isValidAuthToken("test-workspace-token"), true);
  assert.equal(isValidAuthToken("  test-workspace-token\n"), true);
  assert.equal(isValidAuthToken("wrong-token"), false);
  assert.equal(isValidAuthToken(undefined), false);
});

test("recognizes authenticated protected-route requests from the session cookie", () => {
  process.env.APP_AUTH_TOKEN = "test-workspace-token";
  const request = new Request("http://localhost/import", { headers: { cookie: "lw_session=test-workspace-token" } });

  assert.equal(isRequestAuthenticated(request), true);
  assert.equal(privateRouteIsAuthorized(request), true);
  assert.equal(isRequestAuthenticated(new Request("http://localhost/import")), false);
});

test("uses the request protocol when deciding whether the session cookie is secure", () => {
  assert.equal(requestUsesHttps(new Request("http://localhost/api/auth/login")), false);
  assert.equal(requestUsesHttps(new Request("https://workspace.example/api/auth/login")), true);
  assert.equal(requestUsesHttps(new Request("http://internal/api/auth/login", { headers: { "x-forwarded-proto": "https" } })), true);
});
