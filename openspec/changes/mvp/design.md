# Design

## アーキテクチャ概要

```
┌──────────────────────────────────────────┐
│              Clients                      │
│  MCP (Claude Desktop / Cursor / etc.)    │
│  Web UI (future)                          │
│  CLI (future)                             │
└──────────┬──────────────┬────────────────┘
           │ /mcp         │ /api/*
           │ Streamable   │ REST
           │ HTTP         │ JSON
           ▼              ▼
┌──────────────────────────────────────────┐
│        Cloudflare Worker                  │
│                                           │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ │
│  │  Auth    │ │   MCP    │ │  Web API  │ │
│  │ handler  │ │ handler  │ │  handler  │ │
│  └────┬────┘ └─────┬────┘ └─────┬─────┘ │
│       │            │            │         │
│       │      ┌─────▼────────────▼───┐    │
│       │      │     Core (tools)     │    │
│       │      └──────────┬───────────┘    │
│       │                 │                 │
│       │      ┌──────────▼───────────┐    │
│       │      │   GitHub API layer   │    │
│       │      │   (fetch + parse)    │    │
│       │      └──────────┬───────────┘    │
│       │                 │                 │
└───────┼─────────────────┼────────────────┘
        │                 │
        ▼                 ▼
   GitHub OAuth      GitHub REST API
                          │
                          ▼
                   {owner}/ideas repo
                     └── ideas/
                         ├── {id}.md
                         └── ...
```

## 技術選定

### Runtime: Cloudflare Workers

- Web Standard APIs (Request/Response/fetch) ベースで動作
- MCP SDKの `WebStandardStreamableHTTPServerTransport` がそのまま使える
- グローバルエッジデプロイ。self-hostingの手間が最小限
- 無料枠が十分（100,000 req/day）

### データストア: GitHub Repository

- Markdownファイルがsource of truth
- gitの履歴でアイデアの発展過程が自動的に残る
- 外部DBを持たないためインフラコストゼロ
- GitHub APIで全操作可能

### 認証: GitHub App OAuth

- GitHub App を作成し、OAuth Device Flow または Web flowで認証
- access_tokenはサーバーに保存せず、クライアントがBearer headerで毎回送信
- サーバーはステートレス

### 言語: TypeScript

- MCP SDKがTypeScript/JavaScript
- Cloudflare Workersがネイティブサポート

### 依存ライブラリ

| ライブラリ | 理由 | 代替検討 |
|---|---|---|
| `@modelcontextprotocol/sdk` | MCP transport + tool定義 | なし（MCP準拠に必須） |
| `yaml` | frontmatterのparse/serialize | 自前パーサーは割に合わない |
| `zod` | MCP SDKが依存。ツール定義のスキーマに使用 | 追加コストなし |

これ以外のライブラリは入れない。GitHub APIアクセスは `fetch` で直接行う。

## レイヤー構成

### 1. Schema層 (`src/schema.ts`)

- Idea型定義
- IdeaStatus enum
- ID生成関数
- zodスキーマ

### 2. Markdown層 (`src/markdown.ts`)

- `parseIdea(content: string): Idea` — frontmatter + bodyをパース
- `serializeIdea(idea: Idea): string` — IdeaオブジェクトをMarkdown文字列に変換

### 3. GitHub API層 (`src/github.ts`)

- `IdeasRepository` class — CRUD操作をカプセル化
- コンストラクタで `token`, `owner`, `repo` を受け取る
- fetchで直接GitHub APIを呼ぶ

### 4. Core層 (`src/core.ts`)

- MCPツールとWeb APIの両方から呼ばれるビジネスロジック
- `IdeasRepository` を使ってCRUD + 検索を実行
- MCP固有のレスポンス形式やHTTPレスポンスの組み立ては呼び出し側の責務

### 5. MCP handler (`src/mcp.ts`)

- `McpServer` + `WebStandardStreamableHTTPServerTransport` のセットアップ
- ツール登録
- セッション管理

### 6. Web API handler (`src/api.ts`) — future

- REST endpoints
- Core層を呼んでJSONレスポンスを返す

### 7. Auth handler (`src/auth.ts`)

- OAuth開始 (`/auth/github`)
- Callback処理 (`/auth/callback`)

### 8. Entry point (`src/index.ts`)

- Cloudflare Workerの `fetch` handler
- URLパスでルーティング: `/mcp`, `/api/*`, `/auth/*`, `/health`

## セッション管理

Cloudflare Workers はリクエスト間で状態を保持しない。MCPセッションの管理方法:

**選択肢A: ステートレス（MVP）**
- セッションIDを使わず、毎回新しいtransportを作成
- initializeリクエストごとにMcpServer + transportを生成
- 単一リクエスト内で完結するため、Worker上で動作する
- 制約: SSE streamingの長時間接続は不可

**選択肢B: Durable Objects（将来）**
- MCPセッションをDurable Objectとして永続化
- 長時間のSSE接続やセッション間の状態共有が可能
- Cloudflare有料プランが必要

MVPでは選択肢Aで進める。

## Cloudflare Workers固有の考慮事項

- `wrangler.toml` でプロジェクト設定
- 環境変数（secrets）: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `export default { fetch }` でエントリポイントを定義
- MCP SDKの `WebStandardStreamableHTTPServerTransport` はWeb Standard APIベースなのでWorker上で直接動作する
