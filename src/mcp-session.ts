import { Hono } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPTransport } from "@hono/mcp";
import { registerTools, type GrantProps } from "./mcp.js";

interface Env {
  GITHUB_APP_SLUG: string;
}

export class TaneMcpSession implements DurableObject {
  private app: Hono;
  private transport: StreamableHTTPTransport;
  private server: McpServer;
  private initialized = false;

  constructor(
    _state: DurableObjectState,
    private env: Env,
  ) {
    this.server = new McpServer({
      name: "tane",
      version: "0.1.0",
    });
    this.transport = new StreamableHTTPTransport();
    this.app = new Hono();
    this.app.all("/mcp", (c) => this.transport.handleRequest(c));
  }

  async fetch(request: Request): Promise<Response> {
    if (!this.initialized) {
      const propsHeader = request.headers.get("x-grant-props");
      if (propsHeader) {
        const props = JSON.parse(propsHeader) as GrantProps;
        const origin = new URL(request.url).origin;
        registerTools(this.server, props, this.env, origin);
        await this.server.connect(this.transport);
        this.initialized = true;
      }
    }

    return this.app.fetch(request);
  }
}
