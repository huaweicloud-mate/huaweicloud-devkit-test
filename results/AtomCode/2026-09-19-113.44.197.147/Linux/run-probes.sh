#!/usr/bin/env bash
# AtomCode Linux 每日测试探针驱动：逐个重跑探针，生成当日新鲜 stdout 证据。
set -u
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
cd "$(dirname "$0")/evidence" || exit 1

run() { # $1=probe.mjs relative, $2=stdout log relative
  echo "=== RUN $1 -> $2 ==="
  node "$1" > "$2" 2>&1
  echo "exit=$?  (tail:)"
  tail -3 "$2"
  echo ""
}

run d4-security-core/probe-p0-security.mjs d4-security-core/stdout-probe-p0-security.log
run d4-rules/probe.mjs d4-rules/stdout-probe.log
run d4-approval/probe-d4-approval.mjs d4-approval/stdout-probe-d4-approval.log
run d4-confirm/probe.mjs d4-confirm/stdout-probe.log
run d4-extend/probe.mjs d4-extend/stdout-probe.log
run d2-auth/probe-d2-1.mjs d2-auth/stdout-probe-d2-1.log
run d2-auth/probe-d2-auth.mjs d2-auth/stdout-probe-d2-auth.log
run d2-auth/probe-d2auth.mjs d2-auth/stdout-probe-d2auth.log
run d2-auth/probe.mjs d2-auth/stdout-probe.log
run d2-extend/probe.mjs d2-extend/stdout-probe.log
run d1-upgrade/probe.mjs d1-upgrade/stdout-probe.log
run d1-upgrade/probe-d1-upgrade.mjs d1-upgrade/stdout-probe-d1-upgrade.log
run d1-upgrade-detect/probe.mjs d1-upgrade-detect/stdout-probe.log
run d1-extend/probe.mjs d1-extend/stdout-probe.log
run d3-misc/probe-d3-b3.mjs d3-misc/stdout-probe-d3-b3.log
run d3misc/probe.mjs d3misc/stdout-probe.log
run d5-tools/probe.mjs d5-tools/stdout-probe.log
run d8-skills/probe.mjs d8-skills/stdout-probe.log
run d9-protocol/probe.mjs d9-protocol/stdout-probe.log
run d9-protocol/probe-d9-mcp-protocol.mjs d9-protocol/stdout-probe-d9-mcp-protocol.log
run d9-protocol/probe-d9-8.mjs d9-protocol/stdout-probe-d9-8.log
run expanded/probe.mjs expanded/stdout-probe.log

echo "=== cli/probe.sh ==="
bash cli/probe.sh > cli/stdout.log 2>&1
echo "exit=$? (tail:)"
tail -5 cli/stdout.log

echo "=== DONE all probes ==="