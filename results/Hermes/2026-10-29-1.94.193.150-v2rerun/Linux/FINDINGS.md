# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-10-29-1.94.193.150-v2rerun/Linux/FINDINGS.md`
> **生成时间**：2026-10-29 14:05（北京时间）
> **被测对象**：源仓库 v2 分支 `fcfe047f`（package.json 2.0.0，npm 未发布）
> **性质**：干净重跑（node v26.8.1 + 全局包 2.0.0，无 27 号首轮的环境瑕疵），结论与 27 号一致

---

## #1【P0】D10-3 / EXP-E01~E15  serviceCatalog 新增 vendor gate 导致路由全部 MISS

- **现象**：未传 `vendorConfirmed` 时 `huaweicloud_service_catalog` 返回 vendor gate 提示而非路由推荐，eval 15 条全部 MISS（准确率 0.0%）。
- **断言**：传 vendorConfirmed 并通过 challenge 后应返回 `recommendedServices`。
- **根因**：`plugins/huaweicloud-core/src/vendor-gate.ts:59/78/94`——v2 新增「厂商确认门 + 首次 challenge」机制。
- **影响**：eval 集 / 场景路由用例失效；测试契约需按新机制更新。
- **证据**：`evidence/_probes/eval-harness.log`（HIT=0 MISS=14 N/A=1）
- **状态**：待提单

## #2【P0】D9-12  mcp-protocol 导出 `dispatch` API 已删除

- **现象**：`mp.dispatch is not a function`，P0 握手安全基线探针崩溃。
- **断言**：协议层应提供可驱动的握手/分派原语。
- **根因**：`mcp-protocol.ts:220/259/378`——`dispatch` 重构为 `createDevkitMcpServer`/`createLinkedDevkitServers`/`runInitializeSideEffects`。
- **影响**：D9-12 失效，下游需按新 API 改写。
- **证据**：`evidence/_probes/d9-12.log`
- **状态**：待提单

## #3【P1】D4-5  huaweicloud_plan_cli_command 被 vendor gate 拦截

- **现象**：未传 vendorConfirmed 时返回 gate 提示，`classification.decision/risk/safeToRun` 为空。
- **根因**：同 #1（vendor-gate.ts），`plan_cli_command` 属 cloud-facing 工具。
- **影响**：D4-5 写操作分类失效；连锁影响真云 approve 链路。
- **证据**：`evidence/_probes/hook.log`
- **状态**：待提单

## #4【P1】D9-10/D9-11  mcp-server-remote 探针入口失配

- **现象**：`ERR_MODULE_NOT_FOUND dist/mcp-server-remote.mjs`。
- **根因**：`mcp-server-remote.ts` 仍是 remote HTTP 服务（startRemoteServer、DEFAULT_PORT=9528），但依赖换成 `createDevkitMcpServer`，且 build 后无独立 .mjs 产物；探针仍按 v1 路径找 `mcp-server-remote.mjs`。
- **影响**：D9-10/D9-11 探针入口需按 v2 适配。
- **证据**：`evidence/_probes/new-mcp.log`
- **状态**：待提单

## #5【P1】D1-65  update-check DEBUG 开关迁移（契约迁移）

- **现象**：v1 的 `update-check.mjs` DEBUG 开关消失。
- **根因**：DEBUG 迁至 `update-registry.ts:44`（'1'||'true'）+ `telemetry/telemetry.ts:143`（==='true'）。
- **影响**：用例/探针契约需更新（SPEC-MISMATCH）。
- **证据**：`evidence/_probes/new-env.log`
- **状态**：待提单

## #6【P1】D1-66  telemetry 端点环境变量改名

- **现象**：`getEndpoint/DEFAULT_ENDPOINT` 位置与变量名变化。
- **根因**：`telemetry/event-pipeline.ts:18/24`，环境变量改 `HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT`。
- **影响**：用例契约需更新（SPEC-MISMATCH）。
- **证据**：`evidence/_probes/new-env.log`
- **状态**：待提单

## #7【P2】D10-4  安全规则集 16→19 条（纯新增，无降级，测试侧契约未更新）

- **现象**：探针断言「规则库 16 条(9 deny+7 warn)」，实际 v2 `规则数=19 severity={"deny":9,"warn":10}`。
- **断言**：规则库完整加载 19 条（9 deny + 10 warn）。
- **根因**：`safety/rules/cloud-risk-rules.json`——纯新增 3 条 warn（`hwc-command-adminpass-exposure`、`hwc-command-secret-in-arg`、`hwc-iam-highrisk-write`），**无删除、无 severity 调整**（destructive-delete 家族 5 条与 v1 完全一致）。
- **影响**：安全能力增强，属测试侧断言未更新，非产品缺陷。
- **证据**：`evidence/_probes/new-safety.log`（规则数=19）
- **状态**：测试侧

## #8【测试侧】真云 E2E：D3-C1 自动归零时序缺陷 + D3-C6/C3 沙箱 BLOCKED

- **现象**：D3-C1 建删核心功能 PASS，但探针「finally 归零」的 ECS 异步删除 150s 轮询窗口内未确认归零（实际残留，已手动补救归零）；D3-C6/C3 因沙箱账号未实名 BLOCKED。
- **说明**：D3-C1 归零时序是测试侧缺陷（需加长轮询/增强校验）；沙箱为外部依赖。均非 v2 产品缺陷。
- **证据**：真云 runner 输出 + 归零核查（ECS/VPC/子网/EIP/OBS 全 0 残留）
- **状态**：测试侧