#!/usr/bin/env bash
# v2mig2 补测 —— D5/D7 安装域 & 兼容 真实安装探针（真实 npm install / update / 镜像 / 共存）
set -u
export PATH="/home/testbot2/.local/bin:/home/testbot2/node22/bin:/home/testbot2/bin:/usr/local/bin:/usr/bin:/bin"
HDK="/home/testbot2/devkit-test/Hermes/hdk"
TARBALL="$(ls "$HDK"/huaweicloud-devkit-2.0.0.tgz)"
EVD="/home/testbot2/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-10-31-1.94.193.150-v2mig2/Linux/evidence"
mkdir -p "$EVD/D5-2" "$EVD/D5-4" "$EVD/D5-7" "$EVD/D7-1" "$EVD/D7-2" "$EVD/D7-4" "$EVD/D7-5" "$EVD/D7-6"
SMOKE="$EVD/_probes/smoke-mcp.mjs"
BASE="$(mktemp -d /tmp/v2mig2-d5d7-XXXX)"
CLI=huaweicloud-devkit
NODE22=/home/testbot2/node22/bin/node

run() { # run <caseid> <cmd...>
  local id="$1"; shift
  local dir="$EVD/$id"; mkdir -p "$dir"
  echo "=====CASE $id =====" > "$dir/stdout.txt"
  echo "executedAt=$(TZ=Asia/Shanghai date '+%F %T')" >> "$dir/stdout.txt"
  echo "status=PENDING" >> "$dir/stdout.txt"
  "$@" >> "$dir/stdout.txt" 2>&1
  echo "EXIT=$?" >> "$dir/stdout.txt"
}

# ---------- D5-2 安装落点正确 ----------
ISO="$BASE/d5-2"; mkdir -p "$ISO"
HOME="$ISO" HERMES_HOME="$ISO/.hermes" "$CLI" install --target hermes > "$EVD/D5-2/install.log" 2>&1
echo "=====CASE D5-2 =====" > "$EVD/D5-2/stdout.txt"
echo "executedAt=$(TZ=Asia/Shanghai date '+%F %T')" >> "$EVD/D5-2/stdout.txt"
chk() { if [ -e "$1" ]; then echo "PASS: 落点存在 $1"; else echo "FAIL: 缺落点 $1"; fi; }
p="$ISO/.hermes"
{
  chk "$p/huaweicloud-plugins/dist/mcp-server.js"
  chk "$p/huaweicloud-plugins/skills"
  chk "$p/huaweicloud-plugins/safety"
  chk "$p/huaweicloud-plugins/hooks"
  chk "$p/huaweicloud-plugins/rules/huawei-agent-rules.mdc"
  chk "$p/skills"
  chk "$p/plugins/huaweicloud-safety"
  chk "$p/config.yaml"
  chk "$p/shell-hooks-allowlist.json"
  echo "--- install.log 尾部 ---"
  tail -18 "$EVD/D5-2/install.log"
} >> "$EVD/D5-2/stdout.txt"

# ---------- D7-1 OS 矩阵（Linux arm）安装+冒烟四工具 ----------
ISO="$BASE/d7-1"; mkdir -p "$ISO"
HOME="$ISO" HERMES_HOME="$ISO/.hermes" "$CLI" install --target hermes > "$EVD/D7-1/install.log" 2>&1
echo "=====CASE D7-1 =====" > "$EVD/D7-1/stdout.txt"
echo "executedAt=$(TZ=Asia/Shanghai date '+%F %T')" >> "$EVD/D7-1/stdout.txt"
echo "arch=$(uname -m) os=$(uname -s)" >> "$EVD/D7-1/stdout.txt"
HOME="$ISO" "$NODE22" "$SMOKE" "$ISO/.hermes/huaweicloud-plugins/dist/mcp-server.js" >> "$EVD/D7-1/stdout.txt" 2>&1

# ---------- D7-2 Node 版本矩阵（22.23.2 + 26） ----------
echo "=====CASE D7-2 =====" > "$EVD/D7-2/stdout.txt"
echo "executedAt=$(TZ=Asia/Shanghai date '+%F %T')" >> "$EVD/D7-2/stdout.txt"
MCPINST="$ISO/.hermes/huaweicloud-plugins/dist/mcp-server.js"
echo "--- node 22.23.2 (engines >=22.18 下界) initialize+tools/list ---" >> "$EVD/D7-2/stdout.txt"
HOME="$ISO" "$NODE22" "$SMOKE" "$MCPINST" >> "$EVD/D7-2/stdout.txt" 2>&1
echo "--- node 26.8.1 (默认) initialize+tools/list ---" >> "$EVD/D7-2/stdout.txt"
HOME="$ISO" node "$SMOKE" "$MCPINST" >> "$EVD/D7-2/stdout.txt" 2>&1
echo "node22 version=$($NODE22 --version)  node26 version=$(node --version)" >> "$EVD/D7-2/stdout.txt"

