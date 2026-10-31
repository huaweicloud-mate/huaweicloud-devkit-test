#!/usr/bin/env bash
# v2mig2 补测 —— D5-4 hook 拦截路径实测（隔离 HOME 安装 → 运行 Python 安全 hook）
# 之后由 d5-node.mjs 补齐 D5-4 Node 兜底 + D5-7 重启一致性。
set -u
export PATH="/home/testbot2/.local/bin:/home/testbot2/node22/bin:/home/testbot2/bin:/usr/local/bin:/usr/bin:/bin"
HDK="/home/testbot2/devkit-test/Hermes/hdk"
EVD="/home/testbot2/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-10-31-1.94.193.150-v2mig2/Linux/evidence"
CLI=huaweicloud-devkit
ISO="$(mktemp -d /tmp/v2mig2-d5hook-XXXX)"
mkdir -p "$EVD/D5-4"

# 1) 隔离 HOME 安装（Hermes hook 客户端）
HOME="$ISO" HERMES_HOME="$ISO/.hermes" "$CLI" install --target hermes > "$EVD/D5-4/install.log" 2>&1
HOOK="$ISO/.hermes/huaweicloud-plugins/hooks/huaweicloud-safety.py"

block_out=""
allow_out=""
block_ok=0
if [ -f "$HOOK" ]; then
  # 2) 写命令 → 应 block（Hermes pre_tool_call 消息含 hook_event_name，产出 {"action":"block"}）
  block_out=$(printf '%s' '{"hook_event_name":"PreToolUse","tool_name":"terminal","tool_input":{"command":"hcloud ECS DeleteServers --servers.1.id=abc --delete_publicip=true"}}' | python3 "$HOOK" 2>&1)
  if echo "$block_out" | grep -qiE '"action"[ ]*:[ ]*"block"|permissionDecision"[ ]*:[ ]*"deny"|blocked this action'; then block_ok=1; fi
  # 3) 只读命令 → 应 allow（exit 0 且无 block 输出）
  allow_out=$(printf '%s' '{"hook_event_name":"PreToolUse","tool_name":"terminal","tool_input":{"command":"hcloud ECS ListServersDetails"}}' | python3 "$HOOK" 2>&1)
fi

{
  echo "HOOK 路径: $HOOK"
  echo "hook 存在: $([ -f "$HOOK" ] && echo yes || echo no)"
  echo "--- 写命令 hook 输出 ---"
  echo "$block_out"
  echo "--- 只读命令 hook 输出（空=allow） ---"
  echo "$allow_out"
} > "$EVD/D5-4/hook-block.txt"

if [ "$block_ok" = "1" ] && ! echo "$allow_out" | grep -q 'block'; then
  echo "HOOK_BLOCK_OK" > "$EVD/D5-4/hook-result.txt"
  echo "RESULT: hook 写命令 block=OK, 只读命令 allow=OK" >> "$EVD/D5-4/hook-result.txt"
else
  echo "HOOK_BLOCK_FAIL block_ok=$block_ok" > "$EVD/D5-4/hook-result.txt"
  echo "RESULT: hook 拦截未达预期" >> "$EVD/D5-4/hook-result.txt"
fi

echo "=== D5-4 hook done; ISO=$ISO ==="
cat "$EVD/D5-4/hook-result.txt"