interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    switch (url.pathname) {
      case "/health":
        return Response.json({ status: "ok" });
      default:
        return new Response("Not Found", { status: 404 });
    }
  },
};
