export class GitHubApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export async function gh(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<unknown> {
  const url = `https://api.github.com${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "tane/0.1.0",
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });

  if (!res.ok) {
    throw new GitHubApiError(res.status, `GitHub API error: ${res.status}`);
  }

  return res.json();
}

export function base64Encode(str: string): string {
  if (!str) return "";
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function base64Decode(b64: string): string {
  if (!b64) return "";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export async function getUser(
  token: string,
): Promise<{ login: string }> {
  const data = (await gh("/user", token)) as { login: string };
  return { login: data.login };
}

export interface RepoConfig {
  token: string;
  owner: string;
  repo: string;
}

export function createRepoConfig(
  token: string,
  owner: string,
  repo = "ideas",
): RepoConfig {
  return { token, owner, repo };
}

export async function ensureRepo(config: RepoConfig): Promise<void> {
  try {
    await gh(`/repos/${config.owner}/${config.repo}`, config.token);
  } catch (e) {
    if (e instanceof GitHubApiError && e.status === 404) {
      throw new Error(
        `Repository not found. Create it at https://github.com/new?name=${config.repo}&private=true&description=Idea+management+repository+powered+by+tane then retry.`,
      );
    }
    throw e;
  }
}

const ideasPath = (config: RepoConfig, id: string) =>
  `/repos/${config.owner}/${config.repo}/contents/ideas/${id}.md`;

export async function createFile(
  config: RepoConfig,
  id: string,
  content: string,
): Promise<void> {
  await gh(ideasPath(config, id), config.token, {
    method: "PUT",
    body: JSON.stringify({
      message: `Create idea: ${id}`,
      content: base64Encode(content),
    }),
  });
}

export async function getFile(
  config: RepoConfig,
  id: string,
): Promise<{ content: string; sha: string }> {
  const data = (await gh(ideasPath(config, id), config.token)) as {
    content: string;
    sha: string;
  };
  return {
    content: base64Decode(data.content.replace(/\n/g, "")),
    sha: data.sha,
  };
}

export async function updateFile(
  config: RepoConfig,
  id: string,
  content: string,
  sha: string,
): Promise<void> {
  await gh(ideasPath(config, id), config.token, {
    method: "PUT",
    body: JSON.stringify({
      message: `Update idea: ${id}`,
      content: base64Encode(content),
      sha,
    }),
  });
}

export async function listFiles(
  config: RepoConfig,
): Promise<string[]> {
  try {
    const data = (await gh(
      `/repos/${config.owner}/${config.repo}/contents/ideas`,
      config.token,
    )) as Array<{ name: string }>;
    return data
      .filter((f) => f.name.endsWith(".md"))
      .map((f) => f.name.replace(/\.md$/, ""));
  } catch (e) {
    if (e instanceof GitHubApiError && e.status === 404) {
      return [];
    }
    throw e;
  }
}
