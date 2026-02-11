import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules before importing
vi.mock("./mcp.js", () => ({
  handleMcp: vi.fn(() => new Response("MCP OK")),
}));
vi.mock("./auth.js", () => ({
  handleAuthRedirect: vi.fn(() => new Response(null, { status: 302 })),
  handleAuthCallback: vi.fn(() => new Response("Callback OK")),
}));

const worker = (await import("./index.js")).default;
const env = { GITHUB_CLIENT_ID: "id", GITHUB_CLIENT_SECRET: "secret" };

describe("routing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("GET /health returns 200 with status ok", async () => {
    const req = new Request("https://example.com/health");
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("POST /health returns 404", async () => {
    const req = new Request("https://example.com/health", { method: "POST" });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(404);
  });

  it("POST /mcp routes to MCP handler", async () => {
    const { handleMcp } = await import("./mcp.js");
    const req = new Request("https://example.com/mcp", { method: "POST" });
    await worker.fetch(req, env);
    expect(handleMcp).toHaveBeenCalledOnce();
  });

  it("GET /mcp routes to MCP handler", async () => {
    const { handleMcp } = await import("./mcp.js");
    const req = new Request("https://example.com/mcp");
    await worker.fetch(req, env);
    expect(handleMcp).toHaveBeenCalledOnce();
  });

  it("DELETE /mcp routes to MCP handler", async () => {
    const { handleMcp } = await import("./mcp.js");
    const req = new Request("https://example.com/mcp", { method: "DELETE" });
    await worker.fetch(req, env);
    expect(handleMcp).toHaveBeenCalledOnce();
  });

  it("GET /auth/github routes to auth redirect", async () => {
    const { handleAuthRedirect } = await import("./auth.js");
    const req = new Request("https://example.com/auth/github");
    await worker.fetch(req, env);
    expect(handleAuthRedirect).toHaveBeenCalledOnce();
  });

  it("GET /auth/callback routes to auth callback", async () => {
    const { handleAuthCallback } = await import("./auth.js");
    const req = new Request("https://example.com/auth/callback?code=x&state=y");
    await worker.fetch(req, env);
    expect(handleAuthCallback).toHaveBeenCalledOnce();
  });

  it("GET /unknown returns 404", async () => {
    const req = new Request("https://example.com/unknown");
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(404);
  });
});
