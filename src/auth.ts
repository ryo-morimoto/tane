export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  appSlug: string;
}

export function generateState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function extractToken(req: Request): string | null {
  const header = req.headers.get("Authorization");
  if (!header) return null;

  const match = header.match(/^bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1].trim();
  return token || null;
}

function securityHeaders(): Record<string, string> {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.get("Cookie");
  if (!header) return {};
  const cookies: Record<string, string> = {};
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key) cookies[key] = rest.join("=");
  }
  return cookies;
}

export function handleAuthRedirect(
  config: AuthConfig,
  _req: Request,
): Response {
  const state = generateState();

  const url = `https://github.com/apps/${config.appSlug}/installations/new?state=${state}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      "Set-Cookie": `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/auth/callback`,
      ...securityHeaders(),
    },
  });
}

function clearCookieHeader(): string {
  return "oauth_state=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/auth/callback";
}

function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearCookieHeader(),
      ...securityHeaders(),
    },
  });
}

export async function exchangeCode(
  config: AuthConfig,
  code: string,
  redirectUri: string,
): Promise<string> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    error?: string;
  };
  if (data.error || !data.access_token) {
    throw new Error("Failed to exchange authorization code");
  }

  return data.access_token;
}

export async function handleAuthCallback(
  config: AuthConfig,
  req: Request,
): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return errorResponse(400, "Missing required parameters");
  }

  const cookies = parseCookies(req);
  const cookieState = cookies["oauth_state"];

  if (!cookieState) {
    return errorResponse(403, "Missing state cookie");
  }

  if (state !== cookieState) {
    return errorResponse(403, "State mismatch");
  }

  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/auth/callback`;

  let token: string;
  try {
    token = await exchangeCode(config, code, redirectUri);
  } catch {
    return errorResponse(400, "Failed to exchange authorization code");
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="referrer" content="no-referrer">
  <title>tane - Authorization Complete</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; }
    .token { background: #f4f4f4; padding: 12px; border-radius: 4px; word-break: break-all; font-family: monospace; }
  </style>
</head>
<body>
  <h1>Authorization Complete</h1>
  <p>Your access token:</p>
  <div class="token">${token}</div>
  <p>Store this token securely and close this tab. Use it as a Bearer token in your MCP client configuration.</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "Set-Cookie": clearCookieHeader(),
      ...securityHeaders(),
    },
  });
}
