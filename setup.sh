#!/bin/bash
set -euo pipefail

echo "=== Compound Engineering Setup ==="
echo ""

# 1. Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &>/dev/null; then
  echo "❌ Node.js not found. Install Node.js 20.19.0+"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js 20+ required (found $(node -v))"
  exit 1
fi
echo "  ✅ Node.js $(node -v)"

if ! command -v git &>/dev/null; then
  echo "❌ Git not found"
  exit 1
fi
echo "  ✅ Git $(git --version | cut -d' ' -f3)"

if ! command -v uv &>/dev/null; then
  echo "⚠️  uv not found. Installing..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi
echo "  ✅ uv $(uv --version 2>/dev/null || echo 'installed')"

# 2. Initialize OpenSpec (if not already)
if [ ! -f "openspec/config.yaml" ]; then
  echo ""
  echo "Initializing OpenSpec..."
  bunx @fission-ai/openspec@latest init
else
  echo "  ✅ OpenSpec already initialized"
fi

# 3. Verify Showboat/Rodney are accessible via uvx
echo ""
echo "Verifying Showboat & Rodney..."
uvx showboat --help >/dev/null 2>&1 && echo "  ✅ Showboat" || echo "  ⚠️  Showboat not available via uvx"
uvx rodney --help >/dev/null 2>&1 && echo "  ✅ Rodney" || echo "  ⚠️  Rodney not available via uvx (optional, for Web UI)"

# 4. Make hooks executable
if [ -f ".claude/hooks/checkpoint-gate.sh" ]; then
  chmod +x .claude/hooks/checkpoint-gate.sh
  echo "  ✅ Hooks configured"
fi

# 5. Initialize LEARNINGS.md if empty
if [ ! -s "openspec/learnings/LEARNINGS.md" ]; then
  cat > openspec/learnings/LEARNINGS.md << 'EOF'
# Learnings

プロジェクトを通じて蓄積される知見。各changeのレビューから抽出される。

<!-- New learnings are appended below by /compound:ship -->
EOF
  echo "  ✅ LEARNINGS.md initialized"
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "Usage:"
echo "  /compound:ship <description>    # 全自動: plan → implement → verify → review → learn → archive"
echo "  /compound:plan <description>    # planだけ生成して止まる（チーム合意用）"
echo "  /compound:review <git-range>    # 既存コードの後追いレビュー"
