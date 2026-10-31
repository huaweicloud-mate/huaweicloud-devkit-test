# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-10-30-1.94.193.150-v2mig/Linux/FINDINGS.md`
> **生成时间**：2026-10-30 23:40（北京时间）
> **被测对象**：源仓库 v2 分支 `fcfe047f`（package.json 2.0.0，npm 未发布）
> **用例源**：`test-cases/versions/v2.0.0/` 迁移用例快照（设计级 212 + 展开级 57，本轮 `--version v2.0.0` 预演验证）
> **性质**：v2.0.0 迁移用例预演验证 —— 76 条迁移用例（vendor gate 64 + dispatch/remote/fake-move/rule/toolcount 12）已含 vendor gate 适配（步骤⓪ vendorConfirmed + 首次 challenge retry + 预期「gate 放行后」）

---

## #1【P0】D4-15 URL 编码操作绕过写操作检测（%44elete → allow）

- **现象**：`hcloud ECS %44elete%53ervers --server-id i-1` 与 `%44eleteS%65rver` 被分类为 `allow/unknown_read`，而原形 `DeleteServers` 与大小写变体 `deleteservers` 均被判 `deny/write`。
- **断言**：对操作 token 做 URL 解码后，`%44elete%53ervers` 应识别为 `DeleteServers` 并判 `deny/write`。
- **根因**：`plugins/huaweicloud-core/src/safety/classify-hcloud.ts:120`——`hasWritePrefix(operation, policy)` 在 `commandOperation(args)`（:51）取出的原始 operation token 上直接匹配，未做 `decodeURIComponent` 类 URL 解码，URL 编码的写操作前缀绕过均有。
- **影响**：安全红线 —— 攻击者/模型可用 URL 编码写操作 token（如 `%44elete` = `Delete`）绕过写操作 pre-check，直接抵达 hcloud 写 API；Python/Node 双 hook 均受影响。
- **证据**：`evidence/D4-15/stdout.log`（v2-runner D4-15 判定 + 手工复现 classify 输出）
- **状态**：待提单

## #2【P1】D10-3 / EXP-E01  serviceCatalog 路由残留 1 条 MISS（vendor gate 已放行，非 gate 引入）

- **现象**：`huaweicloud_service_catalog` 在 vendorConfirmed+challenge retry 放行后，15 条中文意图路由 HIT=13 / MISS=1 / N/A=1，准确率 92.9%。唯一 MISS = EXP-E01「查云主机（华北北京四）」期望 ECS，实际返回兜底话术 `Run hcloud --help to list available services.`
- **断言**：放行后「查云主机」应路由至 ECS 服务并非兜底话术。
- **根因**：历史关键词覆盖缺口（v1 亦 MISS，关联既有 issue #844 中文路由关键词覆盖不足）；`vendor-gate` 本身的 0%→92.9% 已由本轮迁移用例步骤⓪恢复，非 gate 引入。
- **影响**：路由准确率非 100%，「云主机」类无区域关键词的查询落到兜底话术。
- **证据**：`evidence/_probes/eval-harness.log`（HIT=13 MISS=1 N/A=1）
- **状态**：关联历史单（不重复开单）

## #3【P1】D8-9  telemetry installId sanitize 未移除 AK/SK/token 敏感值

