#!/usr/bin/env bash
# D1 安装域探针（隔离版）：同时隔离 HOME 与 HERMES_HOME，避免污染真实 agent home。
# 目标：Hermes（Linux）。覆盖 D1-1(install) / D1-3(doctor) / D1-4(status/update 幂等) / D1-5(uninstall 干净度)
set -u
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
ISO_HOME="${1:-$HOME/devkit-test/Hermes/iso-home}"
rm -rf "$ISO_HOME"
mkdir -p "$ISO_HOME/.hermes"

# 关键：必须同时隔离 HERMES_HOME（最高优先级 override），否则回落到真实 hermes-home
export HERMES_HOME="$ISO_HOME/.hermes"

run() {
  echo
  echo "=================================================================================="
  echo "\$ HOME=$ISO_HOME HERMES_HOME=$HERMES_HOME $*"
  echo "=================================================================================="
  HOME="$ISO_HOME" HERMES_HOME="$HERMES_HOME" "$@" 2>&1 | grep -vE "ExperimentalWarning|trace-warnings"
  echo "--- exit=${PIPESTATUS[0]} ---"
}

echo "########## STEP 1: install --target hermes (isolated HOME+HERMES_HOME) ##########"
run huaweicloud-devkit install --target hermes

echo
echo "########## STEP 2: status --target hermes (should show installed) ##########"
run huaweicloud-devkit status --target hermes

echo
echo "########## STEP 3: doctor --target hermes ##########"
run huaweicloud-devkit doctor --target hermes

echo
echo "########## STEP 4: status (2nd) — idempotency check D1-4 ##########"
run huaweicloud-devkit status --target hermes

echo
echo "########## STEP 5: update — idempotency check D1-4 ##########"
run huaweicloud-devkit update --target hermes

echo
echo "########## STEP 6: files created under isolated HERMES_HOME ##########"
find "$HERMES_HOME" -maxdepth 3 2>/dev/null | sort

echo
echo "########## STEP 7: uninstall --target hermes ##########"
run huaweicloud-devkit uninstall --target hermes

echo
echo "########## STEP 8: status after uninstall (should show not installed) ##########"
run huaweicloud-devkit status --target hermes

echo
echo "########## STEP 9: residue check after uninstall ##########"
find "$HERMES_HOME" -maxdepth 3 2>/dev/null | sort
echo "(residue above; empty or minimal = clean)"