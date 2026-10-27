# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-10-27-1.94.193.150-v2full/Linux/FINDINGS.md`
> **生成时间**：2026-10-27 21:05:00（北京时间）
> **被测对象**：源仓库 v2 分支 `fcfe047f`（package.json 2.0.0，npm 未发布；全面 TypeScript 重构）
> **测试范围**：母版全量用例（设计级 212 + 展开级 57，下发 269 条），42 批探针执行（非真云部分）

---

## #1【P0】D10-3 / EXP-E01~E15  serviceCatalog 新增 vendor gate 导致路由全部 MISS

- **现象**：`huaweicloud_service_catalog` 在未传 `vendorConfirmed` 参数时，返回「Vendor gate: this tool operates on Huawei Cloud. Pass vendorConfirmed...」而非服务路由推荐。eval harness 15 条中文意图全部 MISS（准确率 0.0%，v1 基线 78.6% HIT）；D3-S1/S5/S6/S7 的路由断言同样 FAIL。
- **断言**：serviceCatalog 接收意图后应返回 `recommendedServices`（命中 ECS/OBS/EIP/RDS 等对应服务）。
- **根因**：`plugins/huaweicloud-core/src/vendor-gate.ts:94`（`const quote = args.vendorConfirmed;`）+ 第 59/78 行 gate/challenge 提示——v2 新增「厂商确认门」，要求 agent 先引用用户确立华为云的原文才放行路由，否则返回空推荐。eval/harness 与场景探针均未传 `vendorConfirmed`，故全 MISS。
- **影响**：所有依赖 serviceCatalog 自动路由的用例（D10-3 评测集、D3 场景路由）在 v2 下失效；真实 agent 会话需先建立 vendor 确认。
- **证据**：`evidence/_probes/eval-harness.log`（HIT=0 MISS=14 N/A=1）、`evidence/_probes/routing.log`
- **状态**：待提单

## #2【P0】D9-12  mcp-protocol 导出 `dispatch` API 已删除（协议层重构）

