#!/usr/bin/env bash
# OpenCode CLI 探针: D1-3 doctor / D1-4 status/update 幂等 / D5-1 manifest 发现 / D4-23 全局规则注入
# 隔离 HOME 到临时目录（target=opencode，config 根 ~/.config/opencode）
set -uo pipefail
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
ISOHOME="$(mktemp -d /tmp/hdk-cli.XXXXXX)"
trap 'rm -rf "$ISOHOME"' EXIT

echo "===== 环境基线 ====="
node --version; npm --version
huaweicloud-devkit version 2>&1 | head -2

echo; echo "===== D5-1/D1 安装（隔离 HOME, --target opencode） ====="
HOME="$ISOHOME" huaweicloud-devkit install --target opencode 2>&1 | grep -viE 'ExperimentalWarning|trace-warnings' | head -40

echo; echo "===== D5-1 安装产物（manifest / plugin / rules / skills） ====="
find "$ISOHOME" -maxdepth 6 \( -name '*.json' -o -name '*.mjs' -o -name '*.md' -o -name '*.jsonc' \) 2>/dev/null | sed "s#$ISOHOME#<HOME>#" | sort | head -60

echo; echo "===== D4-23 全局规则 huawei-agent-rules.md 注入 ====="
find "$ISOHOME" \( -name 'huawei-agent-rules*' -o -name '*agent-rules*' \) 2>/dev/null | sed "s#$ISOHOME#<HOME>#" | sort
RULESFILE="$(find "$ISOHOME" -name 'huawei-agent-rules.md' 2>/dev/null | head -1)"
if [ -n "$RULESFILE" ]; then echo "  [OK] 规则文件存在，内容前 6 行:"; sed -n '1,6p' "$RULESFILE"; else echo "  [缺] 未找到 huawei-agent-rules.md"; fi

echo; echo "===== D1-3 doctor（安装态） ====="
HOME="$ISOHOME" huaweicloud-devkit doctor 2>&1 | grep -iE 'pass|fail|ok|warn|result|version|node|hcloud|proxy' | head -30

echo; echo "===== D1-4 status / update 幂等 ====="
HOME="$ISOHOME" huaweicloud-devkit status --target opencode 2>&1 | grep -iE 'opencode|installed|not installed|未安装|MCP' | head -10
echo "--- update（应报已是最新或提示，幂等） ---"
HOME="$ISOHOME" huaweicloud-devkit update --target opencode 2>&1 | grep -viE 'ExperimentalWarning|trace-warnings' | head -15

echo; echo "===== D1-69 help（复用） ====="
huaweicloud-devkit help 2>&1 | head -5
echo "help exit=$?"