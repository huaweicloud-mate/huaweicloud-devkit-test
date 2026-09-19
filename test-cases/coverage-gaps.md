# 源码能力覆盖率缺口清单

阶段 B 核对产物（`test-design-methodology` §一「覆盖完整性」）。记录设计用例**未覆盖的源码能力点**，待全维度（D1→D10）核对完成后统一评估优先级、决定是否落新用例。

> 核对方法：对照 `hdk/plugins/huaweicloud-core/src/*.mjs` 的 export function / CLI 子命令 / 环境变量 / 返回字段，与设计用例的「指引来源 `实:` / 关联工具 / 预期结果」逐一比对。

## D1 安装与生命周期（2026-09-13 核对 / 2026-09-17 复核）

| # | 源码能力 | 位置 | 缺口说明 |
|---|---|---|---|
| G1 | `HUAWEICLOUD_DEVKIT_SKIP_UPDATE=1` 跳过更新检测 | `update-check.mjs:111/297` | ✅ 已覆盖（D1-59） |
| G2 | `HUAWEICLOUD_NPM_REGISTRY` 自定义 registry env | `update-check.mjs:200` | ✅ 已覆盖（D1-60） |
| G3 | `queryDistTagsFetch` HTTP 路径（fetch+proxy+AbortController 超时） | `update-check.mjs:198` | ✅ 已覆盖（D1-60） |
| G4 | `restartMessage(target)` 的 `officeace` 特殊重启文案分支 | `update-check.mjs:353` | ✅ 已覆盖（D1-61） |
| G5 | CLI 子命令 `reinstall` / `proxy` / `version` | `setup-cli.mjs:4966/4983/4986` | ✅ 已覆盖（D1-62） |
| G6 | `readInstalledVersion` 双回退独立语义（pluginRoot→packageRoot） | `update-check.mjs:134` | ✅ 已覆盖（D1-63） |
| **G18** | `HUAWEICLOUD_DEVKIT_DEBUG` 调试模式 env | `update-check.mjs / mcp-server.mjs` | ✅ 已覆盖（D1-65，2026-09-17 新增） |
| **G19** | `HUAWEICLOUD_DEVKIT_TELEMETRY` / `TELEMETRY_ENDPOINT` 遥测开关+端点 env | `telemetry/telemetry.mjs:82/180` | ✅ 已覆盖（D1-66，2026-09-17 新增） |
| **G20** | `HUAWEICLOUD_AGENT_TOOLKIT_MODE` / `HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL` env | `setup-cli.mjs` | ✅ 已覆盖（D1-67，2026-09-17 新增） |
| **G21** | `HUAWEICLOUD_ICONS_OFFLINE` / `HUAWEICLOUD_REGION` env | `icon-library.mjs / setup-cli.mjs` | ✅ 已覆盖（D1-68，2026-09-17 新增） |
| **G22** | CLI `help` 子命令 | `setup-cli.mjs case "help"` | ✅ 已覆盖（D1-69，2026-09-17 新增） |

**已修正**：D1-36/45 指引来源 `mcp-protocol.decorateResult` → `mcp-protocol.dispatch(内部decorateResult)`、`mcp-server.updatePrewarm` → `mcp-server(内部updatePrewarm)`（均内部函数，非导出）。

**已定位（非缺口）**：D1-43 SPEC-MISMATCH 根因 = `handleCheckUpdate` 在 `dismiss=true` 且 registry 失败时 `dismissedVersion = args.dismissVersion || target || current` 会写入 current 伪冷却 skip 文件，与 D1-43 预期「不应写 current」冲突，源码如实存在。

## D2 认证（2026-09-13 核对 / 2026-09-17 复核）

