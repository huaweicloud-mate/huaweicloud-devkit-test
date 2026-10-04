# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2）

> **落盘路径**：`results/WorkBuddy/2026-10-05-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-10-05 05:40:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

## #1【P0】D1-39 Windows 升级检测链失效：parseDistTagsOutput 拒绝 npm view 数组输出

- **现象**：在 Windows 上直调 `queryDistTagsSync()` 返回 `null`，即使 `npm view huaweicloud-devkit dist-tags --json` 成功返回 `[{ "latest": "1.1.7", "next": "1.1.8-next.1" }]`（status=0）。`parseDistTagsOutput` 因 `Array.isArray(parsed)` 提前返回 `null`，导致 Windows 升级检测链完全失效（无法判断是否有新版本）。
- **断言**：`queryDistTagsSync()` 在 Windows 上必须返回 `{ latest: "1.1.7", next: "1.1.8-next.1" }`（非 null），即 `parseDistTagsOutput` 必须能解析 `npm view` 的数组输出 `[{...}]`。
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs:81-94` `parseDistTagsOutput` 函数：`if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;`。npm view 在某些版本/配置下返回数组包裹的 JSON `[{latest,next}]`，该检查直接拒绝数组，导致解析失败。
- **影响**：Windows 平台升级提醒完全失效，用户无法收到新版本通知，违反 D1-39 P0 契约（Windows 升级检测链可用性）。
- **证据**：`evidence/D1-39/stdout.log`（含 npm view 真实输出 + parseDistTagsOutput 返回 null）
- **状态**：待提单

## #2【P1】D2-12 R10 runtime 非空禁止落盘未在代码层强制执行

- **现象**：调用 `huaweicloud_auth_switch persist` 时，即使 `hasRuntimeCredentials()` 返回 `true`（runtime 凭证已设置），persist 仍被允许执行（进入 conflict 确认或直接 persistCredentials），未返回 R10 拒绝。
- **断言**：`auth_switch persist` 在 `hasRuntimeCredentials() === true` 时必须返回 `{ status: 'error', scope: 'rejected', error: 'R10: runtime credentials active, persist disabled' }`（或等价拒绝）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1199-1280` `auth_switch` persist 路径未检查 `hasRuntimeCredentials()`；`persistCredentials` 函数（tools.mjs:1052）也未检查 runtime 状态。R10 仅在工具描述/文档中声明，代码层无强制逻辑。
- **影响**：runtime 凭证与持久化凭证可能同时存在，导致凭证来源歧义、configuredBySession 标志失效，违反 R10 单一凭证源约束。
- **证据**：`evidence/D2-12/stdout.log`（hasRuntimeCredentials=true 但 persist 进入 needs_confirmation 路径）
- **状态**：待提单

## #3【P1】D4-6 adminPass 空格分隔参数未拦截（hwc-command-secret-in-arg 规则盲区）

- **现象**：`hcloud ECS create-servers --adminPass PlainPwd123`（空格分隔，hcloud CLI 实际语法）被 `evaluateCommandRisk` 判为 `allow`，未触发 warn/deny。而 `--adminPass=PlainPwd123`（= 分隔）和 `--adminPass:PlainPwd123`（: 分隔）正确判为 `warn`。
- **断言**：`evaluateCommandRisk('hcloud ECS create-servers --adminPass PlainPwd123')` 必须返回 `decision: 'warn'` 或 `'deny'`（不得 `allow`）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` `hwc-command-secret-in-arg` 规则 `match.all[1].regex`：`(--adminPass|--password|--secret|--token)\\s*[=:]\\s*[^\\s<]`。`[=:]` 字符类仅匹配 `=` 或 `:`，不匹配空格。hcloud CLI 标准参数语法是 `--param value`（空格分隔），该规则无法命中。
- **影响**：明文密码以空格分隔方式传入 hcloud 命令时不会被风险规则拦截，可能进入 agent 上下文/日志，违反 D4-6 adminPass 回显警告契约。
- **证据**：`evidence/D4-6/stdout.log`（spaceSep=allow, eqSep=warn, colonSep=warn）
- **状态**：待提单

## #4【P1】EXP-E01 serviceCatalog 路由 MISS：「帮我查一下我账号在华北北京四有哪些云主机」未路由到 ECS

- **现象**：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `'Run hcloud --help to list available services.'`，未路由到 ECS list-servers。期望服务=ECS，实际=未命中。
- **断言**：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 必须返回含 `ECS` 服务的路由结果（如 `ECS+...`），并对应 `run_readonly_command` 路径。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog` 函数（路由层）对「云主机」中文意图未命中 ECS 关键词。需扩展 serviceCatalog 的中文同义词映射（云主机→ECS）。
- **影响**：用户常用中文意图「云主机」无法路由，serviceCatalog 路由准确率从 100% 降至 92.9%（基线 21.4% MISS 已改善但仍存 1 条 MISS）。
- **证据**：`evidence/EXP-E01/stdout.log`（verdict=MISS, expect=ECS, actual=Run hcloud --help）
- **状态**：待提单
