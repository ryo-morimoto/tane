# Learnings

プロジェクトを通じて蓄積される知見。各changeのレビューから抽出される。

<!-- New learnings are appended below by /compound:ship -->

## review-20260211: Initial Scaffold

- `showboat exec` にはサーバー起動を伴う非決定的コマンドを入れない。決定的コマンドのみ記録する
- `nodejs_compat` フラグの要否はMCP SDK実装時に検証する
- スキャフォールド段階でも設計ドキュメントとの整合性レビューは有用
