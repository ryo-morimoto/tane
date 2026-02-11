import { describe, it, expect, vi, beforeEach } from "vitest";
import { gh, base64Encode, base64Decode, getUser } from "./github.js";

describe("base64Encode / base64Decode", () => {
  it("round-trips ASCII string", () => {
    const text = "Hello, world!";
    expect(base64Decode(base64Encode(text))).toBe(text);
  });

  it("round-trips Japanese (UTF-8 multibyte)", () => {
    const text = "日本語テスト";
    expect(base64Decode(base64Encode(text))).toBe(text);
  });

  it("handles empty string", () => {
    expect(base64Encode("")).toBe("");
    expect(base64Decode("")).toBe("");
  });
});

describe("gh", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sets Authorization header correctly", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ login: "test" }), { status: 200 }),
    );

    await gh("/user", "test-token");

    expect(spy).toHaveBeenCalledWith(
      "https://api.github.com/user",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
          Accept: "application/vnd.github+json",
        }),
      }),
    );
  });

  it("returns parsed JSON on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), { status: 200 }),
    );

    const result = await gh("/repos/owner/repo", "token");
    expect(result).toEqual({ id: 1 });
  });

  it("throws on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Not Found", { status: 404 }),
    );

    await expect(gh("/repos/owner/nonexistent", "token")).rejects.toThrow();
  });

  it("throws on 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Unauthorized", { status: 401 }),
    );

    await expect(gh("/user", "bad-token")).rejects.toThrow();
  });
});

describe("getUser", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns login on valid token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ login: "octocat" }), { status: 200 }),
    );

    const user = await getUser("valid-token");
    expect(user).toEqual({ login: "octocat" });
  });

  it("throws on invalid token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Unauthorized", { status: 401 }),
    );

    await expect(getUser("bad-token")).rejects.toThrow();
  });
});
