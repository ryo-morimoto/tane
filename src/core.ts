import { generateId, type Idea, type IdeaStatus } from "./schema.js";
import { parseIdea, serializeIdea } from "./markdown.js";
import {
  type RepoConfig,
  ensureRepo,
  createFile,
  getFile,
  updateFile,
  listFiles,
} from "./github.js";

interface CreateIdeaParams {
  title: string;
  tags?: string[];
  body?: string;
}

interface UpdateIdeaParams {
  title?: string;
  status?: IdeaStatus;
  tags?: string[];
  body?: string;
}

export async function createIdea(
  config: RepoConfig,
  params: CreateIdeaParams,
): Promise<Idea> {
  await ensureRepo(config);

  const now = new Date().toISOString().slice(0, 10);
  const idea: Idea = {
    id: generateId(params.title, now),
    title: params.title,
    status: "seed",
    created_at: now,
    updated_at: now,
    tags: params.tags ?? [],
    body: params.body ?? "",
  };

  await createFile(config, idea.id, serializeIdea(idea));
  return idea;
}

export async function listIdeas(
  config: RepoConfig,
  statusFilter?: string,
): Promise<Idea[]> {
  const ids = await listFiles(config);
  const ideas: Idea[] = [];

  for (const id of ids) {
    const file = await getFile(config, id);
    const idea = parseIdea(file.content);
    if (!statusFilter || idea.status === statusFilter) {
      ideas.push(idea);
    }
  }

  return ideas;
}

export async function getIdea(
  config: RepoConfig,
  id: string,
): Promise<Idea> {
  const file = await getFile(config, id);
  return parseIdea(file.content);
}

export async function updateIdea(
  config: RepoConfig,
  id: string,
  params: UpdateIdeaParams,
): Promise<Idea> {
  const file = await getFile(config, id);
  const existing = parseIdea(file.content);

  const updated: Idea = {
    ...existing,
    ...(params.title !== undefined && { title: params.title }),
    ...(params.status !== undefined && { status: params.status }),
    ...(params.tags !== undefined && { tags: params.tags }),
    ...(params.body !== undefined && { body: params.body }),
    updated_at: new Date().toISOString().slice(0, 10),
  };

  await updateFile(config, id, serializeIdea(updated), file.sha);
  return updated;
}

export async function searchIdeas(
  config: RepoConfig,
  query: string,
): Promise<Idea[]> {
  const ids = await listFiles(config);
  const results: Idea[] = [];
  const q = query.toLowerCase();

  for (const id of ids) {
    const file = await getFile(config, id);
    const idea = parseIdea(file.content);
    if (
      idea.title.toLowerCase().includes(q) ||
      idea.body.toLowerCase().includes(q) ||
      idea.tags.some((t) => t.toLowerCase().includes(q))
    ) {
      results.push(idea);
    }
  }

  return results;
}
