#!/usr/bin/env bash
# D1 CLI 生命周期探针 — Hermes / Linux / 1.1.4-next.3
# install -> doctor(安装态) -> 残留扫描 -> uninstall -> 卸载残留扫描
set -u
ISOHOME=$(mktemp -d /tmp/hdk-cli-iso.XXXXXX)
trap 'rm -rf "$ISOHOME"' EXIT

echo "===== 环境基线 ====="
node --version; npm --version; huaweicloud-devkit version 2>&1 | head -2

echo; echo "===== D1-1 install --target hermes (隔离 HERMES_HOME=$ISOHOME) ====="
HERMES_HOME="$ISOHOME" huaweicloud-devkit install --target hermes 2>&1 | grep -vE 'ExperimentalWarning|trace-warnings'

echo; echo "===== D1-1 安装产物 ====="
find "$ISOHOME" -maxdepth 3 -type d 2>/dev/null | sed "s#$ISOHOME#<HOME>#" | sort | head -40

echo; echo "===== D1-8 生成的 MCP 配置 (config.yaml) ====="
cat "$ISOHOME/config.yaml" 2>/dev/null

echo; echo "===== D1-3 doctor (安装态) ====="
HERMES_HOME="$ISOHOME" huaweicloud-devkit doctor 2>&1 | grep -E 'PASS|FAIL|warn|Results|Version'

echo; echo "===== D1-9 重启语义 (安装提示) ====="
HERMES_HOME="$ISOHOME" huaweicloud-devkit install --target hermes 2>&1 | grep -iE '重启|restart|生效' | head -5

echo; echo "===== D1-5 uninstall --target hermes ====="
HERMES_HOME="$ISOHOME" huaweicloud-devkit uninstall --target hermes 2>&1 | grep -vE 'ExperimentalWarning|trace-warnings|╔|║|╚'

echo; echo "===== D1-5 卸载残留扫描 ====="
find "$ISOHOME" -type f 2>/dev/null | sed "s#$ISOHOME#<HOME>#" | sort
echo "-- 目录 --"
find "$ISOHOME" -mindepth 1 -type d 2>/dev/null | sed "s#$ISOHOME#<HOME>#" | sort
echo "-- config.yaml (应为空) --"
cat "$ISOHOME/config.yaml" 2>/dev/null | head -20
echo "===== END ====="