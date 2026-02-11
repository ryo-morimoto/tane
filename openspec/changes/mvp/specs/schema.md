# Schema

## Idea型

Ideaは以下のフィールドを持つ:

| フィールド | 型 | 必須 |
|-----------|------|------|
| id | string | yes |
| title | string | yes |
| status | IdeaStatus | yes |
| created_at | string (ISO 8601) | yes |
| updated_at | string (ISO 8601) | yes |
| tags | string[] | yes (空配列可) |
| body | string | yes (空文字可) |

## ステータスライフサイクル

`seed` → `growing` → `refined` → `archived` / `dropped`

- 初期値は `seed`
- どのステータスからでも `dropped` に遷移可能
- `archived` からの戻りは不可

## ID生成

`generateId(title, date)` → `{YYYY-MM-DD}-{slug}`

### Scenarios

- `generateId("My First Idea", "2025-04-01")` → `"2025-04-01-my-first-idea"`
- `generateId("日本語タイトル", "2025-04-01")` → ASCII以外の文字は除去し、空ならfallback ID
- `generateId("Hello World!!!", "2025-04-01")` → 記号除去 → `"2025-04-01-hello-world"`
- `generateId("", "2025-04-01")` → 空タイトルにはfallback

## zodスキーマバリデーション

### Scenarios

- 有効なfrontmatterオブジェクト → parse成功
- `status` が不正な値 → parse失敗
- `tags` が文字列配列でない → parse失敗
- `created_at` が空 → parse失敗
