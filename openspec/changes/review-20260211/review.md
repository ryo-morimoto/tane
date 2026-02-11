# Review: Initial Project Scaffold

## 対象

全untrackedファイル（コミット履歴なし、初期スキャフォールド）

## Code Quality Assessment

### 良い点

- **依存最小限**: runtime deps 3つ（MCP SDK, yaml, zod）のみ。設計方針通り
- **TypeScript設定が適切**: strict mode, bundler moduleResolution, Cloudflare Workers types
- **index.tsがシンプル**: health endpointと404のみ。過剰な実装がない
- **openspec構造が整備済み**: proposal, design, tasks が揃っており、実装に着手できる状態

### 問題点

#### [SHOULD FIX] wrangler.toml の `nodejs_compat` フラグ

`wrangler.toml` に `compatibility_flags = ["nodejs_compat"]` が設定されているが、CLAUDE.mdの規約で「Web Standard APIs only. Node.js固有のAPIは使わない」と明記されている。MCP SDKが内部でNode.js APIを使う可能性があるため必要かもしれないが、実際に不要であれば削除すべき。

**判断**: MCP SDKの動作検証後に再判断。現時点では保留。

#### [NOTE] vitest が devDependencies にあるがテストファイルが0

`package.json` の scripts に `"test": "vitest run"` があり vitest が入っているが、テストファイルが1つもない。MVP実装が進めばテストも追加されるはずだが、現時点では空振りする。

#### [NOTE] `Env` interface がローカル定義

`src/index.ts:1` で `Env` interface が定義されている。design.mdではEntry pointに `Env` type が含まれる設計になっているので、現時点では問題ない。ただし、auth.tsやmcp.tsからも `Env` が必要になるため、共通の型ファイルに切り出す判断は実装時に必要。

#### [NOTE] setup.sh のバージョン確認ロジック

`setup.sh:13` の `NODE_VERSION` 判定は major version のみ見ており、`20.19.0+` の minor/patch チェックはしていない。実用上は問題ないが、README.md に `Node.js 20.19.0+` と書いてある点と微妙に乖離。

## Test Coverage

- テストファイル: 0
- 型チェック: パス
- 実行確認: health endpoint + 404 のみ

## 設計ドキュメントとの整合性

| 設計項目 | 状態 |
|----------|------|
| Runtime: Cloudflare Workers | OK |
| 依存: MCP SDK, yaml, zod | OK |
| TypeScript | OK (strict mode) |
| Entry point構造 | 部分実装（healthのみ） |
| Schema層 | 未実装 |
| Markdown層 | 未実装 |
| GitHub API層 | 未実装 |
| Core層 | 未実装 |
| MCP handler | 未実装 |
| Auth handler | 未実装 |

## Summary

- [MUST FIX]: 0
- [SHOULD FIX]: 1 (nodejs_compat — 要検証)
- [NOTE]: 3
