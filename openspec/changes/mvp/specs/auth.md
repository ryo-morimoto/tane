# Auth

## OAuth Web Flow

### handleAuthRedirect

- リクエスト → GitHub OAuth URL (`github.com/login/oauth/authorize`) へ302リダイレクト
- `client_id`, `scope` パラメータが含まれる
- scope: `repo`（プライベートリポジトリへのアクセスに必要）

### handleAuthCallback

- 有効なcode付きリクエスト → tokenを取得し、HTMLページで表示
- codeなし → エラーレスポンス
- 無効なcode → エラーレスポンス

### exchangeCode

- 有効なcode → access_tokenを返す
- GitHub APIへのPOSTが正しいパラメータを持つ

## extractToken

### Scenarios

- `Authorization: Bearer xxx` ヘッダー → `"xxx"`
- `Authorization: bearer xxx`（小文字） → `"xxx"`
- ヘッダーなし → `null`
- `Authorization: Basic xxx` → `null`
