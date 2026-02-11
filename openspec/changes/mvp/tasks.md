# Tasks

## プロジェクト初期化

- [x] `wrangler init` でCloudflare Workerプロジェクトを作成（TypeScript）
- [x] `package.json` を編集。dependencies: `@modelcontextprotocol/sdk`, `yaml`, `zod`。devDependencies: `wrangler`, `@cloudflare/workers-types`, `vitest`
- [x] `wrangler.toml` に設定。name, compatibility_date
- [x] `tsconfig.json` — Cloudflare Workers向け設定。`"types": ["@cloudflare/workers-types"]`, `"lib": ["ES2022"]`

## Schema層

- [ ] `src/schema.ts` を作成
  - `IDEA_STATUSES` const array (`seed`, `growing`, `refined`, `archived`, `dropped`)
  - `IdeaStatus` type
  - `Idea` interface (id, title, status, created_at, updated_at, tags, body)
  - `IdeaFrontmatterSchema` (zod schema、bodyを除く)
  - `generateId(title: string, date?: string): string` — `{YYYY-MM-DD}-{slug}` 形式。dateは省略時に現在日付
  - テスト: `src/schema.test.ts`

## Markdown層

- [ ] `src/markdown.ts` を作成
  - `parseIdea(content: string): Idea` — `---` で分割、YAMLパース、zodバリデーション
  - `serializeIdea(idea: Idea): string` — frontmatter + body を結合
  - `ideaToSummary(idea: Idea): string` — 一覧表示用の1行サマリー
  - テスト: `src/markdown.test.ts`（ラウンドトリップテスト含む）

## GitHub API — ユーティリティ

- [ ] `src/github.ts` にユーティリティ関数を作成
  - `gh(path, token, options?)` — fetchラッパー。Authorization header付与、エラーハンドリング
  - `base64Encode(str: string): string` — TextEncoderベースのUTF-8対応base64エンコード
  - `base64Decode(b64: string): string` — TextDecoderベースのUTF-8対応base64デコード
  - `getUser(token: string): Promise<{ login: string }>` — GET /user
  - テスト: `src/github.test.ts`（base64のラウンドトリップ、ghのヘッダー付与）

## GitHub API — IdeasRepository

- [ ] `src/github.ts` に `IdeasRepository` classを追加
  - constructor: `(token: string, owner: string, repo?: string)` — repo のデフォルトは `"ideas"`
  - `ensureRepo()` — リポジトリ存在確認、なければ作成
  - `create(idea: Idea)` — PUT contents API
  - `get(id: string): Promise<Idea>` — GET contents API + base64デコード + parseIdea
  - `update(idea: Idea)` — GET (SHA取得) → PUT
  - `list(statusFilter?: string): Promise<Idea[]>` — ディレクトリ一覧 → 各ファイル取得
  - `search(query: string): Promise<Idea[]>` — list全件取得 → title/body/tagsでフィルタ
  - テスト: `src/github-repository.test.ts`（fetchをモックしてCRUD検証）

## Core層

- [ ] `src/core.ts` を作成
  - `createIdea(repo, params): Promise<Idea>` — ID生成、日付設定、repo.create呼び出し
  - `listIdeas(repo, statusFilter?): Promise<Idea[]>`
  - `getIdea(repo, id): Promise<Idea>`
  - `updateIdea(repo, id, params): Promise<Idea>` — 既存取得、マージ、updated_at更新
  - `searchIdeas(repo, query): Promise<Idea[]>`
  - テスト: `src/core.test.ts`（IdeasRepositoryをモック）

## Auth handler

- [ ] `src/auth.ts` を作成
  - `AuthConfig` type: clientId, clientSecret, baseUrl
  - `handleAuthRedirect(config): Response` — GitHub OAuth URLにリダイレクト
  - `handleAuthCallback(config, url): Response` — code → token交換、HTML返却
  - `exchangeCode(config, code): Promise<string>` — POST github.com/login/oauth/access_token
  - `extractToken(req: Request): string | null` — Authorization headerからBearer token取得
  - テスト: `src/auth.test.ts`（extractTokenのパターン、リダイレクトURL検証）

## MCP handler

- [ ] `src/mcp.ts` を作成
  - `handleMcp(req: Request, env: Env): Promise<Response>`
  - リクエストごとに `McpServer` + `WebStandardStreamableHTTPServerTransport` を生成
  - Bearer tokenからGitHub userを取得し `IdeasRepository` を生成
  - 5つのMCPツール登録: create_idea, list_ideas, get_idea, update_idea, search_ideas
  - 各ツールはCore層の関数を呼ぶ
  - ツールのパラメータはzodで定義
- [ ] `nodejs_compat` フラグの要否を検証（MCP SDKがNode.js APIを使うか確認）

## Entry point

- [ ] `src/index.ts` を更新
  - URLルーティング:
    - `POST|GET|DELETE /mcp` → handleMcp
    - `GET /auth/github` → handleAuthRedirect
    - `GET /auth/callback` → handleAuthCallback
    - `GET /health` → `{ status: "ok" }`
    - その他 → 404
  - テスト: `src/index.test.ts`（ルーティングのみ）

## デプロイ・動作確認

- [ ] `wrangler secret put GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- [ ] `wrangler deploy`
- [ ] ブラウザで `/auth/github` にアクセスして認証フローを確認
- [ ] 取得したtokenでMCPクライアント（Claude Desktop等）から接続
- [ ] 各ツールの動作確認: create → list → get → update → search
- [ ] GitHubリポジトリに `ideas/` ディレクトリとMarkdownファイルが作成されていることを確認
