#!/usr/bin/env bash
# D1 安装生命周期 + D5-1 manifest + D4-23 全局规则注入 探针 — Hermes/Linux/1.1.4-next.3
set -uo pipefail
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
ISOHOME="$(mktemp -d /tmp/hdk-cli.XXXXXX)"
trap 'rm -rf "$ISOHOME"' EXIT

echo "===== 环境基线 ====="
node --version; npm --version
huaweicloud-devkit version 2>&1 | head -2

echo; echo "===== D1-1 install --target hermes (隔离 HOME) ====="
HERMES_HOME="$ISOHOME" huaweicloud-devkit install --target hermes 2>&1 | grep -viE 'ExperimentalWarning|trace-warnings' | head -40

echo; echo "===== D1-1/D5-1 安装产物（manifest / plugin / rules） ====="
find "$ISOHOME" -maxdepth 4 \( -name '*.json' -o -name '*.mjs' -o -name '*.md' -o -name 'config.yaml' \) 2>/dev/null | sed "s#$ISOHOME#<HOME>#" | sort | head -50

echo; echo "===== D4-23 全局规则 huawei-agent-rules.md 注入 ====="
find "$ISOHOME" -name 'huawei-agent-rules*' -o -name '*agent-rules*' 2>/dev/null | sed "s#$ISOHOME#<HOME>#" | sort
RULESFILE="$(find "$ISOHOME" -name 'huawei-agent-rules.md' 2>/dev/null | head -1)"
if [ -n "$RULESFILE" ]; then echo "  [OK] 规则文件存在，内容前 5 行:"; sed -n '1,5p' "$RULESFILE"; else echo "  [缺] 未找到 huawei-agent-rules.md"; fi

echo; echo "===== D1-3 doctor（安装态） ====="
HERMES_HOME="$ISOHOME" huaweicloud-devkit doctor 2>&1 | grep -iE 'pass|fail|ok|warn|result|version|node|hcloud|代理|proxy' | head -30

echo; echo "===== D1-2 多Agent探测（省略 --target） ====="
HERMES_HOME="$ISOHOME" huaweicloud-devkit install 2>&1 | grep -viE 'ExperimentalWarning|trace-warnings' | head -30

echo; echo "===== D1-4 status / update 幂等 ====="
HERMES_HOME="$ISOHOME" huaweicloud-devkit status 2>&1 | grep -iE 'Hermes|installed|not installed|未安装|MCP' | head -10
echo "--- update（应报已是最新或提示） ---"
HERMES_HOME="$ISOHOME" huaweicloud-devkit update 2>&1 | grep -viE 'ExperimentalWarning|trace-warnings' | head -15

echo; echo "===== D1-6 install-hcloud 幂等 ====="
huaweicloud-devkit install-hcloud 2>&1 | grep -viE 'ExperimentalWarning|trace-warnings' | head -15

echo; echo "===== D1-5 uninstall --target hermes ====="
HERMES_HOME="$ISOHOME" huaweicloud-devkit uninstall --target hermes 2>&1 | grep -viE 'ExperimentalWarning|trace-warnings|╔|║|╚' | head -20

echo; echo "===== D1-5 卸载残留扫描 ====="
find "$ISOHOME" -type f 2>/dev/null | sed "s#$ISOHOME#<HOME>#" | sort | head -30
echo "残留文件数: $(find "$ISOHOME" -type f 2>/dev/null | wc -l)"