- **现象**：`sanitizeValue` 能移除控制字符/超长截断/保留合法值，但未能从 installId 中剥离 `AK/SK/token` 形敏感值（契约要求移除）。
- **断言**：sanitize 应移除包含 AK/SK/token 形态的敏感值，避免明文凭证进入遥测 installId。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry-values.ts`（sanitizeValue 家族）缺 AK/SK/token 敏感 pattern 匹配。
- **影响**：遥测 installId 可能携带明文凭证片段，PII 泄露风险。
- **证据**：`evidence/D8-9/stdout.log` + `evidence/_probes/new-config.log`（D8-9 sanitize FAIL）
- **状态**：待提单

## #4【P1】D1-67  环境变量改名 + SKIP_DSH 跳过失效（与 1.x 契约漂移）

- **现象**：探针按 1.x 契约注入 `AGENT_TOOLKIT_MODE=local` 时未命中 v2 agent env；`SKIP_DSH=1` 未跳过 DSH 插件安装。
- **断言**：`AGENT_TOOLKIT_MODE`（或明确更名）应注入 agent env；`SKIP_DSH=1` 应跳过 DSH 插件。
- **根因**：v2 把 env 改名为 `HUAWEICLOUD_AGENT_TOOLKIT_MODE`（`plugins/huaweicloud-core/src/mcp-config-io.ts:156`、`mcp-config-merge.ts:139` `REQUIRED_ENV_KEYS`）；SKIP_DSH 分支在 v2 插件安装链路未保留原语义。
- **影响**：安装域环境注入/跳过开关行为与 1.x 用例契约漂移，需契约更新或补语义。
- **证据**：`evidence/D1-67/stdout.log` + `evidence/_probes/new-env.log`
- **状态**：待提单（契约漂移，定性为 SPEC 级）

## #5【P1】D3-S5  复合意图未拆分为多个 service

- **现象**：复合意图（存储+托管）在 serviceCatalog 路由中未拆分为多个 service，仅返回单一服务。
- **断言**：复合意图应命中多个 service（存储+托管）。
- **根因**：`huaweicloud_service_catalog` 路由层（vendor gate 放行后）对复合意图的单服务归约逻辑，缺多服务拆分。
- **影响**：复合部署意图路由不完整。
- **证据**：`evidence/D3-S5/stdout.log` + `evidence/_probes/new-scenario.log`
- **状态**：待提单

## #6【P1】D3-C14  hwlink createConnection 未走 x-security-token 签名头

- **现象**：`hdkitConnect` 透传参数、`hdkitCredentials` 校验、`getCredentials` 返回 `{ak,sk,securitytoken}` 均 OK，但 `createConnection` 未带 `x-security-token` 签名头。
- **断言**：hwlink createConnection 应使用 `x-security-token` 签名头。
- **根因**：`lib/hdkit/hwlink-api.js`（v2）createConnection 签名头生成分支缺失/未生效。
- **影响**：hwlink 连接握手签名不规范，真实云链接可能被拒绝。
- **证据**：`evidence/D3-C14/stdout.log` + `evidence/_probes/new-cloud.log`
- **状态**：待提单

## #7【P1】D4-25  hook 遥测事件未落盘（hook-events.jsonl 0 条）

- **现象**：`hook-events.jsonl` 共 0 条，new-safety-probe 读到 null 崩溃；写/删 hook deny 行为本身正常（D4-28 验证）。
- **断言**：PreToolUse hook 触发后应写入 hook-events.jsonl 遥测事件。
- **根因**：`plugins/huaweicloud-core/src/telemetry/hook-ingest.ts` / `telemetry.ts:97`（hookEventsPath）hook 事件落盘链路未触发（0 条）。
- **影响**：hook 审计/遥测事件缺失，无法回溯 hook 决策。
- **证据**：`evidence/D4-25/stdout.log` + `evidence/_probes/new-safety.log`
- **状态**：待提单

## #8【P2】D9-13  safety policy.version 为 undefined

- **现象**：`loadPolicy()` 返回的 policy 对象无 `version` 字段（`policy.version=undefined`），其余 classify/evaluateArtifacts/planHcloudCommand/tools-call 凭证不泄露等 8/9 项均 OK。
- **断言**：加载的安全策略应带有版本标识。
- **根因**：`plugins/huaweicloud-core/src/safety/policy.ts` 未导出/填充 version 字段。
- **影响**：策略版本标识缺位（轻微契约漂移，不影响 classify 正确性）。
- **证据**：`evidence/D9-13/stdout.log` + `evidence/_probes/d9-13.log`
- **状态**：测试侧/轻微契约漂移，可并入 #4 契约更新

---

## #9【测试侧】真云 D3-C1 自动归零时序缺陷（非产品缺陷）

- **现象**：D3-C1 建删核心 PASS（CreateVpc/CreateSubnet/CreateServers 审批 allow+serverIds/finally 归零），但 finally 归零因 ECS 异步删除 150s 轮询窗口不足报「仍在/未确认」，且 `DeleteSubnet/DeleteVpc 返回 OK` 实为假成功（因 ECS 仍挂载）。
- **说明**：测试侧 `realcloud_e2e.mjs` 归零时序缺陷（需加长轮询/增强删除后校验）。本轮已手动补删 ECS→子网→VPC 归零，仅遗留 1 条历史孤儿子网（timestamp 3308444841，VPC 已被历史轮次删除、vpc_id=None，平台级 stuck）。
- **证据**：真云 runner 输出 + 归零核查（ECS/VPC 归零）

## #10【非产品缺陷】沙箱用例 D3-C3/C6 维护期 BLOCKED（外部依赖）

- **现象**：`huaweicloud_sandbox_connect` 返回「HDKIT_SANDBOX_MAINTENANCE: 沙箱功能正在升级优化」。
- **说明**：沙箱账号/服务维护期外部依赖，非 v2 产品缺陷；恢复后补测。

## #11【非产品缺陷】真云 D3-S6/S7（FunctionGraph/RDS 实例创建）外部依赖

- **现象**：FG 创建 Python 函数未返回 URN、RDS 最小实例需 vpc/subnet/sg 前置环境。
- **说明**：真·外部依赖（账号配额/前置网络环境），非 v2 产品缺陷；D3-S6 路由命中 FG 与测后删除归零正常。

## #12【非产品缺陷】D10-1/2/5/9 真实 LLM Agent 会话评测缺 harness（BLOCKED）

- **说明**：需 DSH/CDP 会话自动化驱动真实 LLM，本机 Hermes 无 dsh 会话驱动（非 DSH 客户端）。