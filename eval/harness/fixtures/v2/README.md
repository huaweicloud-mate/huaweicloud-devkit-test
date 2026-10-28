# UX 夹具 v2 适配 shim

> 让 v1 的 41 个 UX 体验夹具（`eval/harness/fixtures/d11-*.mjs`）在**源仓库 v2 分支**上执行，
> **不修改任何 v1 夹具源码、不改 `run-ux.mjs`**。

## 为什么需要 shim

- v1 夹具通过 `ux-common.mjs` 的 `importHdk(hdkSrc, 'tools.mjs')` 动态 import v1 源码（`.mjs`）。
- v2 分支全面 TypeScript 化（`.mjs → .ts`），`npm run build` 后产物是 `plugins/huaweicloud-core/dist/**/*.js`。
- 直接让 hdkSrc 指向 v2 的 src（`.ts`）或 dist（`.js`），夹具的 `.mjs` import 都会命中失败。

## 原理

本目录是「与 v1 同名的 `.mjs` 桥接层」。跑夹具时把 `hdkSrc` 指向**本目录**（不是 v2 src/dist），
夹具 `importHdk(hdkSrc, 'tools.mjs')` 命中 `v2/tools.mjs` → 该 shim 动态 import v2 dist 的
`tools.js` 并 re-export 同名符号。

符号兼容性（已核对 v1/v2 export 面）：

| 模块 | 适配情况 |
|---|---|
| `tools.mjs`（callTool / TOOL_DEFINITIONS / classifyRawCommand / listSkillDirs…）| ✅ v2 同名存在 |
| `auth/credentials.mjs`（22 个符号）| ✅ v2 同名存在 |
| `auth/service.mjs`（computeOnboarding / getAuthStatus / syncAuth）| ✅ v2 同名存在 |
| `auth/credential-validator.mjs`（validateIamCredentials）| ✅ v2 同名存在 |
| `hcloud-probe.mjs`（6 个符号）| ✅ v2 同名存在 |
| `mcp-protocol.mjs`（dispatch）| ⚠️ v2 删除 dispatch → shim 提供最小等价实现（tools/list·tools/call·initialize），`_decorateResult` 等桥接 v2 同名函数 |

## 用法（本机 / 测试机通用）

```bash
# 1. 拉 v2 源码 + 装依赖 + build（一次性）
git clone https://github.com/huaweicloud/huaweicloud-devkit.git hdk-v2
cd hdk-v2 && git checkout v2 && npm ci && npm run build
# 产物：hdk-v2/plugins/huaweicloud-core/dist/**.js

# 2. 跑 UX 夹具：hdkSrc = 本 shim 目录；V2_DIST = v2 dist 绝对路径
cd <测试仓库>
V2_DIST="$PWD/../hdk-v2/plugins/huaweicloud-core/dist" \
node eval/harness/fixtures/run-ux.mjs \
     eval/harness/fixtures/v2 \
     --evid results/<客户端>/<日期>-<IP>/ux-v2/evidence \
     --json results/<客户端>/<日期>-<IP>/ux-v2/UX专项-v2-<日期>.json
```

- `--run-frozen`：照跑契约待冻结夹具（结果仍记 NOT_RUN，只做趋势观察）。
- 四态口径与 v1 一致：PASS / NOT_IMPLEMENTED / BLOCKED / NOT_RUN（见 `run-ux.mjs` 头部注释）。

## 已知差异（v2 契约变化，夹具会如实反映，非 shim 缺陷）

- `huaweicloud_service_catalog` / `plan_cli_command` 有 **vendor gate**（未传 `vendorConfirmed` 返回空），
  D11-17 路由、D11-19/33 审批等夹具会因此 FAIL —— 这是 v2 的真实行为。
- 安全规则集 16→19 条（D11 相关断言若写死规则数会 FAIL）。

## 维护约定

- 本目录是 v2 专用桥接层，**新增/修改只针对 v2 符号差异**，绝不回改 v1 的 `d11-*.mjs` 与 `run-ux.mjs`。
- v2 每次重构变更 export 面时，跑一遍夹具，凡 HARNESS_ERROR 先核对本目录 shim 的 re-export 是否落伍。
- `setup-cli.mjs` 是 **v2 源码副本**（d11-11/23 用 `readFileSync` 做源码级文本核对），**禁止手改**，用同步器：

  ```bash
  node eval/harness/fixtures/v2/sync-setup-cli.mjs                 # 同步（默认源 ../_hdk_v2，可用 --src 或 HDK_V2_SRC）
  node eval/harness/fixtures/v2/sync-setup-cli.mjs --check         # 只检查；落伍时 exit=3（可直接当 CI 门禁）
  ```

  同步会写 `setup-cli.provenance.json`（源 branch/commit、sha256、行数、同步时间）供对账；
  源工作区 dirty 时会 `[WARN]`（副本可能对不上任何已发布 commit → 测试机结论不可比）。