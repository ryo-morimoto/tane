# Markdown

## フォーマット

```markdown
---
title: My Idea
status: seed
created_at: "2025-04-01"
updated_at: "2025-04-01"
tags: [ai, tools]
---

アイデアの本文がここに入る。
```

## parseIdea

Markdown文字列 → Ideaオブジェクト

### Scenarios

- 正常なMarkdown → 全フィールドが正しくパースされる
- frontmatterのみ（bodyなし） → `body` は空文字
- `---` 区切りが不正 → エラー
- frontmatterのYAMLが不正 → エラー
- zodバリデーション失敗（status不正等） → エラー

## serializeIdea

Ideaオブジェクト → Markdown文字列

### Scenarios

- 全フィールド設定済みのIdea → frontmatter + `---` + body の形式
- body空のIdea → frontmatter + `---` のみ（末尾の改行処理）
- `parseIdea(serializeIdea(idea))` === `idea` （ラウンドトリップ）

## ideaToSummary

一覧表示用の1行サマリー

### Scenarios

- `ideaToSummary(idea)` → `"[seed] My Idea (2025-04-01)"` のような形式
- タグ付きの場合 → タグも含む
