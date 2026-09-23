#!/usr/bin/env bash
# D4-8 Py/Node 一致性 + D4-17 fail-closed + D4-14 审计 探针
set -uo pipefail
PLUGIN=/home/zhangshuang/devkit-test/OpenCode/hdk/plugins/huaweicloud-core
NODE_HOOK="$PLUGIN/hooks/huaweicloud-safety.mjs"
PY_HOOK="$PLUGIN/hooks/huaweicloud-safety.py"
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"

run_case() {
  local label="$1"; shift
  local payload="$1"
  echo "----- $label -----"
  echo "payload: $payload"
  local nout pout
  nout="$(echo "$payload" | node "$NODE_HOOK" 2>/dev/null)"
  pout="$(echo "$payload" | python3 "$PY_HOOK" 2>/dev/null)"
  echo "  node: ${nout:-<空=放行>}"
  echo "  py:   ${pout:-<空=放行>}"
}

# D4-8: configure show（Node 应 deny，Python 应也 deny 但实测?）
run_case "D4-8 configure show" '{"tool_name":"Bash","tool_input":{"command":"hcloud configure show"}}'
# D4-8: 写操作 delete（双路径应一致 deny）
run_case "D4-8 write delete" '{"tool_name":"Bash","tool_input":{"command":"hcloud ECS DeleteServers --id i"}}'
# D4-2 复核: env dump HW_*（双路径应 deny，实测?）
run_case "D4-2 env HW key" '{"tool_name":"Bash","tool_input":{"command":"env | grep HW_ACCESS_KEY"}}'
# D4-17: 畸形/不可解析输入（fail-closed?）
run_case "D4-17 malformed" 'not-json-at-all'
run_case "D4-17 empty tool_input" '{"tool_name":"Bash","tool_input":{}}'

echo
echo "===== D4-8 一致性结论(由判定结果比对) ====="