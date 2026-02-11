import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createRepoConfig,
  ensureRepo,
  createFile,
  getFile,
  updateFile,
  listFiles,
  base64Encode,
} from "./github.js";

const config = createRepoConfig("test-token", "testuser");

describe("createRepoConfig", () => {
  it("defaults repo to 'ideas'", () => {
    const c = createRepoConfig("tok", "owner");
    expect(c.repo).toBe("ideas");
    expect(c.owner).toBe("owner");
    expect(c.token).toBe("tok");
  });

  it("allows custom repo", () => {
    const c = createRepoConfig("tok", "owner", "custom-repo");
    expect(c.repo).toBe("custom-repo");
  });
});

describe("ensureRepo", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("does nothing if repo exists", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), { status: 200 }),
    );
    await ensureRepo(config);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("throws if repo not found (404)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Not Found", { status: 404 }),
    );
    await expect(ensureRepo(config)).rejects.toThrow(
      'Repository "testuser/ideas" not found',
    );
  });
});

describe("createFile", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("PUTs base64 encoded content", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ content: {} }), { status: 201 }),
    );

    await createFile(config, "2025-04-01-test", "---\ntitle: Test\n---\n");
    expect(spy).toHaveBeenCalledTimes(1);
    const [url, opts] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/contents/ideas/2025-04-01-test.md");
    const body = JSON.parse(opts.body as string);
    expect(body.content).toBe(base64Encode("---\ntitle: Test\n---\n"));
  });
});

describe("getFile", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns decoded content and sha", async () => {
    const encoded = base64Encode("---\ntitle: Test\n---\n\nBody here.\n");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ content: encoded, sha: "abc123" }),
        { status: 200 },
      ),
    );

    const result = await getFile(config, "2025-04-01-test");
    expect(result.content).toBe("---\ntitle: Test\n---\n\nBody here.\n");
    expect(result.sha).toBe("abc123");
  });

  it("throws on non-existing file", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Not Found", { status: 404 }),
    );

    await expect(getFile(config, "nonexistent")).rejects.toThrow();
  });
});

describe("updateFile", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("PUTs with sha for optimistic locking", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ content: {} }), { status: 200 }),
    );

    await updateFile(config, "2025-04-01-test", "new content", "sha123");
    const [, opts] = spy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(opts.body as string);
    expect(body.sha).toBe("sha123");
    expect(body.content).toBe(base64Encode("new content"));
  });
});

describe("listFiles", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns idea IDs from directory listing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          { name: "2025-04-01-idea-a.md" },
          { name: "2025-04-01-idea-b.md" },
          { name: ".gitkeep" },
        ]),
        { status: 200 },
      ),
    );

    const ids = await listFiles(config);
    expect(ids).toEqual(["2025-04-01-idea-a", "2025-04-01-idea-b"]);
  });

  it("returns empty array on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Not Found", { status: 404 }),
    );

    const ids = await listFiles(config);
    expect(ids).toEqual([]);
  });
});
