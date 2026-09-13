#!/usr/bin/env bash
# D1-58 通用 MCP 白名单接入（Claude/Cursor merge）探针 — 通过 PTY 触发 option3
set -uo pipefail
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
DEVKIT="huaweicloud-devkit"

run_wire() {
  local iso="$1" label="$2"
  echo "---------- $label ----------"
  mkdir -p "$iso"
  # script -qec 提供伪终端，feed "3\n" 选「通用 MCP agent」
  printf '3\n' | HOME="$iso" script -qec "$DEVKIT install" /dev/null 2>&1 | grep -viE 'ExperimentalWarning|trace-warnings|^[[:space:]]*$' | head -40
  echo "--- 产物 .claude.json / .cursor/mcp.json ---"
  [ -f "$iso/.claude.json" ] && echo "[.claude.json EXISTS]" && cat "$iso/.claude.json"
  [ -f "$iso/.cursor/mcp.json" ] && echo "[.cursor/mcp.json EXISTS]" && cat "$iso/.cursor/mcp.json"
}

BASE="$(mktemp -d /tmp/hdk-d158.XXXXXX)"
trap 'rm -rf "$BASE"' EXIT

# D1-58-05 未命中：空 HOME（无 Claude/Cursor）→ 输出 snippet
run_wire "$BASE/empty" "D1-58-05 未命中 snippet(空HOME)"

# D1-58-02 命中 merge：构造 fake ~/.claude.json
mkdir -p "$BASE/claude"; printf '{"mcpServers":{"other-server":{"command":"x"}}}' > "$BASE/claude/.claude.json"
run_wire "$BASE/claude" "D1-58-02 命中 merge(fake .claude.json)"

# D1-58-03 同 key 跳过：已含 huaweicloud-devkit
mkdir -p "$BASE/skip"; printf '{"mcpServers":{"huaweicloud-devkit":{"command":"npx"}}}' > "$BASE/skip/.claude.json"
run_wire "$BASE/skip" "D1-58-03 同 key 跳过(已配置)"

# D1-58-04 坏 JSON 零写入
mkdir -p "$BASE/bad"; printf '{invalid json' > "$BASE/bad/.claude.json"
run_wire "$BASE/bad" "D1-58-04 坏 JSON 零写入"
echo "坏JSON文件内容(应保持原样):"; cat "$BASE/bad/.claude.json"