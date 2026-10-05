#!/usr/bin/env bash
# 2026-10-06 OpenClaw Linux daily test — fresh probe execution (SUT v1.1.8-next.1 ffd7b47)
set -u
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
EV="$(cd "$(dirname "$0")" && pwd)"
REPO="/home/testbot1/devkit-test/OpenClaw/huaweicloud-devkit-test"
HDK="$REPO/../hdk"
SERVER="$HDK/plugins/huaweicloud-core/src/mcp-server.mjs"

TOTAL=0; PASSED=0
declare -a FAILED_NAMES=()

run_probe() {
  local name="$1"; local script="$2"; shift 2
  local log="$EV/$name.stdout.log"
  echo "" > "$log"
  local code=0
  ( cd "$REPO" && node "$script" "$@" ) > "$log" 2>&1
  code=$?
  TOTAL=$((TOTAL+1))
  if [ "$code" -eq 0 ]; then PASSED=$((PASSED+1)); echo "PASS  $name (exit=0)"; else FAILED_NAMES+=("$name"); echo "FAIL  $name (exit=$code)"; fi
}

run_py() {
  local name="$1"; local script="$2"; shift 2
  local log="$EV/$name.stdout.log"
  echo "" > "$log"
  local code=0
  ( cd "$REPO" && python3 "$script" "$@" ) > "$log" 2>&1
  code=$?
  TOTAL=$((TOTAL+1))
  if [ "$code" -eq 0 ]; then PASSED=$((PASSED+1)); echo "PASS  $name (exit=0)"; else FAILED_NAMES+=("$name"); echo "FAIL  $name (exit=$code)"; fi
}

echo "=== Evidence dir: $EV ==="
echo "=== SUT: $(cd "$HDK" && git rev-parse --short HEAD) ==="
echo "=== start: $(date '+%F %T') ==="

# --- deterministic new cases ---
run_probe new-cases/probe-new-deterministic "$EV/new-cases/probe-new-deterministic.mjs"
run_py    new-cases/probe-d4-25-telemetry "$EV/new-cases/probe-d4-25-telemetry.py"
run_probe new-cases/probe-d3-c14 "$EV/new-cases/probe-d3-c14.mjs"

# --- grouped probes (direct source-level) ---
run_probe d1-update-check/probe-d1-update-check "$EV/d1-update-check/probe-d1-update-check.mjs"
run_probe d1-upgrade/probe-d1-39-linux "$EV/d1-upgrade/probe-d1-39-linux.mjs"
run_probe d1-upgrade/probe-d1-cli "$EV/d1-upgrade/probe-d1-cli.mjs"
run_probe d1-upgrade/probe-d1-install-update "$EV/d1-upgrade/probe-d1-install-update.mjs"
run_probe d1-upgrade/probe-d1-upgrade "$EV/d1-upgrade/probe-d1-upgrade.mjs"
run_probe d1-upgrade/probe-mcp-config-preserve "$EV/d1-upgrade/probe-mcp-config-preserve.mjs"

run_probe d2-auth/probe-d2-11-r3-sts "$EV/d2-auth/probe-d2-11-r3-sts.mjs"
run_probe d2-auth/probe-d2-16-import "$EV/d2-auth/probe-d2-16-import.mjs"
run_probe d2-auth/probe-d2-2-10-status "$EV/d2-auth/probe-d2-2-10-status.mjs"
run_probe d2-auth/probe-d2-auth "$EV/d2-auth/probe-d2-auth.mjs"
run_probe d2-auth/probe-d2-r11-placeholder "$EV/d2-auth/probe-d2-r11-placeholder.mjs"
run_probe d2-auth/probe-d2-26-backup-restore "$EV/d2-auth/probe-d2-26-backup-restore.mjs"

