import { describe, it, expect, vi, beforeEach } from "vitest";
import { createIdea, listIdeas, getIdea, updateIdea, searchIdeas } from "./core.js";
import * as github from "./github.js";

const config: github.RepoConfig = { token: "tok", owner: "user", repo: "ideas" };

describe("createIdea", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("creates idea with generated ID and dates", async () => {
    vi.spyOn(github, "ensureRepo").mockResolvedValue(undefined);
    const createFileSpy = vi.spyOn(github, "createFile").mockResolvedValue(undefined);

    const idea = await createIdea(config, { title: "Test Idea", tags: ["ai"] });

    expect(idea.title).toBe("Test Idea");
    expect(idea.status).toBe("seed");
    expect(idea.tags).toEqual(["ai"]);
    expect(idea.id).toContain("test-idea");
    expect(idea.created_at).toBeTruthy();
    expect(idea.updated_at).toBeTruthy();
    expect(idea.body).toBe("");
    expect(createFileSpy).toHaveBeenCalledOnce();
  });

  it("sets body if provided", async () => {
    vi.spyOn(github, "ensureRepo").mockResolvedValue(undefined);
    vi.spyOn(github, "createFile").mockResolvedValue(undefined);

    const idea = await createIdea(config, { title: "With Body", body: "Details here." });

    expect(idea.body).toBe("Details here.");
  });
});

describe("listIdeas", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns all ideas", async () => {
    vi.spyOn(github, "listFiles").mockResolvedValue(["2025-04-01-a", "2025-04-01-b"]);
    vi.spyOn(github, "getFile")
      .mockResolvedValueOnce({
        content: '---\nid: "2025-04-01-a"\ntitle: A\nstatus: seed\ncreated_at: "2025-04-01"\nupdated_at: "2025-04-01"\ntags: []\n---\n',
        sha: "sha1",
      })
      .mockResolvedValueOnce({
        content: '---\nid: "2025-04-01-b"\ntitle: B\nstatus: growing\ncreated_at: "2025-04-01"\nupdated_at: "2025-04-01"\ntags: []\n---\n',
        sha: "sha2",
      });

    const ideas = await listIdeas(config);
    expect(ideas).toHaveLength(2);
    expect(ideas[0].title).toBe("A");
    expect(ideas[1].title).toBe("B");
  });

  it("filters by status", async () => {
    vi.spyOn(github, "listFiles").mockResolvedValue(["2025-04-01-a", "2025-04-01-b"]);
    vi.spyOn(github, "getFile")
      .mockResolvedValueOnce({
        content: '---\nid: "2025-04-01-a"\ntitle: A\nstatus: seed\ncreated_at: "2025-04-01"\nupdated_at: "2025-04-01"\ntags: []\n---\n',
        sha: "sha1",
      })
      .mockResolvedValueOnce({
        content: '---\nid: "2025-04-01-b"\ntitle: B\nstatus: growing\ncreated_at: "2025-04-01"\nupdated_at: "2025-04-01"\ntags: []\n---\n',
        sha: "sha2",
      });

    const ideas = await listIdeas(config, "seed");
    expect(ideas).toHaveLength(1);
    expect(ideas[0].status).toBe("seed");
  });
});

describe("getIdea", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns the idea", async () => {
    vi.spyOn(github, "getFile").mockResolvedValue({
      content: '---\nid: "2025-04-01-test"\ntitle: Test\nstatus: seed\ncreated_at: "2025-04-01"\nupdated_at: "2025-04-01"\ntags: []\n---\n\nBody.\n',
      sha: "sha1",
    });

    const idea = await getIdea(config, "2025-04-01-test");
    expect(idea.title).toBe("Test");
    expect(idea.body).toBe("Body.");
  });
});

describe("updateIdea", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("merges updates and sets updated_at", async () => {
    vi.spyOn(github, "getFile").mockResolvedValue({
      content: '---\nid: "2025-04-01-test"\ntitle: Test\nstatus: seed\ncreated_at: "2025-04-01"\nupdated_at: "2025-04-01"\ntags: []\n---\n\nOld body.\n',
      sha: "sha1",
    });
    const updateSpy = vi.spyOn(github, "updateFile").mockResolvedValue(undefined);

    const idea = await updateIdea(config, "2025-04-01-test", {
      status: "growing",
      body: "New body.",
    });

    expect(idea.status).toBe("growing");
    expect(idea.body).toBe("New body.");
    expect(idea.title).toBe("Test");
    expect(idea.updated_at).not.toBe("2025-04-01");
    expect(updateSpy).toHaveBeenCalledOnce();
  });
});

describe("searchIdeas", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns matching ideas", async () => {
    vi.spyOn(github, "listFiles").mockResolvedValue(["2025-04-01-ai", "2025-04-01-web"]);
    vi.spyOn(github, "getFile")
      .mockResolvedValueOnce({
        content: '---\nid: "2025-04-01-ai"\ntitle: AI Project\nstatus: seed\ncreated_at: "2025-04-01"\nupdated_at: "2025-04-01"\ntags: [ai]\n---\n\nAI description.\n',
        sha: "sha1",
      })
      .mockResolvedValueOnce({
        content: '---\nid: "2025-04-01-web"\ntitle: Web App\nstatus: seed\ncreated_at: "2025-04-01"\nupdated_at: "2025-04-01"\ntags: [web]\n---\n\nWeb description.\n',
        sha: "sha2",
      });

    const results = await searchIdeas(config, "AI");
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("AI Project");
  });

  it("returns empty for no matches", async () => {
    vi.spyOn(github, "listFiles").mockResolvedValue(["2025-04-01-ai"]);
    vi.spyOn(github, "getFile").mockResolvedValue({
      content: '---\nid: "2025-04-01-ai"\ntitle: AI Project\nstatus: seed\ncreated_at: "2025-04-01"\nupdated_at: "2025-04-01"\ntags: []\n---\n',
      sha: "sha1",
    });

    const results = await searchIdeas(config, "zzzzz");
    expect(results).toHaveLength(0);
  });
});
