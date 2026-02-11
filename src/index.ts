import { handleMcp } from "./mcp.js";
import { handleAuthRedirect, handleAuthCallback } from "./auth.js";

interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_APP_SLUG: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/health" && req.method === "GET") {
      return Response.json({ status: "ok" });
    }

    if (url.pathname === "/mcp") {
      return handleMcp(req, env);
    }

    if (url.pathname === "/auth/github" && req.method === "GET") {
      const authConfig = {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        appSlug: env.GITHUB_APP_SLUG,
      };
      return handleAuthRedirect(authConfig, req);
    }

    if (url.pathname === "/auth/callback" && req.method === "GET") {
      const authConfig = {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        appSlug: env.GITHUB_APP_SLUG,
      };
      return handleAuthCallback(authConfig, req);
    }

    return new Response("Not Found", { status: 404 });
  },
};
