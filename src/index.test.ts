import { describe, it, expect, vi } from "vitest";

// Mock cloudflare:workers (not available in test environment)
vi.mock("cloudflare:workers", () => ({
  WorkerEntrypoint: class {},
}));

describe("OAuthProvider export", () => {
  it("exports an object with a fetch method", async () => {
    const worker = (await import("./index.js")).default;
    expect(worker).toBeDefined();
    expect(typeof worker.fetch).toBe("function");
  });
});

describe("TaneMcpSession export", () => {
  it("exports TaneMcpSession class", async () => {
    const { TaneMcpSession } = await import("./index.js");
    expect(TaneMcpSession).toBeDefined();
    expect(typeof TaneMcpSession).toBe("function");
  });
});
