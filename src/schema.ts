import { z } from "zod";

export const IDEA_STATUSES = [
  "seed",
  "growing",
  "refined",
  "archived",
  "dropped",
] as const;

export type IdeaStatus = (typeof IDEA_STATUSES)[number];

export interface Idea {
  id: string;
  title: string;
  status: IdeaStatus;
  created_at: string;
  updated_at: string;
  tags: string[];
  body: string;
}

export const IdeaFrontmatterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(IDEA_STATUSES),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
  tags: z.array(z.string()),
});

export function generateId(title: string, date?: string): string {
  const d = date ?? new Date().toISOString().slice(0, 10);
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  if (!slug) {
    return `${d}-untitled`;
  }

  return `${d}-${slug}`;
}