- **现象**：D9-12 探针 `mp.dispatch('initialize', ...)` 抛 `TypeError: mp.dispatch is not a function`（Node 直接崩溃，exit=1）。
- **断言**：mcp-protocol 应导出可驱动的 `dispatch` 方法用于 initialize/tools/call 分派。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.ts`——v2 将单一 `dispatch` 重构为 `createDevkitMcpServer` / `createLinkedDevkitServers` / `runInitializeSideEffects` / `normalizeToolCallParams` 等工厂函数与细粒度原语，`dispatch` 已删除。
- **影响**：initialize 握手协议安全基线（P0）探针无法执行；依赖旧协议 API 的下游/探针需改写到新 API。
- **证据**：`evidence/_probes/d9-12.log`（`mp.dispatch is not a function`）
- **状态**：待提单

## #3【P1】D4-5  huaweicloud_plan_cli_command 被 vendor gate 拦截（返回空 classification）

- **现象**：对 `ecs DeleteServer --server_id x` 等 4 类命令调用 `plan_cli_command`（未传 `vendorConfirmed`），返回的是 vendor gate 提示文本而非 plan 结果，探针读到的 `classification.decision / risk / safeToRun` 全部 `undefined`。
- **断言**：plan_cli_command 应返回含 `classification.decision`（allow/deny/warn）与 `approvalToken`、`safeToRun` 的结果。
- **根因**：`plugins/huaweicloud-core/src/vendor-gate.ts:59/94`——与 #1 同一根因：`plan_cli_command` 属 cloud-facing 工具，未传 `vendorConfirmed` 即被 gate 拦截（返回提示文本，非 plan JSON）；带 `vendorConfirmed` 后首次调用还会触发 `vendor-gate.ts:78` 的 challenge（要求 retry 一次）。`hcloud-plan.ts` 本身仍返回 `classification/approvalToken/safeToRun`，结构未变。
- **影响**：D4-5 写操作分类按钮无法判定；且**连锁阻塞真云 E2E 的 approve 审批链路**（`realcloud_e2e.mjs` 依赖 `plan.classification.decision === 'allow'` 触发 run_approved，被 gate 拦截后无法建删资源，见 #8）。
- **证据**：`evidence/_probes/hook.log`（CASE D4-5：decision=undefined）、`/tmp/verify-vendor-gate.mjs` 验证输出
- **状态**：待提单（与 #1 合并）

## #4【P1】D9-10/D9-11  MCP remote transport 入口移除

- **现象**：new-mcp-probe `import .../dist/mcp-server-remote.mjs` 抛 `ERR_MODULE_NOT_FOUND`。
- **断言**：应存在 MCP remote（HTTP）transport 独立入口。
- **根因**：`plugins/huaweicloud-core/src/` 下 remote 入口重构——v1 的 `mcp-server-remote.mjs` 在 v2 无独立产物，远程执行改为 `ws-exec/`（WebSocket）架构（`ws-exec/index.ts` 等）。
- **影响**：D9-10/D9-11 远程传输用例无法执行；remote transport 形态变化需重写用例/探针。
- **证据**：`evidence/_probes/new-mcp.log`（ERR_MODULE_NOT_FOUND dist/mcp-server-remote.mjs）
- **状态**：待提单

## #5【P1】D1-65  update-check DEBUG 开关逻辑拆分后失配

- **现象**：D1-65 断言 `update-check '1'=false 'true'=false`（期望支持 `DEBUG='1'` 或 `'true'` 开启），实际 v2 无法判定。
- **断言**：更新检查域应支持 `DEBUG='1'` 与 `DEBUG='true'` 两种开启方式。
- **根因**：`plugins/huaweicloud-core/src/update-check.ts`——v1 单文件 `update-check.mjs` 拆分为 `update-cache/check/hint/installed/registry/semver/skip/upgrade` 8 文件，DEBUG 开关判断逻辑被重构/迁移。
- **影响**：调试开关行为变化，需确认 v2 的 DEBUG 契约。
- **证据**：`evidence/_probes/new-env.log`（CASE D1-65: update-check.js DEBUG 判断 undefined）
- **状态**：待提单

## #6【P1】D1-66  telemetry getEndpoint/DEFAULT_ENDPOINT 重构后消失

- **现象**：D1-66 断言 `getEndpoint 未设回退 DEFAULT_ENDPOINT` 失败，探针读到 `DEFAULT_ENDPOINT: undefined、getEndpoint(): undefined`。
- **断言**：telemetry 应导出 `getEndpoint()` 且未设时回退 `DEFAULT_ENDPOINT`。
- **根因**：`plugins/huaweicloud-core/src/telemetry/`——v1 单文件 `telemetry.mjs` 拆分为 `telemetry-fs/telemetry-types/telemetry-values/telemetry` 等多文件，导出面重构。
- **影响**：遥测端点配置逻辑变化，需确认 v2 契约。
- **证据**：`evidence/_probes/new-env.log`（CASE D1-66）
- **状态**：待提单

## #7【P2】D10-4  安全规则集 16→19 条（v2 增强，测试契约需更新）

- **现象**：new-safety 探针断言「规则库完整 16 条(9 deny + 7 warn)」失败，实际 v2 规则库 `version=0.1.0 规则数=19 severity={"deny":9,"warn":10}`。
- **断言**：安全规则库应含 16 条（9 deny + 7 warn）。
- **根因**：`plugins/huaweicloud-core/src/safety/`（default-policy/risk-rule-engine）——v2 新增 `hwc-command-secret-in-arg`、`hwc-sandbox-destructive-command` 等 3 条规则，并调整部分 severity（如 destructive-delete-operation deny→warn）。
- **影响**：安全能力增强，非缺陷；D10-4 用例与探针断言需随 v2 规则集更新。
- **证据**：`evidence/_probes/new-safety.log`（规则清单 19 条）
- **状态**：测试侧（契约更新，非产品缺陷）

## #8【测试侧】D3-S2/C13/C14/S3/S6/S7  真云 E2E 需真云批次执行

- **现象**：D3-S2「测试 VPC 创建成功/plan DeleteVpc 要求确认/确认后删除归零」、D3-C14「createConnection x-security-token 签名头」、D3-S6「创建 Python 函数返回 URN」、D3-S7「RDS API 只读可达」等在非真云批次 FAIL；D3-S3 沙箱 check_user 因「沙箱账号未实名」探针自标 BLOCKED。
- **说明**：这些是真云 E2E（建删 VPC/函数/RDS 等），需在真云批次（AK/SK + 只读子账号就绪）单独执行并归零验证，非 v2 代码缺陷。
- **证据**：`evidence/_probes/new-cloud.log`、`new-fg-rds.log`、`new-scenario.log`
- **状态**：BLOCKED（待真云批次）