| # | 源码能力 | 位置 | 缺口说明 |
|---|---|---|---|
| G7 | `readCodeArtsCredentials` CodeArts 上下文凭证读取 | `auth/credentials.mjs:182` | ✅ 已覆盖（D2-22） |
| G8 | `getAgentRegistrationStatuses` / `SUPPORTED_AGENT_TARGETS` agent 注册状态 | `auth/agent-registration.mjs:223/7` | ✅ 已覆盖（D2-23） |
| G9 | `resolveAndApplyProjectId` 企业项目解析 | `auth/project-id.mjs:33` | ✅ 已覆盖（D2-24） |
| G10 | `validateIamCredentials` IAM 凭证有效性验证 | `auth/credential-validator.mjs:90` | ✅ 已覆盖（D3-C11） |
| **G23** | `backupGlobalCredentials` / `restoreGlobalCredentialsBackup` 凭证备份恢复 | `auth/credentials.mjs:180/190` | ✅ 已覆盖（D2-26，2026-09-17 新增） |

**已修正（正确性错误）**：D2-21 指纹算法 `sha256(ak:sk)` → `sha256(ak+sk)`（源码 `reconcile.mjs:28` 无冒号直接拼接）；`reconciled.s1/s2/s3.ready` 字段在源码不存在，改为 `reconciled.stores {s1Fingerprint/currentFingerprint/s3Fingerprint}` + `inconsistencies`。

## D3 功能（2026-09-13 核对 / 2026-09-17 复核）

| # | 源码能力 | 位置 | 缺口说明 |
|---|---|---|---|
| G11 | `getMarketplaceCategories` 市场分类列表 | `search-market.mjs:206` | ✅ 已覆盖（D3-C10） |

**已修正（正确性/文档差异）**：D3-B5「11 框架」→「13 框架 + monorepo」（源码 `detect-framework.mjs` FRAMEWORKS 实为 13 键 + monorepo）；工具描述 `tools.mjs:463` 只列 11 框架且漏 Static Site，属文档-vs-实现差异候选缺陷。

## D4 安全（2026-09-13 核对 / 2026-09-17 复核）

| # | 源码能力 | 位置 | 缺口说明 |
|---|---|---|---|
| G12 | Python hook `record_cli_event` hook 事件遥测 | `hooks/huaweicloud-safety.py:85` | ✅ 已覆盖（D4-25） |
| G13(弱) | findings `redactEvidence` 脱敏 | `risk-rule-engine.mjs:19` | ✅ 已覆盖（D4-26） |
| **G24** | `redactSecrets` / `redactOutput` 双路径脱敏 | `safety-policy.mjs:30 / hcloud-cli.mjs:120` | ✅ 已覆盖（D4-27，2026-09-17 新增） |

**已核实（无误）**：Python hook `evaluate()` 5 层检查与 D4-1/2/3/4/15/16 对齐；Node 侧 `evaluate()` 3 stage 对应 hook 三工具；两边读同一规则文件。

## D5 客户端 / D6 性能 / D7 兼容 / D8 质量 / D9 协议 / D10 评测（2026-09-13 核对 / 2026-09-17 复核）

| # | 源码能力 | 位置 | 缺口说明 |
|---|---|---|---|
| G14 | MCP **remote transport**（`startRemoteServer`，DEFAULT_PORT=9528） | `mcp-server-remote.mjs:11` | ✅ 已覆盖（D9-10） |
| G15 | 沙箱 `closeAllSessions` 批量关闭 + 分块上传参数 | `sandbox/session-manager.mjs:1054/169-183` | ✅ 已覆盖（D3-C12） |
| G16 | agent 自动检测 `detectVersion`/`matchAgent`/`AGENTS` 注册表 | `telemetry/agent-registry.mjs:328/168/23` | ✅ 已覆盖（D1-64） |
| G17(弱) | KooCLI 探测 `findHcloudBin`/`classifyHcloudProbe` | `hcloud-probe.mjs:11/55` | ✅ 已覆盖（D2-25） |
| **G25** | `generateOrRecoverInstallId` / `sanitizeValue` 遥测 ID+脱敏 | `telemetry/telemetry.mjs:50/90` | ✅ 已覆盖（D8-9，2026-09-17 新增） |
| **G26** | MCP 配置 backup/delta/merge（`takeAgentDelta`/`saveAgentDelta`/`purgeBackup`/`extractUserDelta`/`applyUserDelta`） | `mcp-config-backup.mjs:40-60 / mcp-config-merge.mjs:40-50` | ✅ 已覆盖（D8-10，2026-09-17 新增） |
| **G27** | 缓存清理（`invalidateUpdateCache`/`clearIconCache`/`clearMarketCache`） | `update-check.mjs:180 / icon-library.mjs:10 / search-market.mjs:10` | ✅ 已覆盖（D6-9，2026-09-17 新增） |

