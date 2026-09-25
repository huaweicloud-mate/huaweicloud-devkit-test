#!/usr/bin/env bash
# D4-28(Node hook 链路) + D1-67(Agent toolkit/DSH skip) + D1-69(CLI help) — Hermes/Linux/v1.1.5
set -uo pipefail
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
export HDK_PLUGIN_SRC="/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core"
export EVID_DIR="/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-26-113.44.143.91/Linux/evidence"
HOOK="$HDK_PLUGIN_SRC/hooks/huaweicloud-safety.mjs"
cd "$EVID_DIR"

##### D4-28 Node 版安全 hook 链路 (P0) #####
{
  echo "=== D4-28 Node 版安全 hook 链路 (P0) ==="
  echo "hooks.json 注册 Node hook:"
  cat "$HDK_PLUGIN_SRC/hooks/hooks.json"
  echo
  echo "--- 输入 1: echo 凭证 (预期 deny) ---"
  echo '{"tool_name":"Bash","tool_input":{"command":"echo $HW_SECRET_KEY"}}' | node "$HOOK"
  echo "--- 输入 2: 高危写命令 (预期 deny) ---"
  echo '{"tool_name":"Bash","tool_input":{"command":"hcloud ecs DeleteServer --id i-123"}}' | node "$HOOK"
  echo "--- 输入 3: 读取凭证文件 (预期 deny) ---"
  echo '{"tool_name":"Bash","tool_input":{"script":"cat ~/.hcloud/credentials"}}' | node "$HOOK"
  echo "--- 输入 4: 普通只读命令 (预期 allow / 无 deny 输出) ---"
  echo '{"tool_name":"Bash","tool_input":{"command":"ls -la"}}' | node "$HOOK"
  echo "--- 输入 5: 经 cmd 键提取 (预期 deny) ---"
  echo '{"tool_name":"Bash","tool_input":{"cmd":"hcloud ecs DeleteServer"}}' | node "$HOOK"
  echo
  echo "=== 判定: hooks.json 走 node huaweicloud-safety.mjs; command/cmd/script/args 提取; 高危 deny 输出 hookSpecificOutput.permissionDecision=deny ==="
} > /tmp/d4-28-out.txt 2>&1
mkdir -p D4-28 && cp /tmp/d4-28-out.txt D4-28/stdout.txt
echo "D4-28 done"

##### D1-67 Agent toolkit 模式与 DSH 跳过安装环境变量 #####
{
  echo "=== D1-67 Agent toolkit 模式与 DSH 跳过安装环境变量 ==="
  echo "[1] AGENT_TOOLKIT_MODE 注入 agent env (REQUIRED_ENV_KEYS):"
  grep -n "HUAWEICLOUD_AGENT_TOOLKIT_MODE" "$HDK_PLUGIN_SRC/src/setup-cli.mjs" | head -8
  echo
  echo "[2] REQUIRED_ENV_KEYS 含 HCLOUD_BIN (mcp-config-merge.mjs):"
  grep -n "REQUIRED_ENV_KEYS\|HCLOUD_BIN" "$HDK_PLUGIN_SRC/src/mcp-config-merge.mjs"
  echo
  echo "[3] SKIP_DSH 跳过 DSH 插件安装 (HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL === '1'):"
  grep -n "SKIP_DSH_PLUGIN_INSTALL\|tryInstallDshMcpClient\|DSH MCP client install skipped" "$HDK_PLUGIN_SRC/src/setup-cli.mjs"
  echo
  echo "=== 判定: AGENT_TOOLKIT_MODE/HCLOUD_BIN 为 installer 管理 env; SKIP_DSH=1 跳过 DSH client 安装 ==="
} > /tmp/d1-67-out.txt 2>&1
mkdir -p D1-67 && cp /tmp/d1-67-out.txt D1-67/stdout.txt
echo "D1-67 done"

##### D1-69 CLI help 子命令 #####
{
  echo "=== D1-69 CLI help 子命令 ==="
  echo "--- huaweicloud-devkit help ---"
  huaweicloud-devkit help 2>&1 | head -40
  echo "help exit=$?"
  echo "--- huaweicloud-devkit --help ---"
  huaweicloud-devkit --help 2>&1 | head -40
  echo "--help exit=$?"
  echo
  echo "=== 判定: help 子命令输出帮助且有退出码 0, 非 TODO/空输出 ==="
} > /tmp/d1-69-out.txt 2>&1
mkdir -p D1-69 && cp /tmp/d1-69-out.txt D1-69/stdout.txt
echo "D1-69 done"

echo "ALL DONE"