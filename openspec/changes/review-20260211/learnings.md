# Learnings: Initial Scaffold Review

## wrangler dev のテスト再現性

`showboat exec` で `wrangler dev` をバックグラウンド起動してcurlで検証するパターンは、サーバー起動タイミングに依存し `showboat verify` で再現できない。ローカルサーバーを使う検証は決定的なコマンド（型チェック、依存確認等）と分離し、showboat execには決定的コマンドのみ記録すべき。

## nodejs_compat フラグの要否

MCP SDKがCloudflare Worker上で動作するために `nodejs_compat` が必要かは、MCP handler実装時に検証が必要。不要であれば「Web Standard APIs only」の規約に合わせて削除。

## スキャフォールド段階のレビュー価値

コードが少ない段階でも、設計ドキュメントとの整合性チェックは有用。依存ライブラリの過不足、TypeScript設定、wrangler設定のミスマッチを早期に発見できる。
