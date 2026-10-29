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
| `tools.mjs`（callTool / TOOL_DEFINITIONS / classifyRawCommand / listSkillDirs…）| ✅ v2 同名存在（`callTool` 外层加 vendor gate 兜底，见下） |
| `auth/credentials.mjs`（22 个符号）| ✅ v2 同名存在 |
| `auth/service.mjs`（computeOnboarding / getAuthStatus / syncAuth）| ✅ v2 同名存在 |
| `auth/credential-validator.mjs`（validateIamCredentials）| ✅ v2 同名存在 |
| `hcloud-probe.mjs`（6 个符号）| ✅ v2 同名存在 |
| `mcp-protocol.mjs`（dispatch）| ⚠️ v2 删除 dispatch → shim 提供最小等价实现（tools/list·tools/call·initialize），`_decorateResult` 等桥接 v2 同名函数 |
| `setup-cli.mjs` | ⚠️ **双用文件**（可 spawn 的 CLI + 源码文本载体），由 `sync-setup-cli.mjs` 生成，见「维护约定」 |

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
- ⚠️ `V2_DIST` 必须是**本机原生绝对路径**（Windows 上给 `C:/…`，别给 git-bash 的 `/c/…`——原生命令不认）。

## 已知差异（v2 契约变化，夹具会如实反映，非 shim 缺陷）

- `huaweicloud_service_catalog` / `plan_cli_command` 有 **vendor gate**（未传 `vendorConfirmed` 返回空），
  D11-17 路由、D11-19/33 审批等夹具会因此 FAIL —— 这是 v2 的真实行为。
- 安全规则集 16→19 条（D11 相关断言若写死规则数会 FAIL）。

## D9 功能/协议探针的 v2 适配（2026-10-29 落地）

`d9-9/d9-10/d9-11/protocol-probe/d9-6` 这 5 个探针**不是 UX 夹具**，不走 `run-ux.mjs`，而是各自 `import` 或
`spawn` v1 源码 `.mjs`。本目录补了 3 个 shim 让它们在 v2 下可跑（也是 v2 专用桥接，绝不回改 v1 探针）：

| shim 文件 | 作用 | 覆盖探针 |
|---|---|---|
| `mcp-server.mjs` | spawn 入口桥接：`spawnSync` 透传 argv/stdio 到 `dist/mcp-server.js` | d9-6 / d9-10(stdio对照) / protocol-probe |
| `mcp-server-remote.mjs` | **等价实现** `startRemoteServer/DEFAULT_PORT/DEFAULT_HOST`（v2 无独立 remote 产物，符号内联进 bundle），转发 HTTP JSON-RPC 到 stdio 子进程 | d9-10 |
| `ws-exec/hwlink-tunnel-channel.mjs` | re-export `dist/ws-exec/hwlink-tunnel-channel.js` 的 `HwlinkTunnelChannel` | d9-11 |

跑法（关键是 `hdkSrc` 指向本 shim 目录，且用**原生绝对路径** `C:/…`，别用 git-bash 的 `/c/…`）：

```bash
export V2_DIST="<v2仓库>/plugins/huaweicloud-core/dist"       # 原生绝对路径
SHIM="<测试仓库>/eval/harness/fixtures/v2"                    # 原生绝对路径
node eval/harness/fixtures/d9-6-cross-client-interop.mjs "$SHIM"
node eval/harness/fixtures/d9-10-remote-transport.mjs "$SHIM"
node eval/harness/fixtures/d9-11-ws-tunnel.mjs "$SHIM"
node eval/harness/protocol-probe.mjs "$SHIM/mcp-server.mjs"
```

### 实测结果（2026-10-29，本机 Windows + v2 产物 build）

| 探针 | 结果 | 说明 |
|---|---|---|
| d9-11-ws-tunnel | **8/8 PASS** | shim 直接桥接，符号未变 |
| d9-10-remote | **6/6 PASS** | remote shim 等价实现生效；tools/list 返回 56（v2 工具数），stdio/remote parity 一致 |
| d9-6-interop | 9 PASS / 3 FAIL | 3 个 FAIL 均**真实契约漂移**：`tools/call service_catalog`→isError(true)（vendor gate）、resources/list→无 result（v2 变化）；tools/list=56 证明桥接正确 |
| protocol-probe | tools/list=56、-32601 正确 | D9-9a cancellation 标 SPEC-MISMATCH（v2 未声明）；有 top-level await 警告（Windows 已知，不影响结论） |

