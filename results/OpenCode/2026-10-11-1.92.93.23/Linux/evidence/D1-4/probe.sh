# D1 安装域探针（OpenCode Linux 每日回归，隔离版）：隔离 HOME
# 覆盖 D1-3(doctor) / D1-4(status/update 幂等) / D1-5(uninstall 干净度)
set -u
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
ISO_HOME="${1:-$HOME/devkit-test/OpenCode/iso-home-20261010}"
rm -rf "$ISO_HOME"
mkdir -p "$ISO_HOME"

run() {
  echo
  echo "================================================================================"
  echo "\$ HOME=$ISO_HOME $*"
  echo "================================================================================"
  HOME="$ISO_HOME" "$@" 2>&1 | grep -vE "ExperimentalWarning|trace-warnings"
  echo "--- exit=${PIPESTATUS[0]} ---"
}

echo "########## STEP 1: install --target opencode (isolated HOME) ##########"
run huaweicloud-devkit install --target opencode

echo
echo "########## STEP 2: status --target opencode (should show installed) ##########"
run huaweicloud-devkit status --target opencode

echo
echo "########## STEP 3: doctor --target opencode ##########"
run huaweicloud-devkit doctor --target opencode

echo
echo "########## STEP 4: status (2nd) — idempotency check (D1-4) ##########"
run huaweicloud-devkit status --target opencode

echo
echo "########## STEP 5: update — idempotency check (D1-4) ##########"
run huaweicloud-devkit update --target opencode

echo
echo "########## STEP 6: files created under isolated config root ##########"
find "$ISO_HOME/.config" -maxdepth 4 2>/dev/null | sort | head -80

echo
echo "########## STEP 7: uninstall --target opencode ##########"
run huaweicloud-devkit uninstall --target opencode

echo
echo "########## STEP 8: status after uninstall (should show not installed) ##########"
run huaweicloud-devkit status --target opencode

echo
echo "########## STEP 9: residue check after uninstall ##########"
find "$ISO_HOME/.config" -maxdepth 4 2>/dev/null | sort | head -40
echo "$ISO_HOME (residue above; empty or minimal = clean)"