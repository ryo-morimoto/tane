# Proposal: tane

## 動機

開発者にはアイデアが断続的に湧く。技術設計はまだだが課題と方向性は見えているもの、シンプルに作ってみたいもの。これらは書き留めなければ消え、書き留めてもコンテキストが失われる。

既存ツール（GitHub Issues, Linear, BrainGrid, Notion等）は「作ることが決まったもの」のタスク管理やspec構造化に特化しており、アイデアの初期段階を軽くストックして後から育てるワークフローには合わない。

## 解決

GitHubリポジトリをデータストアにしたアイデア管理フレームワークを作る。

- `ideas` リポジトリにMarkdownファイルとしてアイデアを保管
- データフォーマット（Markdownスキーマ）とワークフロー（ライフサイクル）を定義
- MCPサーバーとして任意のLLMクライアントから操作可能
- Web APIも提供し、将来Web UIやCLIからもアクセス可能
- Cloudflare Workersでホスティング

## スコープ

### MVP（このプロジェクト）

- Markdownスキーマ定義（frontmatter + body）
- GitHub API操作層（fetch直接）
- GitHub App OAuth認証
- MCPサーバー（5ツール: create, list, get, update, search）
- Cloudflare Workerとしてデプロイ

### 将来（別change）

- Web API endpoints（REST JSON）
- Web UI
- promote機能（アイデアから新規GitHubリポジトリを作成）
- refine機能（AI対話でコンセプトを深堀り）
- CLI

## 差別化

- **GitHubがデータストア**: SaaSにデータを預けない。gitの履歴でアイデアの発展過程が残る
- **MCPでLLMロックインなし**: Claude, Cursor, Gemini等どこからでもアクセス可能
- **アイデアの初期フェーズに特化**: seed（1行メモ）からrefined（spec化）まで
- **依存最小限**: MCP SDK, yaml, zodの3つだけ