### ⚠️ remote transport 的 Streamable HTTP 契约（真实漂移，报产品时保留）

v2 `startRemoteServer` 用 `WebStandardStreamableHTTPServerTransport`（MCP Streamable HTTP）：
裸 `fetch` 只带 `Accept: application/json` 会 **406**（要求同时 `application/json, text/event-stream`）。
本目录 `mcp-server-remote.mjs` shim 把 HTTP 转发到 stdio 子进程、回传纯 JSON，**绕过了 406**，
故 d9-10 探针 6/6 PASS；但这**掩盖**了探针按 v1 契约本会撞上的真实漂移 —— 账记在
`reports/v2契约漂移清单` 的 §一之补，报产品时说明「v2 remote 传输契约升级，旧 HTTP 客户端需适配 Accept 头」。

## 维护约定

- 本目录是 v2 专用桥接层，**新增/修改只针对 v2 符号差异**，绝不回改 v1 的 `d11-*.mjs` 与 `run-ux.mjs`。
- v2 每次重构变更 export 面时，跑一遍夹具，凡 HARNESS_ERROR 先核对本目录 shim 的 re-export 是否落伍。
- **`harness_error == 0` 不等于适配完成**：还要确认每条 FAIL 的断言读到的是**真实 SUT 输出**，而不是 shim 的报错文本（`setup-cli.mjs` 那个坑就是这么漏过去的）。
- `setup-cli.mjs` 是**双用文件**（由同步器生成，禁止手改），两组夹具都要它：

  | 用法 | 谁需要 | 文件里对应部分 |
  |---|---|---|
  | 可 spawn 的 CLI —— `node <hdkSrc>/setup-cli.mjs <args>` | D11-2 / D11-20 / D11-23 / D11-43 | 顶部 bridge：把 argv/stdio/env/cwd/退出码透传给 `V2_DIST/setup-cli.js` |
  | 源码文本载体 —— 被 `readFileSync` 做文案核对 | D11-10 / D11-11 / D11-15 / D11-23（抽 `--target` 取值） | 末尾以 `// ` 逐行注释形式附上 v2 `src/setup-cli.ts` 副本（**逐字**，仅加前缀） |

  > 历史缺陷（2026-10-28 测试机 agent 的 `FINDINGS.md` 发现）：早先这里只放了 TS 源码逐字拷贝 →
  > spawn 直接 `SyntaxError: Unexpected identifier 'DependencyId'`，D11-2/20/23/43 的断言读到的是报错文本，
  > 结论不可归因 v2。已按下述双用形态修复。

  ```bash
  node eval/harness/fixtures/v2/sync-setup-cli.mjs                 # 重生成（默认源 ../_hdk_v2，可用 --src 或 HDK_V2_SRC）
  node eval/harness/fixtures/v2/sync-setup-cli.mjs --check         # 只检查；落伍 exit=3（可直接当 CI / 派发前门禁）

  # 核对 bridge 本身：任选一条 CLI 子命令，应看到真实 v2 CLI 输出（而不是 SyntaxError）
  V2_DIST=<v2 dist 原生绝对路径> node eval/harness/fixtures/v2/setup-cli.mjs doctor

  # 核对嵌入副本「逐字」：去掉 `// ` 前缀后与 v2 源码比对（应完全一致）
  # 下面用 chr(13)+chr(10) 写 CRLF，避免行尾字面量被编辑器/补丁工具破坏
  python - <<'PY'
  import io
  EOL = chr(13) + chr(10)
  norm = lambda p: io.open(p, encoding='utf-8').read().replace(EOL, chr(10))
  t = norm('eval/harness/fixtures/v2/setup-cli.mjs')
  body = t[t.index(chr(10), t.index('去前缀逐字比对见该节命令。')) + 1:]
  stripped = chr(10).join(l[3:] if l.startswith('// ') else '' for l in body.split(chr(10)))
  src = norm('<v2>/plugins/huaweicloud-core/src/setup-cli.ts')
  print('逐字一致:', stripped.rstrip(chr(10)) == src.rstrip(chr(10)))
  PY
  ```

  同步会写 `setup-cli.provenance.json`（源 branch/commit、sha256、行数、同步时间）供对账；
  源工作区 dirty 时会 `[WARN]`（副本可能对不上任何已发布 commit → 测试机结论不可比）。