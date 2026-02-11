import { describe, it, expect } from "vitest";
import { parseIdea, serializeIdea, ideaToSummary } from "./markdown.js";
import type { Idea } from "./schema.js";

const validMarkdown = `---
id: "2025-04-01-my-idea"
title: My Idea
status: seed
created_at: "2025-04-01"
updated_at: "2025-04-01"
tags: [ai, tools]
---

The idea body goes here.
`;

const validIdea: Idea = {
  id: "2025-04-01-my-idea",
  title: "My Idea",
  status: "seed",
  created_at: "2025-04-01",
  updated_at: "2025-04-01",
  tags: ["ai", "tools"],
  body: "The idea body goes here.",
};

describe("parseIdea", () => {
  it("parses valid markdown with all fields", () => {
    const idea = parseIdea(validMarkdown);
    expect(idea).toEqual(validIdea);
  });

  it("parses frontmatter-only (no body) as empty string body", () => {
    const md = `---
id: "2025-04-01-empty"
title: Empty
status: seed
created_at: "2025-04-01"
updated_at: "2025-04-01"
tags: []
---
`;
    const idea = parseIdea(md);
    expect(idea.body).toBe("");
    expect(idea.id).toBe("2025-04-01-empty");
  });

  it("throws on invalid delimiters", () => {
    expect(() => parseIdea("no frontmatter here")).toThrow();
  });

  it("throws on invalid YAML", () => {
    const bad = `---
title: [invalid: yaml: {{
---
`;
    expect(() => parseIdea(bad)).toThrow();
  });

  it("throws on zod validation failure", () => {
    const bad = `---
id: "test"
title: Test
status: invalid_status
created_at: "2025-04-01"
updated_at: "2025-04-01"
tags: []
---
`;
    expect(() => parseIdea(bad)).toThrow();
  });
});

describe("serializeIdea", () => {
  it("serializes idea with all fields", () => {
    const result = serializeIdea(validIdea);
    expect(result).toContain("---");
    expect(result).toContain("title: My Idea");
    expect(result).toContain("The idea body goes here.");
  });

  it("serializes idea with empty body", () => {
    const idea: Idea = { ...validIdea, body: "" };
    const result = serializeIdea(idea);
    expect(result).toContain("---");
    expect(result).not.toContain("The idea body goes here.");
  });

  it("round-trips correctly", () => {
    const serialized = serializeIdea(validIdea);
    const parsed = parseIdea(serialized);
    expect(parsed).toEqual(validIdea);
  });
});

describe("ideaToSummary", () => {
  it("formats summary without tags", () => {
    const idea: Idea = { ...validIdea, tags: [] };
    expect(ideaToSummary(idea)).toBe("[seed] My Idea (2025-04-01)");
  });

  it("formats summary with tags", () => {
    expect(ideaToSummary(validIdea)).toBe(
      "[seed] My Idea (2025-04-01) #ai #tools",
    );
  });
});
