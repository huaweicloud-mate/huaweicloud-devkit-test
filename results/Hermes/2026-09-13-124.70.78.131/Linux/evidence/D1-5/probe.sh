#!/usr/bin/env bash
# D1 安装域探针：在隔离 HOME 下执行 install -> status -> doctor -> uninstall 全流程
# 目标：Hermes（Linux）
set -u
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
ISO_HOME="${1:-$HOME/devkit-test/Hermes/iso-home}"
rm -rf "$ISO_HOME"
mkdir -p "$ISO_HOME"
export OLDHOME="$HOME"

run() {
  echo
  echo "================================================================================"
  echo "\$ HOME=$ISO_HOME $*"
  echo "================================================================================"
  HOME="$ISO_HOME" "$@" 2>&1 | grep -vE "ExperimentalWarning|trace-warnings"
  echo "--- exit=$? ---"
}

echo "########## STEP 1: install --target hermes (isolated HOME) ##########"
HOME="$ISO_HOME" huaweicloud-devkit install --target hermes 2>&1 | grep -vE "ExperimentalWarning|trace-warnings"

echo
echo "########## STEP 2: status --target hermes (should show installed) ##########"
HOME="$ISO_HOME" huaweicloud-devkit status --target hermes 2>&1 | grep -vE "ExperimentalWarning|trace-warnings"

echo
echo "########## STEP 3: doctor --target hermes ##########"
HOME="$ISO_HOME" huaweicloud-devkit doctor --target hermes 2>&1 | grep -vE "ExperimentalWarning|trace-warnings"

echo
echo "########## STEP 4: files created under isolated HOME/.hermes ##########"
find "$ISO_HOME/.hermes" -maxdepth 3 2>/dev/null | sort

echo
echo "########## STEP 5: uninstall --target hermes ##########"
HOME="$ISO_HOME" huaweicloud-devkit uninstall --target hermes 2>&1 | grep -vE "ExperimentalWarning|trace-warnings"

echo
echo "########## STEP 6: status after uninstall (should show not installed) ##########"
HOME="$ISO_HOME" huaweicloud-devkit status --target hermes 2>&1 | grep -vE "ExperimentalWarning|trace-warnings"

echo
echo "########## STEP 7: residue check after uninstall ##########"
find "$ISO_HOME/.hermes" -maxdepth 3 2>/dev/null | sort
echo "(residue above; empty or minimal = clean)"