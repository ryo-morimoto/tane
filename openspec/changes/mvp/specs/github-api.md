# GitHub API

## gh (fetchラッパー)

### Scenarios

- 正常レスポンス → JSONパース結果を返す
- 404レスポンス → 適切なエラー
- 401レスポンス → 認証エラー
- Authorization headerが正しく付与される

## IdeasRepository

### ensureRepo

- リポジトリが存在する → 何もしない
- リポジトリが存在しない → 新規作成（private、description付き）

### create

- 新規Idea → `PUT /repos/{owner}/{repo}/contents/ideas/{id}.md` でファイル作成
- base64エンコードされたcontent が正しい
- commit messageが設定される

### get

- 存在するID → Ideaオブジェクトを返す（base64デコード → parseIdea）
- 存在しないID → エラー

### update

- 既存のIdea → 現在のSHAを取得してPUT（optimistic locking）
- SHA不一致（並行更新） → 409エラー

### list

- ディレクトリにファイルがある → Idea[]を返す
- statusFilter指定 → フィルタリング済みの結果
- ディレクトリが空/存在しない → 空配列

### search

- queryに一致するアイデア → マッチしたIdea[]
- 一致なし → 空配列
- 検索対象: title + body + tags

## base64 encode/decode

### Scenarios

- ASCII文字列 → 正しくencode/decode
- 日本語（UTF-8マルチバイト） → 正しくencode/decode
- 空文字列 → 空文字列

## getUser

- 有効なtoken → `{ login: "username" }`
- 無効なtoken → エラー
