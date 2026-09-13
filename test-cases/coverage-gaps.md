# 源码能力覆盖率缺口清单

阶段 B 核对产物（`test-design-methodology` §一「覆盖完整性」）。记录设计用例**未覆盖的源码能力点**，待全维度（D1→D10）核对完成后统一评估优先级、决定是否落新用例。

> 核对方法：对照 `hdk/plugins/huaweicloud-core/src/*.mjs` 的 export function / CLI 子命令 / 环境变量 / 返回字段，与设计用例的「指引来源 `实:` / 关联工具 / 预期结果」逐一比对。

## D1 安装与生命周期（2026-09-13 核对）

| # | 源码能力 | 位置 | 缺口说明 |
|---|---|---|---|
| G1 | `HUAWEICLOUD_DEVKIT_SKIP_UPDATE=1` 跳过更新检测 | `update-check.mjs:111/297` | 完全未覆盖 |
| G2 | `HUAWEICLOUD_NPM_REGISTRY` 自定义 registry env | `update-check.mjs:200` | 完全未覆盖 |
| G3 | `queryDistTagsFetch` HTTP 路径（fetch+proxy+AbortController 超时） | `update-check.mjs:198` | 未覆盖（D1-39/40 只测 spawn/npm 路径） |
| G4 | `restartMessage(target)` 的 `officeace` 特殊重启文案分支 | `update-check.mjs:353` | 未覆盖 |
| G5 | CLI 子命令 `reinstall` / `proxy` / `version` | `setup-cli.mjs:4966/4983/4986` | 未覆盖（D1 只测 install/uninstall/update/status/doctor/install-hcloud） |
| G6 | `readInstalledVersion` 双回退独立语义（pluginRoot→packageRoot） | `update-check.mjs:134` | 弱缺口（仅被 upgrade 间接用，无直接断言） |

**已修正**：D1-36/45 指引来源 `mcp-protocol.decorateResult` → `mcp-protocol.dispatch(内部decorateResult)`、`mcp-server.updatePrewarm` → `mcp-server(内部updatePrewarm)`（均内部函数，非导出）。

**已定位（非缺口）**：D1-43 SPEC-MISMATCH 根因 = `handleCheckUpdate` 在 `dismiss=true` 且 registry 失败时 `dismissedVersion = args.dismissVersion || target || current` 会写入 current 伪冷却 skip 文件，与 D1-43 预期「不应写 current」冲突，源码如实存在。

## D2 认证（2026-09-13 核对）

| # | 源码能力 | 位置 | 缺口说明 |
|---|---|---|---|
| G7 | `readCodeArtsCredentials` CodeArts 上下文凭证读取 | `auth/credentials.mjs:182`（`resolveCredentials` 的 `isCodeArtsContext` 分支 + `tools.mjs:1151`） | 未覆盖（D2 用例全在非 CodeArts 上下文） |
| G8 | `getAgentRegistrationStatuses` / `SUPPORTED_AGENT_TARGETS` agent 注册状态 | `auth/agent-registration.mjs:223/7` | 未覆盖（11 安装目标注册状态无直接断言） |
| G9 | `resolveAndApplyProjectId` 企业项目解析 | `auth/project-id.mjs:33`（`service.mjs:105` + `setup-cli.mjs:4703` 调用） | 未覆盖（D2 无 project-id 用例） |
| G10 | `validateIamCredentials` IAM 凭证有效性验证 | `auth/credential-validator.mjs:90`（`tools.mjs:1400` 沙箱注入前调用） | 未覆盖（归 D3 沙箱维度追踪） |

**已修正（正确性错误）**：D2-21 指纹算法 `sha256(ak:sk)` → `sha256(ak+sk)`（源码 `reconcile.mjs:28` 无冒号直接拼接）；`reconciled.s1/s2/s3.ready` 字段在源码不存在，改为 `reconciled.stores {s1Fingerprint/currentFingerprint/s3Fingerprint}` + `inconsistencies`。

## D3 功能（2026-09-13 核对）

| # | 源码能力 | 位置 | 缺口说明 |
|---|---|---|---|
| G11 | `getMarketplaceCategories` 市场分类列表 | `search-market.mjs:206` | 未覆盖（D3-A6 只测 search_marketplace/get_service_icon） |

**已修正（正确性/文档差异）**：D3-B5「11 框架」→「13 框架 + monorepo」（源码 `detect-framework.mjs` FRAMEWORKS 实为 13 键 + monorepo）；工具描述 `tools.mjs:463` 只列 11 框架且漏 Static Site，属文档-vs-实现差异候选缺陷。

## D4 安全（2026-09-13 核对）

| # | 源码能力 | 位置 | 缺口说明 |
|---|---|---|---|
| G12 | Python hook `record_cli_event` hook 事件遥测（`hook-events.jsonl`，cli:read/write/invoke 三键分类） | `hooks/huaweicloud-safety.py:85` | 无直接断言（D8-8 仅测「上报」，未测 cli:read/write/invoke 分类） |
| G13(弱) | findiings `redactEvidence` 脱敏（AK/SK/token/password） | `risk-rule-engine.mjs:19` | 无直接断言（D4-6 只测 adminPass 回显） |

**已核实（无误）**：Python hook `evaluate()` 5 层检查（credentialFilePatterns/ENV_DUMP/blockedSecretOperations/cloud-risk-rules deny/write-operation）与 D4-1/2/3/4/15/16 对齐；Node 侧 `evaluate()` 3 stage（command/artifact/deploy_plan）对应 hook 三工具；两边读同一规则文件 `safety/rules/cloud-risk-rules.json`，印证 D4-8 双路径一致。

## D5 客户端 / D6 性能 / D7 兼容 / D8 质量 / D9 协议 / D10 评测（2026-09-13 核对）

| # | 源码能力 | 位置 | 缺口说明 |
|---|---|---|---|
| G14 | MCP **remote transport**（`startRemoteServer`，DEFAULT_PORT=9528，HTTP/WS 远程服务） | `mcp-server-remote.mjs:11`（`mcp-server.mjs:56` 按 `--transport remote` 分支） | 完全未覆盖（D9 只测 stdio 路径） |
| G15 | 沙箱 `closeAllSessions` 批量关闭 + 分块上传参数（`UPLOAD_CHUNK_SIZE=30000`/`BATCH_SIZE=2`/`MAX_RETRIES=3`/`splitBase64Chunks`） | `sandbox/session-manager.mjs:1054/169-183` | 无直接断言（D3-C3/C6 只测单会话 close + 上传，D6-5 测大上传但未断言分块参数） |
| G16 | agent 自动检测 `detectVersion`/`matchAgent`/`AGENTS` 注册表（`agent-registry.mjs:328/168/23`） | `telemetry/agent-registry.mjs` + `agent-detect.mjs:15` | 部分覆盖（D1-2 auto-detect 只测探测，未测版本检测/注册表匹配） |
| G17(弱) | KooCLI 探测 `findHcloudBin`/`classifyHcloudProbe`（探测状态分类 sandbox_home_failure/privacy_pending 等） | `hcloud-probe.mjs:11/55` | 间接覆盖（D2 auth_sync 分支用到探测状态，无独立断言） |

## 汇总

全维度核对完成，共 **17 个缺口**（G1~G17），硬缺口（完全未覆盖的独立能力）：G1~G5、G7~G9、G11、G14；弱缺口（仅间接覆盖/无直接断言）：G6、G10、G12、G13、G15、G16、G17。待统一评估落用例。