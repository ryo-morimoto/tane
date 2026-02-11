# tane

GitHubリポジトリをデータストアにしたアイデア管理MCPサーバー。

## セットアップ

```bash
cd tane
bash setup.sh
```

前提: Node.js 20.19.0+, Git, uv（Showboat/Rodney用）

## 使い方

### ソロ開発

```bash
/compound:ship ユーザー認証にOAuth追加
```

1. **Plan** — proposal + tasks 生成（LEARNINGS.md参照済み）
2. **Implement** — red/green TDD + テスト実行
3. **Verify** — Showboatで実際にコマンド実行し demo.md を構築
4. **Review** — コード + demo.md を設計レビュー。[MUST FIX] は自動修正
5. **Learn** — 学びを LEARNINGS.md に蓄積
6. **Archive** — specs更新。demo.md も一緒にアーカイブ

### チーム合意 → ソロ実装

```bash
/compound:plan 決済システム刷新     # proposalだけ生成して止まる
# チームでレビュー・合意
/compound:ship 決済システム刷新     # 既存proposalから全自動サイクル
```

### 既存コードの後追い

```bash
/compound:review main..feature-branch
```

## MVP実装を開始する

`openspec/changes/mvp/` にproposal, specs, design, tasksが揃っている。

```bash
/compound:ship mvp
```

## 設計ドキュメント

- [proposal.md](openspec/changes/mvp/proposal.md) — なぜ作るのか
- [design.md](openspec/changes/mvp/design.md) — アーキテクチャ
- [tasks.md](openspec/changes/mvp/tasks.md) — 実装タスク
- [specs/](openspec/changes/mvp/specs/) — ドメインごとの仕様

## ファイル構成

```
.claude/plugins/compound/          # Compound Engineering plugin
├── .claude-plugin/plugin.json
└── skills/
    ├── ship.md                    # /compound:ship — 全自動サイクル
    ├── plan.md                    # /compound:plan — チーム合意用proposal
    └── review.md                  # /compound:review — 後追いレビュー

openspec/
├── config.yaml                 # default_schema: compound
├── specs/                      # Source of truth (archived specs)
├── learnings/
│   └── LEARNINGS.md            # 蓄積される知識
├── changes/
│   └── mvp/                    # 初期change (ready to ship)
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       └── specs/
└── schemas/compound/
    └── schema.yaml             # カスタムワークフロー定義
```
