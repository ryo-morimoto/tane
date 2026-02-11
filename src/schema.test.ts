import { describe, it, expect } from "vitest";
import {
  IDEA_STATUSES,
  type IdeaStatus,
  type Idea,
  IdeaFrontmatterSchema,
  generateId,
} from "./schema.js";

describe("IDEA_STATUSES", () => {
  it("contains all five statuses", () => {
    expect(IDEA_STATUSES).toEqual([
      "seed",
      "growing",
      "refined",
      "archived",
      "dropped",
    ]);
  });
});

describe("IdeaFrontmatterSchema", () => {
  it("parses valid frontmatter", () => {
    const result = IdeaFrontmatterSchema.safeParse({
      id: "2025-04-01-my-idea",
      title: "My Idea",
      status: "seed",
      created_at: "2025-04-01",
      updated_at: "2025-04-01",
      tags: ["ai", "tools"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = IdeaFrontmatterSchema.safeParse({
      id: "2025-04-01-my-idea",
      title: "My Idea",
      status: "invalid",
      created_at: "2025-04-01",
      updated_at: "2025-04-01",
      tags: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-string-array tags", () => {
    const result = IdeaFrontmatterSchema.safeParse({
      id: "2025-04-01-my-idea",
      title: "My Idea",
      status: "seed",
      created_at: "2025-04-01",
      updated_at: "2025-04-01",
      tags: [1, 2],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty created_at", () => {
    const result = IdeaFrontmatterSchema.safeParse({
      id: "2025-04-01-my-idea",
      title: "My Idea",
      status: "seed",
      created_at: "",
      updated_at: "2025-04-01",
      tags: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("generateId", () => {
  it("generates date-slug format", () => {
    expect(generateId("My First Idea", "2025-04-01")).toBe(
      "2025-04-01-my-first-idea",
    );
  });

  it("removes non-ASCII characters", () => {
    const id = generateId("日本語タイトル", "2025-04-01");
    expect(id).toMatch(/^2025-04-01-/);
    expect(id.length).toBeGreaterThan("2025-04-01-".length);
  });

  it("removes symbols", () => {
    expect(generateId("Hello World!!!", "2025-04-01")).toBe(
      "2025-04-01-hello-world",
    );
  });

  it("handles empty title", () => {
    const id = generateId("", "2025-04-01");
    expect(id).toMatch(/^2025-04-01-/);
    expect(id.length).toBeGreaterThan("2025-04-01-".length);
  });

  it("defaults date to current date", () => {
    const id = generateId("Test");
    const today = new Date().toISOString().slice(0, 10);
    expect(id).toMatch(new RegExp(`^${today}-`));
  });
});
