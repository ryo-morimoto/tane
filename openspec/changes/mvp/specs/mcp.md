# MCP

## Transport

- `POST /mcp` → `WebStandardStreamableHTTPServerTransport` 経由で処理
- `GET /mcp` → SSE接続（MVPでは制限あり）
- `DELETE /mcp` → セッション終了
- リクエストごとにMcpServer + transportを新規生成（ステートレス）

## ツール登録

5つのMCPツールが利用可能:

| ツール名 | 操作 |
|----------|------|
| create_idea | 新規アイデア作成 |
| list_ideas | アイデア一覧（statusフィルタ可） |
| get_idea | 単一アイデア取得 |
| update_idea | アイデア更新 |
| search_ideas | キーワード検索 |

### Scenarios

- `create_idea({ title: "Test" })` → Ideaが作成され、IDと内容を返す
- `list_ideas({})` → 全アイデアのサマリーリスト
- `list_ideas({ status: "seed" })` → seed状態のもののみ
- `get_idea({ id: "2025-04-01-test" })` → 該当Ideaの全内容
- `update_idea({ id: "...", status: "growing" })` → ステータス更新
- `search_ideas({ query: "AI" })` → マッチ結果

## 認証

- Bearer tokenなしのリクエスト → 401エラー
- 無効なtoken → 401エラー
- 有効なtoken → GitHubユーザーを特定し、そのユーザーのリポジトリにアクセス
