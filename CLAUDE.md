# tane

GitHubリポジトリをデータストアにしたアイデア管理MCPサーバー。
Cloudflare Workers上で動作し、Remote MCP (Streamable HTTP) を提供する。

## Tech Stack

- Runtime: Cloudflare Workers
- Language: TypeScript
- Dependencies: @modelcontextprotocol/sdk, yaml, zod (これだけ)
- Auth: GitHub App OAuth
- Data: GitHub Repository (Markdown files)
- Dev: wrangler, bun

## Conventions

- パッケージ実行は `bunx` を使う（`npx` は使わない）
- Web Standard APIs only (Request/Response/fetch). Node.js固有のAPIは使わない
- 外部依存は最小限。必要なければライブラリを入れない
- GitHub REST APIへのアクセスはfetchで直接行う（Octokitは使わない）
- データは全てGitHubリポジトリ上のMarkdownファイル。外部DBは持たない

## Test Commands

- `bun test` — ユニットテスト
- `wrangler dev` — ローカル開発サーバー
- `wrangler deploy` — デプロイ

## Development Workflow: Compound Engineering

This project uses a compound engineering workflow:
Plan → Implement → **Verify** → Review → Learn → Archive

Knowledge compounds across changes via `openspec/learnings/LEARNINGS.md`.

### Skills

| Skill | Purpose |
|-------|---------|
| `/compound:ship <description>` | 全自動サイクル（検証付き） |
| `/compound:plan <description>` | planだけ生成（チーム合意用） |
| `/compound:review <git-range>` | 既存コードの後追いレビュー |

### Session Setup

Run at the start of each coding session:

- `uvx showboat --help`
- `uvx rodney --help` (if project has UI)

### Verification

```
openspec/changes/<change>/specs/     = 期待値（何が起きるべきか）
openspec/changes/<change>/demo.md    = 実測値（何が起きたか）
人間のレビュー                        = specs/ と demo.md を見比べる
```

### Enforcement

- **Stop hook**: checkpoint-gate.sh — 全タスク完了時にdemo.mdがなければブロック
- **demo.md**: showboatコマンド経由でのみ編集。直接編集禁止
- **showboat verify**: 全コマンドを再実行して出力一致を確認

### Rules

- ALWAYS read `openspec/learnings/LEARNINGS.md` before planning
- NEVER edit demo.md directly — use showboat commands
- NEVER add `<!-- no-checkpoint -->` yourself — only humans can opt out
- If `showboat verify` fails, fix and re-verify before review
- [MUST FIX] items: auto-fix (2 attempts max, then escalate to human)
