import { stringify, parse as yamlParse } from "yaml";
import { IdeaFrontmatterSchema, type Idea } from "./schema.js";

export function parseIdea(content: string): Idea {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error("Invalid Markdown: missing frontmatter delimiters");
  }

  const [, frontmatterRaw, bodyRaw] = match;
  const frontmatter = yamlParse(frontmatterRaw);
  const validated = IdeaFrontmatterSchema.parse(frontmatter);

  return {
    ...validated,
    body: bodyRaw.trim(),
  };
}

export function serializeIdea(idea: Idea): string {
  const { body, ...frontmatter } = idea;
  const fm = stringify(frontmatter, { lineWidth: 0 }).trimEnd();
  if (body) {
    return `---\n${fm}\n---\n\n${body}\n`;
  }
  return `---\n${fm}\n---\n`;
}

export function ideaToSummary(idea: Idea): string {
  const tags = idea.tags.length > 0 ? ` ${idea.tags.map((t) => `#${t}`).join(" ")}` : "";
  return `[${idea.status}] ${idea.title} (${idea.created_at})${tags}`;
}
