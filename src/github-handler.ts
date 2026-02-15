import { Hono } from "hono";
import type { OAuthHelpers } from "@cloudflare/workers-oauth-provider";

interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_APP_SLUG: string;
  OAUTH_PROVIDER: OAuthHelpers;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/authorize", async (c) => {
  const oauthReq = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw);

  const client = await c.env.OAUTH_PROVIDER.lookupClient(oauthReq.clientId);
  if (!client) {
    return c.text("Invalid client", 400);
  }

  // Auto-approve: skip consent dialog, redirect straight to GitHub
  const state = crypto.randomUUID();

  // Store OAuth request in KV via cookie so /callback can retrieve it
  const stateData = JSON.stringify({
    oauthReq: {
      responseType: oauthReq.responseType,
      clientId: oauthReq.clientId,
      redirectUri: oauthReq.redirectUri,
      scope: oauthReq.scope,
      state: oauthReq.state,
      codeChallenge: oauthReq.codeChallenge,
      codeChallengeMethod: oauthReq.codeChallengeMethod,
      resource: oauthReq.resource,
    },
  });
  const encodedState = btoa(stateData);

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", c.env.GITHUB_CLIENT_ID);
  githubAuthUrl.searchParams.set("redirect_uri", `${new URL(c.req.url).origin}/callback`);
  githubAuthUrl.searchParams.set("state", state);
  githubAuthUrl.searchParams.set("scope", "repo");

  c.header(
    "Set-Cookie",
    `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/callback`,
  );
  c.header(
    "Set-Cookie",
    `oauth_data=${encodedState}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/callback`,
  );
  c.header("Cache-Control", "no-store");

  return c.redirect(githubAuthUrl.toString(), 302);
});

app.get("/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code || !state) {
    return c.text("Missing required parameters", 400);
  }

  // Validate state from cookie
  const cookieHeader = c.req.header("Cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((s) => {
      const [k, ...v] = s.trim().split("=");
      return [k, v.join("=")];
    }),
  );

  if (cookies["oauth_state"] !== state) {
    return c.text("State mismatch", 403);
  }

  const oauthData = cookies["oauth_data"];
  if (!oauthData) {
    return c.text("Missing OAuth data", 400);
  }

  const { oauthReq } = JSON.parse(atob(oauthData));

  // Exchange GitHub code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: c.env.GITHUB_CLIENT_ID,
      client_secret: c.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${new URL(c.req.url).origin}/callback`,
    }),
  });

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
  };

  if (tokenData.error || !tokenData.access_token) {
    // Redirect to client with error
    const errorUrl = new URL(oauthReq.redirectUri);
    errorUrl.searchParams.set("error", "server_error");
    if (oauthReq.state) errorUrl.searchParams.set("state", oauthReq.state);
    return c.redirect(errorUrl.toString(), 302);
  }

  // Fetch GitHub user identity
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "tane/0.1.0",
    },
  });

  if (!userRes.ok) {
    const errorUrl = new URL(oauthReq.redirectUri);
    errorUrl.searchParams.set("error", "server_error");
    if (oauthReq.state) errorUrl.searchParams.set("state", oauthReq.state);
    return c.redirect(errorUrl.toString(), 302);
  }

  const userData = (await userRes.json()) as { login: string };

  // Complete the OAuth authorization — provider issues tane's own code
  const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
    request: oauthReq,
    userId: userData.login,
    metadata: { login: userData.login },
    scope: oauthReq.scope,
    props: {
      login: userData.login,
      accessToken: tokenData.access_token,
    },
  });

  // Clear cookies
  c.header(
    "Set-Cookie",
    "oauth_state=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/callback",
  );

  return c.redirect(redirectTo, 302);
});

export const GitHubHandler = app;