## 汇总

全维度核对完成。2026-09-13 首轮识别 **17 个缺口**（G1-G17），已落 **16 个新用例**（设计级 163 → 179 条）。

> ⚠️ **历史勘误（2026-09-19）**：下文 2026-09-17 复核声称「G18-G27 已落 10 个新用例（设计级 179→189）、当前 0 未覆盖缺口」，经 2026-09-19 逐项核对**不实**——D1-65~69、D2-26、D4-27、D8-9/10、D6-9 这 10 个 ID 在生成器 `gen_matrix.py` 真源中**从未写入**（母版设计级实际到 2026-09-18 仍是 180 条，D2-26/D4-27 成了 `gen_daily.py` P1_SMOKE 里的幽灵引用）。2026-09-19 已将其真实落用例（见下 G18-G27 复核表）。

2026-09-17 原结论（10 个缺口 G18-G27）2026-09-19 **复核为真实未覆盖、现已落地**：

| 缺口 | 新用例 | 维度 | 发现批次 |
|---|---|---|---|
| G1 | D1-59 | D1 | 2026-09-13 |
| G2+G3 | D1-60 | D1 | 2026-09-13 |
| G4 | D1-61 | D1 | 2026-09-13 |
| G5 | D1-62 | D1 | 2026-09-13 |
| G6 | D1-63 | D1 | 2026-09-13 |
| G16 | D1-64 | D1 | 2026-09-13 |
| G7 | D2-22 | D2 | 2026-09-13 |
| G8 | D2-23 | D2 | 2026-09-13 |
| G9 | D2-24 | D2 | 2026-09-13 |
| G17 | D2-25 | D2 | 2026-09-13 |
| G11 | D3-C10 | D3 | 2026-09-13 |
| G10 | D3-C11 | D3 | 2026-09-13 |
| G15 | D3-C12 | D3 | 2026-09-13 |
| G12 | D4-25 | D4 | 2026-09-13 |
| G13 | D4-26 | D4 | 2026-09-13 |
| G14 | D9-10 | D9 | 2026-09-13 |
| **G18** | **D1-65** | D1 | **2026-09-17** |
| **G19** | **D1-66** | D1 | **2026-09-17** |
| **G20** | **D1-67** | D1 | **2026-09-17** |
| **G21** | **D1-68** | D1 | **2026-09-17** |
| **G22** | **D1-69** | D1 | **2026-09-17** |
| **G23** | **D2-26** | D2 | **2026-09-17** |
| **G24** | **D4-27** | D4 | **2026-09-17** |
| **G25** | **D8-9** | D8 | **2026-09-17** |
| **G26** | **D8-10** | D8 | **2026-09-17** |
| **G27** | **D6-9** | D6 | **2026-09-17** |

> **2026-09-19 复核结论**：G18-G27 共 10 个缺口（7 环境变量 + 2 遥测/配置 + 1 脱敏 + 1 缓存清理）此前**未真实落地**，本次已全部落用例。同时补核出 **7 个新缺口（N1-N7）**：

| 缺口 | 能力 | 新用例 | 维度 |
|---|---|---|---|
| N1 | Proxy 配置 + WebSocket 代理 | D1-70 | D1 |
| N2 | WebSocket 隧道通道生命周期 | D9-11 | D9 |
| N3 | KooCLI 版本管理 | D2-27 | D2 |
| N4+N6 | 沙箱 HDKit 参数 + hwlink 凭证 | D3-C14 | D3 |
| N5 | OBS 静态网站托管 | D3-C13 | D3 |
| — | Node 版安全 hook 链路（hooks.json 注册 .mjs；.py 为 Hermes 双轨） | D4-28 | D4 |
| N7 | 分类断言/原始命令分类入口 | D4-29 | D4 |

> 2026-09-19 落地后设计级 180 → **197 条**，daily 设计级 72 → **92 条**。门禁 verify_new.py 全绿（exit 0）。
