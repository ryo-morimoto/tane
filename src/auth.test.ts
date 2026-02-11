import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateState,
  handleAuthRedirect,
  handleAuthCallback,
  extractToken,
  type AuthConfig,
} from "./auth.js";

const authConfig: AuthConfig = {
  clientId: "test-client-id",
  clientSecret: "test-client-secret",
  appSlug: "test-app",
};

describe("generateState", () => {
  it("returns a 64-character hex string", () => {
    const state = generateState();
    expect(state).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns unique values on each call", () => {
    const a = generateState();
    const b = generateState();
    expect(a).not.toBe(b);
  });
});

describe("extractToken", () => {
  it("extracts Bearer token", () => {
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer xxx" },
    });
    expect(extractToken(req)).toBe("xxx");
  });

  it("handles lowercase bearer", () => {
    const req = new Request("http://localhost", {
      headers: { Authorization: "bearer xxx" },
    });
    expect(extractToken(req)).toBe("xxx");
  });

  it("returns null for empty value", () => {
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer " },
    });
    expect(extractToken(req)).toBeNull();
  });

  it("returns null for missing header", () => {
    const req = new Request("http://localhost");
    expect(extractToken(req)).toBeNull();
  });

  it("returns null for Basic auth", () => {
    const req = new Request("http://localhost", {
      headers: { Authorization: "Basic xxx" },
    });
    expect(extractToken(req)).toBeNull();
  });
});

describe("handleAuthRedirect", () => {
  it("returns 302 redirect to GitHub App install page", () => {
    const req = new Request("https://example.com/auth/github");
    const res = handleAuthRedirect(authConfig, req);
    expect(res.status).toBe(302);
    const location = res.headers.get("Location")!;
    expect(location).toContain("github.com/apps/test-app/installations/new");
    expect(location).toContain("state=");
  });

  it("sets HttpOnly Secure SameSite cookie", () => {
    const req = new Request("https://example.com/auth/github");
    const res = handleAuthRedirect(authConfig, req);
    const cookie = res.headers.get("Set-Cookie")!;
    expect(cookie).toContain("oauth_state=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Max-Age=600");
    expect(cookie).toContain("Path=/auth/callback");
  });

  it("includes security headers", () => {
    const req = new Request("https://example.com/auth/github");
    const res = handleAuthRedirect(authConfig, req);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});

describe("handleAuthCallback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 for missing code", async () => {
    const req = new Request(
      "https://example.com/auth/callback?state=abc",
      { headers: { Cookie: "oauth_state=abc" } },
    );
    const res = await handleAuthCallback(authConfig, req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing state", async () => {
    const req = new Request(
      "https://example.com/auth/callback?code=abc",
      { headers: { Cookie: "oauth_state=abc" } },
    );
    const res = await handleAuthCallback(authConfig, req);
    expect(res.status).toBe(400);
  });

  it("returns 403 for missing cookie", async () => {
    const req = new Request(
      "https://example.com/auth/callback?code=abc&state=abc",
    );
    const res = await handleAuthCallback(authConfig, req);
    expect(res.status).toBe(403);
  });

  it("returns 403 for state mismatch", async () => {
    const req = new Request(
      "https://example.com/auth/callback?code=abc&state=wrong",
      { headers: { Cookie: "oauth_state=correct" } },
    );
    const res = await handleAuthCallback(authConfig, req);
    expect(res.status).toBe(403);
  });

  it("returns HTML with token on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ access_token: "gho_xxx" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const req = new Request(
      "https://example.com/auth/callback?code=valid&state=abc",
      { headers: { Cookie: "oauth_state=abc" } },
    );
    const res = await handleAuthCallback(authConfig, req);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("gho_xxx");
    expect(body).toContain('content="no-referrer"');
    expect(res.headers.get("Content-Security-Policy")).toContain(
      "default-src 'none'",
    );
  });

  it("clears cookie on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ access_token: "gho_xxx" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const req = new Request(
      "https://example.com/auth/callback?code=valid&state=abc",
      { headers: { Cookie: "oauth_state=abc" } },
    );
    const res = await handleAuthCallback(authConfig, req);
    const cookie = res.headers.get("Set-Cookie")!;
    expect(cookie).toContain("Max-Age=0");
  });

  it("returns 400 when code exchange fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "bad_verification_code" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const req = new Request(
      "https://example.com/auth/callback?code=invalid&state=abc",
      { headers: { Cookie: "oauth_state=abc" } },
    );
    const res = await handleAuthCallback(authConfig, req);
    expect(res.status).toBe(400);
  });
});
