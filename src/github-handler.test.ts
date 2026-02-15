import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitHubHandler } from "./github-handler.js";

const mockEnv = {
  GITHUB_CLIENT_ID: "test-client-id",
  GITHUB_CLIENT_SECRET: "test-client-secret",
  GITHUB_APP_SLUG: "tane-app",
  OAUTH_PROVIDER: {
    parseAuthRequest: vi.fn(),
    lookupClient: vi.fn(),
    completeAuthorization: vi.fn(),
  },
};

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const req = new Request("https://example.com/health");
    const res = await GitHubHandler.fetch(req, mockEnv);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});

describe("GET /authorize", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to GitHub OAuth with valid client", async () => {
    mockEnv.OAUTH_PROVIDER.parseAuthRequest.mockResolvedValue({
      responseType: "code",
      clientId: "client-1",
      redirectUri: "http://localhost/callback",
      scope: ["mcp:tools"],
      state: "client-state",
      codeChallenge: "challenge",
      codeChallengeMethod: "S256",
    });
    mockEnv.OAUTH_PROVIDER.lookupClient.mockResolvedValue({
      clientId: "client-1",
      redirectUris: ["http://localhost/callback"],
    });

    const req = new Request("https://example.com/authorize?client_id=client-1&response_type=code");
    const res = await GitHubHandler.fetch(req, mockEnv);

    expect(res.status).toBe(302);
    const location = res.headers.get("Location")!;
    expect(location).toContain("github.com/login/oauth/authorize");
    expect(location).toContain("client_id=test-client-id");
    expect(location).toContain("scope=repo");
  });

  it("returns 400 for invalid client", async () => {
    mockEnv.OAUTH_PROVIDER.parseAuthRequest.mockResolvedValue({
      clientId: "unknown",
    });
    mockEnv.OAUTH_PROVIDER.lookupClient.mockResolvedValue(null);

    const req = new Request("https://example.com/authorize?client_id=unknown");
    const res = await GitHubHandler.fetch(req, mockEnv);
    expect(res.status).toBe(400);
  });
});

describe("GET /callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("returns 400 for missing parameters", async () => {
    const req = new Request("https://example.com/callback");
    const res = await GitHubHandler.fetch(req, mockEnv);
    expect(res.status).toBe(400);
  });

  it("returns 403 for state mismatch", async () => {
    const req = new Request("https://example.com/callback?code=abc&state=wrong", {
      headers: { Cookie: "oauth_state=correct; oauth_data=" + btoa(JSON.stringify({ oauthReq: {} })) },
    });
    const res = await GitHubHandler.fetch(req, mockEnv);
    expect(res.status).toBe(403);
  });

  it("completes authorization on success", async () => {
    const oauthReq = {
      responseType: "code",
      clientId: "client-1",
      redirectUri: "http://localhost/callback",
      scope: ["mcp:tools"],
      state: "client-state",
    };

    const oauthData = btoa(JSON.stringify({ oauthReq }));

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "ghu_test123" }), {
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ login: "octocat" }), {
          headers: { "Content-Type": "application/json" },
        }),
      );

    mockEnv.OAUTH_PROVIDER.completeAuthorization.mockResolvedValue({
      redirectTo: "http://localhost/callback?code=tane_code&state=client-state",
    });

    const req = new Request("https://example.com/callback?code=ghcode&state=mystate", {
      headers: { Cookie: `oauth_state=mystate; oauth_data=${oauthData}` },
    });
    const res = await GitHubHandler.fetch(req, mockEnv);

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("code=tane_code");
    expect(mockEnv.OAUTH_PROVIDER.completeAuthorization).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "octocat",
        props: {
          login: "octocat",
          accessToken: "ghu_test123",
        },
      }),
    );
  });
});
