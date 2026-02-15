import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { GitHubHandler } from "./github-handler.js";
import type { GrantProps } from "./mcp.js";

export { TaneMcpSession } from "./mcp-session.js";

interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_APP_SLUG: string;
  MCP_SESSION: DurableObjectNamespace;
  OAUTH_KV: KVNamespace;
}

const apiHandler = {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const props = (ctx as { props: GrantProps }).props;
    const workerEnv = env as Env;
    const sessionId = request.headers.get("mcp-session-id");

    const doId = sessionId
      ? workerEnv.MCP_SESSION.idFromName(sessionId)
      : workerEnv.MCP_SESSION.newUniqueId();
    const stub = workerEnv.MCP_SESSION.get(doId);

    // Pass grant props to DO via internal header
    const forwarded = new Request(request.url, request);
    forwarded.headers.set("x-grant-props", JSON.stringify(props));

    return stub.fetch(forwarded);
  },
};

export default new OAuthProvider({
  apiRoute: "/mcp",
  apiHandler: apiHandler as any,
  defaultHandler: GitHubHandler as any,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
  scopesSupported: ["mcp:tools"],
});
