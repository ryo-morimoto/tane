import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { IDEA_STATUSES } from "./schema.js";
import { ideaToSummary, serializeIdea } from "./markdown.js";
import { createRepoConfig, getUser } from "./github.js";
import { createIdea, listIdeas, getIdea, updateIdea, searchIdeas } from "./core.js";
import { extractToken } from "./auth.js";

interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

function authError(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export async function handleMcp(req: Request, _env: Env): Promise<Response> {
  const token = extractToken(req);
  if (!token) {
    return authError("Missing or invalid Authorization header");
  }

  let user: { login: string };
  try {
    user = await getUser(token);
  } catch {
    return authError("Invalid or expired token");
  }

  const config = createRepoConfig(token, user.login);

  const server = new McpServer({
    name: "tane",
    version: "0.1.0",
  });

  server.registerTool(
    "create_idea",
    {
      description: "Create a new idea",
      inputSchema: {
        title: z.string().describe("Title of the idea"),
        tags: z.array(z.string()).optional().describe("Tags for the idea"),
        body: z.string().optional().describe("Body/description of the idea"),
      },
    },
    async ({ title, tags, body }) => {
      const idea = await createIdea(config, { title, tags, body });
      return {
        content: [
          {
            type: "text" as const,
            text: `Created idea: ${idea.id}\n\n${serializeIdea(idea)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "list_ideas",
    {
      description: "List ideas with optional status filter",
      inputSchema: {
        status: z.enum(IDEA_STATUSES).optional().describe("Filter by status"),
      },
    },
    async ({ status }) => {
      const ideas = await listIdeas(config, status);
      if (ideas.length === 0) {
        return { content: [{ type: "text" as const, text: "No ideas found." }] };
      }
      const summary = ideas.map(ideaToSummary).join("\n");
      return { content: [{ type: "text" as const, text: summary }] };
    },
  );

  server.registerTool(
    "get_idea",
    {
      description: "Get a single idea by ID",
      inputSchema: {
        id: z.string().describe("Idea ID (e.g., 2025-04-01-my-idea)"),
      },
    },
    async ({ id }) => {
      const idea = await getIdea(config, id);
      return {
        content: [{ type: "text" as const, text: serializeIdea(idea) }],
      };
    },
  );

  server.registerTool(
    "update_idea",
    {
      description: "Update an existing idea",
      inputSchema: {
        id: z.string().describe("Idea ID to update"),
        title: z.string().optional().describe("New title"),
        status: z.enum(IDEA_STATUSES).optional().describe("New status"),
        tags: z.array(z.string()).optional().describe("New tags"),
        body: z.string().optional().describe("New body"),
      },
    },
    async ({ id, ...params }) => {
      const idea = await updateIdea(config, id, params);
      return {
        content: [
          {
            type: "text" as const,
            text: `Updated idea: ${idea.id}\n\n${serializeIdea(idea)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "search_ideas",
    {
      description: "Search ideas by keyword",
      inputSchema: {
        query: z.string().describe("Search query (matches title, body, tags)"),
      },
    },
    async ({ query }) => {
      const ideas = await searchIdeas(config, query);
      if (ideas.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No matching ideas found." }],
        };
      }
      const summary = ideas.map(ideaToSummary).join("\n");
      return { content: [{ type: "text" as const, text: summary }] };
    },
  );

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  return transport.handleRequest(req);
}