# ---------- D7-4 国内镜像源安装 ----------
ISO="$BASE/d7-4"; mkdir -p "$ISO"
MIRROR="https://repo.huaweicloud.com/repository/npm/"
echo "=====CASE D7-4 =====" > "$EVD/D7-4/stdout.txt"
echo "executedAt=$(TZ=Asia/Shanghai date '+%F %T')" >> "$EVD/D7-4/stdout.txt"
echo "mirror=$MIRROR" >> "$EVD/D7-4/stdout.txt"
(cd "$ISO" && npm install --prefix "$ISO/pkg" --registry "$MIRROR" "$TARBALL" --no-audit --no-fund) >> "$EVD/D7-4/stdout.txt" 2>&1
echo "registry set=$(cd "$ISO/pkg" && npm config get registry 2>/dev/null)" >> "$EVD/D7-4/stdout.txt"
echo "--- 安装结果核验 ---" >> "$EVD/D7-4/stdout.txt"
[ -f "$ISO/pkg/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/dist/mcp-server.js" ] && echo "PASS: 镜像源安装 tarball 落点完整 (dist/mcp-server.js 存在)" >> "$EVD/D7-4/stdout.txt" || echo "FAIL: 镜像源安装产物缺失" >> "$EVD/D7-4/stdout.txt"
ls "$ISO/pkg/node_modules" >> "$EVD/D7-4/stdout.txt" 2>&1

# ---------- D7-5 与既有配置共存 ----------
ISO="$BASE/d7-5"; mkdir -p "$ISO/.hermes"
cat > "$ISO/.hermes/config.yaml" <<'YAML'
mcp_servers:
  my-custom-server:
    command: my-custom-cmd
    args: ["--flag"]
markers:
  user_custom_note: "kEEP-ME-2026"
YAML
HOME="$ISO" HERMES_HOME="$ISO/.hermes" "$CLI" install --target hermes > "$EVD/D7-5/install.log" 2>&1
echo "=====CASE D7-5 =====" > "$EVD/D7-5/stdout.txt"
echo "executedAt=$(TZ=Asia/Shanghai date '+%F %T')" >> "$EVD/D7-5/stdout.txt"
{
  if grep -q "my-custom-server" "$ISO/.hermes/config.yaml"; then echo "PASS: 用户自定义 mcp_servers 未被覆盖/破坏"; else echo "FAIL: 用户自定义 mcp_servers 丢失"; fi
  if grep -q "kEEP-ME-2026" "$ISO/.hermes/config.yaml"; then echo "PASS: 用户自定义字段保留"; else echo "FAIL: 用户字段丢失"; fi
  if grep -q "huaweicloud-devkit" "$ISO/.hermes/config.yaml"; then echo "PASS: huaweicloud-devkit 已并入（共存）"; else echo "FAIL: devkit 未并入"; fi
  echo "--- config.yaml (mcp_servers 段) ---"
  sed -n '1,40p' "$ISO/.hermes/config.yaml"
} >> "$EVD/D7-5/stdout.txt"

# ---------- D7-6 升级兼容（update 通道 + CHANGELOG） ----------
ISO="$BASE/d7-6"; mkdir -p "$ISO"
HOME="$ISO" HERMES_HOME="$ISO/.hermes" "$CLI" install --target hermes > "$EVD/D7-6/install.log" 2>&1
HOME="$ISO" HERMES_HOME="$ISO/.hermes" "$CLI" update --target hermes > "$EVD/D7-6/update.log" 2>&1
echo "=====CASE D7-6 =====" > "$EVD/D7-6/stdout.txt"
echo "executedAt=$(TZ=Asia/Shanghai date '+%F %T')" >> "$EVD/D7-6/stdout.txt"
{
  echo "--- update --target hermes 尾部 ---"
  tail -12 "$EVD/D7-6/update.log"
  echo "--- CHANGELOG (docs/CHANGELOG.md) 头部 ---"
  sed -n '1,25p' "$HDK/docs/CHANGELOG.md"
} >> "$EVD/D7-6/stdout.txt"

echo "ALL_DONE BASE=$BASE"