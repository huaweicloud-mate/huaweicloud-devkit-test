# D1-1 / D1-5 安装域探针（CodeArtsAgent Linux，隔离 HOME 版）
# 隔离 HOME：codearts 配置落 homedir()/.codeartsdoer，隔离 HOME 即可避免污染真实环境
set -u
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
ISO_HOME="${1:-$HOME/devkit-test-codearts-iso/iso-home-$(date +%s)}"
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

echo "########## STEP 1: install --target codearts (isolated HOME) ##########"
run huaweicloud-devkit install --target codearts

echo
echo "########## STEP 2: status --target codearts (should show installed) ##########"
run huaweicloud-devkit status --target codearts

echo
echo "########## STEP 3: doctor --target codearts ##########"
run huaweicloud-devkit doctor --target codearts

echo
echo "########## STEP 4: files created under isolated .codeartsdoer ##########"
find "$ISO_HOME/.codeartsdoer" -maxdepth 3 2>/dev/null | sort

echo
echo "########## STEP 5: uninstall --target codearts ##########"
run huaweicloud-devkit uninstall --target codearts

echo
echo "########## STEP 6: status after uninstall (should show not installed) ##########"
run huaweicloud-devkit status --target codearts

echo
echo "########## STEP 7: residue check after uninstall ##########"
find "$ISO_HOME/.codeartsdoer" -maxdepth 3 2>/dev/null | sort
echo "(residue above; empty or minimal = clean)"