run_probe d3-C4-servicematrix/probe-servicematrix "$EV/d3-C4-servicematrix/probe-servicematrix.mjs"
run_probe d3-d5-functional/probe-d3-b3-readonly "$EV/d3-d5-functional/probe-d3-b3-readonly.mjs"
run_probe d3-d5-functional/probe-d3-d5 "$EV/d3-d5-functional/probe-d3-d5.mjs"
run_probe d3-d5-functional/probe-obs-tool "$EV/d3-d5-functional/probe-obs-tool.mjs"

run_probe d4-security-core/probe-d4-17-hook "$EV/d4-security-core/probe-d4-17-hook.mjs"
run_probe d4-security-core/probe-d4-18-20-confirm "$EV/d4-security-core/probe-d4-18-20-confirm.mjs"
run_probe d4-security-core/probe-d4-23-rules "$EV/d4-security-core/probe-d4-23-rules.mjs"
run_probe d4-security-core/probe-d4-24-token "$EV/d4-security-core/probe-d4-24-token.mjs"
run_probe d4-security-core/probe-d4-6-adminpass "$EV/d4-security-core/probe-d4-6-adminpass.mjs"
run_probe d4-security-core/probe-d4-6-plaintext "$EV/d4-security-core/probe-d4-6-plaintext.mjs"
run_probe d4-security-core/probe-d4-7-hooks "$EV/d4-security-core/probe-d4-7-hooks.mjs"
run_probe d4-security-core/probe-p0-security "$EV/d4-security-core/probe-p0-security.mjs"
run_probe d4-security-core/probe-v115-fixes "$EV/d4-security-core/probe-v115-fixes.mjs"
run_probe d4-security-core/probe-d4-27-redact "$EV/d4-security-core/probe-d4-27-redact.mjs"

run_probe d4-security-misc/probe-d10-4-security-intervention "$EV/d4-security-misc/probe-d10-4-security-intervention.mjs"
run_probe d4-security-misc/probe-d1-2-d4-10 "$EV/d4-security-misc/probe-d1-2-d4-10.mjs"
run_probe d4-security-misc/probe-d4-12-supplychain "$EV/d4-security-misc/probe-d4-12-supplychain.mjs"
run_probe d4-security-misc/probe-misc "$EV/d4-security-misc/probe-misc.mjs"

run_probe d6-performance/probe-d6-perf "$EV/d6-performance/probe-d6-perf.mjs"
run_probe d8-docs/probe-d8-docs "$EV/d8-docs/probe-d8-docs.mjs"
run_probe d8-skills/probe-d8-7-skills "$EV/d8-skills/probe-d8-7-skills.mjs"

run_probe d9-protocol/probe-d9-2-invalid "$EV/d9-protocol/probe-d9-2-invalid.mjs"
run_probe d9-protocol/probe-d9-edge "$EV/d9-protocol/probe-d9-edge.mjs"
run_probe d9-protocol/probe-d9-mcp-protocol "$EV/d9-protocol/probe-d9-mcp-protocol.mjs"
run_probe d9-protocol/probe-edge-input "$EV/d9-protocol/probe-edge-input.mjs"
run_probe d9-protocol/probe-d9-6-9-crossclient "$EV/d9-protocol/probe-d9-6-9-crossclient.mjs"
run_probe d9-protocol/probe-d9-12-handshake "$EV/d9-protocol/probe-d9-12-handshake.mjs"
run_probe d9-protocol/probe-d9-13-credential-proof "$EV/d9-protocol/probe-d9-13-credential-proof.mjs"

# --- D10 routing harness ---
run_probe d10-routing/probe-d10-routing "$EV/d10-routing/probe-d10-routing.mjs" "$SERVER"

echo ""
echo "=== end grouped: $(date '+%F %T') ==="
echo "=== 汇总(grouped): $PASSED/$TOTAL passed ==="
if [ ${#FAILED_NAMES[@]} -gt 0 ]; then
  echo "FAILED:"
  for n in "${FAILED_NAMES[@]}"; do echo "  - $n"; done
fi