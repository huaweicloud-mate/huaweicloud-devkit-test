# FINDINGS — 缺陷发现清单（OpenCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenCode/2026-11-28-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：2026-11-28 05:10:00（北京时间）
> **被测版本**：huaweicloud-devkit `2.0.1-next.1`（npm @next）

---

## #1【P0】D4-16 命令包裹穿透（sh -c 内层凭证 dump 未拦截）

- **现象**: `evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` 返回 `{decision:'allow', findings:[]}`；而裸形式 `env | grep HW_ACCESS_KEY` 会命中 `hwc-command-env-dump` 返回 `deny`。用 `sh -c "..."` 包裹即穿透风险规则。
- **断言**: 包裹命令内层凭证环境变量 dump 应被识别并 `deny`（`decision === 'deny'`）。
- **根因**: `plugins/huaweicloud-core/dist/risk-rule-engine.js:200`（`evaluateCommandRisk`）直接对整串命令做 stage 匹配，未对 `sh -c`/`eval` 等 shell 包裹做解壳（`safety/unwrap.js` 的 `stripExecutable` 未接入风险引擎），导致内层 `env | grep HUAWEICLOUD_ACCESS_KEY` 无法命中 `hwc-command-env-dump`。
- **影响**: 攻击者可借包裹绕过凭证环境变量读取拦截（安全红线）。
- **证据**: `evidence/D4-16/stdout.log`
- **状态**: 待提单

## #2【P0】D4-21 hook_check_artifacts 对 HCL/IaC broad IAM 制品降级为 warn（未 deny）

- **现象**: `evaluateArtifacts([{content:'resource "huaweicloud_iam_policy" "p" { actions = ["*"] }'}])` 返回 `decision:'warn'`（命中 `hwc-iam-wildcard-action` warn）；同样语义的 JSON 形态 `{"Action":"*","Resource":"*"}` 返回 `deny`。
- **断言**: broad IAM（Effect=Allow + Action=* + Resource=*）在 JSON 与 HCL 两种形态都应 `deny`。
- **根因**: `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:289` 中 `hwc-iam-admin-policy`（deny）的条件仅匹配 JSON IAM policy 形态，HCL/Terraform `huaweicloud_iam_policy` 资源的 `actions=["*"]` 未映射到该 deny 规则，只命中 `hwc-iam-wildcard-action`（warn）。
- **影响**: IaC 制品中的管理员级通配授权预检强度下降，风险未升级到拦截级。
- **证据**: `evidence/D4-21/stdout.log`
- **状态**: 待提单

## #3【P0】D9-12 initialize 握手协议安全基线（未 initialize 先 tools/list 不拒绝）

- **现象**: 未发送 `initialize` 直接 `tools/list`，服务端返回全部 40 个工具列表（而非 `-32600` 非法时序错误）。
- **断言**: 未 initialize 先 tools/list 应返回 `-32600`（Invalid Request）。
- **根因**: `plugins/huaweicloud-core/dist/mcp-stdio-transport.js:168` 仅对 `initialize` 方法做显式分支，其余方法（含 `tools/list`）未经「已初始化」状态门直接派发到 SDK server，导致握手序列约束未生效。
- **影响**: 协议时序安全基线不闭合，客户端可在未握手前枚举工具集。
- **证据**: `evidence/D9-12/stdout.log`
- **状态**: 待提单

## #4【P1】EXP-E01 service_catalog 路由「查询云主机」意图 MISS

- **现象**: `serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `['Run hcloud --help to list available services.']`（fallback help 文本），未命中 `ECS`。
- **断言**: 「云主机/查云主机」意图应路由到 `ECS`（`recommendedServices` 含 `ECS`）。
- **根因**: `plugins/huaweicloud-core/dist/capability-catalog.js:391` 的关键词路由未覆盖「云主机/查云主机」到 ECS 的映射，落到兜底 `['Run hcloud --help to list available services.']`。
- **影响**: 常见「查云主机」意图路由失败，需人工降级到 hcloud help。
- **证据**: `evidence/EXP-E01/stdout.log`
- **状态**: 待提单

## #5【P2】D8-9 遥测值 sanitizeValue 不再脱敏 AK/SK/token

- **现象**: `sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 原样返回（仅去掉换行/制表并截断），未移除 `AK123`/`SECRET`/`abc123` 等敏感值。
- **断言**: `sanitizeValue` 应移除 AK/SK/token 等敏感值与非法字符，不改变合法值。
- **根因**: `plugins/huaweicloud-core/dist/telemetry/telemetry-values.js:21`（`sanitizeValue`）仅做换行/制表替换 + trim + 截断，未接入凭证脱敏逻辑（`safety/redact.js`）。
- **影响**: 遥测事件值若携带凭证字段会明文落入事件流水线。
- **证据**: `evidence/D8-9/stdout.log`
- **状态**: 待提单

## #6【P2·SPEC-MISMATCH】D1-68 region 取值优先级与契约相反

- **现象**: 默认 region 取值 `process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`，`HW_REGION` 优先；用例契约期望 `HUAWEICLOUD_REGION` 优先于 `HW_REGION`。
- **断言**: `HUAWEICLOUD_REGION` 优先于 `HW_REGION` 作为默认 region。
- **根因**: `plugins/huaweicloud-core/dist/auth/credential-resolver.js:20`（`let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''`）。
- **影响**: 实现与设计契约漂移，需裁决（采用哪种优先级）或回归用例。
- **证据**: `evidence/D1-68/stdout.log`
- **状态**: 待提单