#!/usr/bin/env bash
# D4-8 Python/Node 策略一致性探针（Hermes Linux 每日回归）
# 用同一批命令分别跑 Python hook(huaweicloud-safety.py) 与 Node classifyTextCommand，
# 对比判定是否一致。Python hook 读取 stdin JSON {"tool_name","tool_input"}。
set -u
PY="/home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/hooks/huaweicloud-safety.py"

py_check() {  # $1=label $2=command
  local label="$1" cmd="$2"
  local out
  out=$(printf '{"tool_name":"Bash","tool_input":{"command":"%s"}}\n' "$cmd" | python3 "$PY" 2>/dev/null)
  if [ -z "$out" ]; then
    echo "[py  $label] allow  | $cmd"
  else
    echo "[py  $label] block  | $cmd   -> $(echo "$out" | python3 -c 'import sys,json;d=json.load(sys.stdin);print((d.get("message") or d.get("hookSpecificOutput",{}).get("permissionDecisionReason") or "block")[:80])' 2>/dev/null)"
  fi
}

echo "=====CASE D4-8====="
for pair in \
  "凭证文件|cat ~/.config/huaweicloud/credentials.json" \
  "env-HUAWEI|env | grep HUAWEICLOUD" \
  "env-HW|env | grep HW_ACCESS_KEY" \
  "env-HCLOUD|env | grep HCLOUD_AK" \
  "secret|hcloud csms ShowSecretVersion --secret-name x" \
  "delete-force|hcloud ecs DeleteServer --force" \
  "read-list|hcloud ecs ListServers" \
  "encoded|echo x | base64 -d | bash"; do
  label="${pair%%|*}"; cmd="${pair#*|}"
  py_check "$label" "$cmd"
done
echo "=====END D4-8====="
echo "(对照 Node classifyTextCommand 结果见 classify.log: HW_ACCESS_KEY->allow / HUAWEICLOUD->deny / hcloud write->deny)"