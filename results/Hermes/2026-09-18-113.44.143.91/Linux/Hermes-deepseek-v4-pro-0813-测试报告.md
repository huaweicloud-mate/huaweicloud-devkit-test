# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-18 05:14（北京时间）
> **执行归档**：`results/Hermes/2026-09-18-113.44.143.91/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 P0 产品缺陷 + SPEC 契约漂移）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux (Ubuntu 24.04.4 LTS) aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.11.15 |
| 被测版本（SUT） | `v1.1.5`（npm latest 正式版，gitHead `e7ed6f66`，release PR `#696`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS 实测；文档仍写 39 → D8-1 缺陷） |
| hcloud / 依赖 | hcloud 7.2.12（本日 auth sync 修复 KooCLI 凭证） |
| 真云凭证 | cn-north-4，管理员 AKSK + 只读子账号 test001（均实测可用） |
| 测试类型 | 源码级探针 / 真机 CLI（auth sync/doctor）/ MCP 协议 / 真云 E2E（建删归零） |
| daily 用例 | 设计级 80 / 展开级 48 / 追踪表 183 |

> **执行方法**：探针（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，结果落 `stdout.log`；eval harness 跑 `run-eval.mjs`/`protocol-probe.mjs` 得路由/协议结论；真云 E2E 用 `realcloud_e2e.mjs`（建删归零）+ D4-13 只读子账号实测 + D4-14 CTS 审计实测。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 80 / 展开级 48 |
| 已执行 | 设计级 80 / 展开级 48（无空跑） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN（设计级） | 66 / 11 / 0 / 2 / 1 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN（展开级） | 36 / 11 / 0 / 0 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC，不含 BLOCKED/NOT_RUN） | 设计级 66/79 = 83.5%；展开级 36/47 = 76.6% |
| P0 / P1 / P2 缺陷 | 5 / 5 / 1（另 2 项 SPEC-MISMATCH） |
| 红线（I 类）违规 | 3（D2-4 / D4-2 / D4-16 凭证脱敏/拦截缺口，均历史缺陷复核） |
| 资源释放 | 全部归零（真云 VPC/Subnet/ECS/OBS/sandbox 建删归零验证） |

---

## 三、状态汇总

### 3.1 设计级（80 条）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 66 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | 不符预期，根因见缺陷清单（D2-11/D2-4/D4-2/D4-16/D4-23/D4-8/D4-17/D4-27/D10-3/D9-2/D8-1） |
| BLOCKED | 0 | 无（本日修复 KooCLI 凭证，D4-14 由 BLOCKED → PASS） |
| SPEC-MISMATCH | 2 | 契约漂移（D9-9 capabilities.cancellation；D4-24 确认令牌精确 JSON 契约） |
| NOT_RUN | 1 | D1-39 Windows 专属（本机 Linux，由 EXP-NR3-10 覆盖） |
| **合计** | **80** | |

### 3.2 展开级（48 条）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 36 | 22 服务矩阵 + 3 评测命中 + 2 客户端 + 4 NR3 + 5 D1-58 |
| FAIL | 11 | 全部为 D10-3 中文意图路由根因叠加（EXP-E01~05/07/10~14） |
| BLOCKED | 0 | |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 1 | EXP-E08 诊断类意图（explain_error），不适用 serviceCatalog 服务路由 |
| **合计** | **48** | |

---

## 四、缺陷清单（详尽）

| # | 级别 | 用例ID | 缺陷描述 | 期望（精确断言） | 实际 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D2-11 | STS 临时凭证冲突态绕过 R3 拒绝落盘 | persist 带 STS token 应返回 `{status:error, scope:rejected}` | 返回 `needs_confirmation` | tools.mjs:1214-1231 | 待历史查重 |
| 2 | P0 | D2-4 | redactSecrets 漏小写 ak=/sk= | `ak=`/`sk=` 应 `<redacted>` | 明文残留 | safety-policy.mjs:34-45 | 待历史查重 |
| 3 | P0 | D4-2 | 凭证 env 打印拦截未覆盖 HW_ 前缀 | `env \| grep HW_ACCESS_KEY` 应 `deny` | 返回 `allow` | safety-policy.mjs:399 | 待历史查重 |
| 4 | P0 | D4-16 | env-dump 被 shell 包裹穿透 | `sh -c "printenv ..."` 应 `deny` | 返回 `allow` | safety-policy.mjs:398 | 待历史查重 |
| 5 | P0 | D4-23 | 全局规则 huawei-agent-rules.md 未注入 | install 应产出并注入 | 零产出 | 安装流程未写盘 | 待历史查重 |
| 6 | P1 | D4-8 | Node/Python 钩子策略不一致 | 同一高危命令两侧均 `deny` | Python 放行 | huaweicloud-safety.py:170-188 | 待历史查重 |
| 7 | P1 | D4-17 | hook 模糊 fail-open | 异常输入应 `deny`（fail-closed） | 返回 `allow` | risk-rule-engine.mjs:105-107 | 待历史查重 |
| 8 | P1 | D4-27 | redactSecrets/redactOutput 双路径漏小写 | 两路径均应 `<redacted>` | 两路径均明文残留 | safety-policy.mjs:34-45 + hcloud-cli.mjs:587-596 | 待历史查重 |
| 9 | P1 | D10-3 | serviceCatalog 中文意图路由缺失 | 路由准确率 ≥90% | 21.4% | tools.mjs:1778-1886 | 待历史查重 |
| 10 | P1 | D9-2 | JSON-RPC invalid params 无 error 对象 | 应 `{code:-32602}` | 无 error 对象 | mcp-protocol.mjs:46-77 | 待历史查重 |
| 11 | P2 | D8-1 | 文档与实现工具数漂移（39→40） | 文档应为 40 | 文档写 39 | AGENTS.md:27,45 | 待历史查重 |
| 12 | SPEC | D9-9 | capabilities.cancellation 未声明 | 应声明 `notifications.cancellation` | 仅 `{tools:{}}` | mcp-protocol.mjs:63 | 待历史查重 |
| 13 | SPEC | D4-24 | 确认令牌过期/重复精确 JSON 契约未实现 | `CONFIRM_TOKEN_EXPIRED`/`already_processed` | 抛通用 Error 串，TTL=5min | tools.mjs:1748-1750,1247 + hcloud-cli.mjs:14 | 待历史查重 |

### 根因详情（P0/P1 附关键代码与证据）

**#1 D2-11 STS 冲突态绕过 R3**：`tools.mjs:1214-1231` persist 流程先判 `prev.ak && prev.ak !== ak` → 命中即返回 `needs_confirmation`，而 R3 的 STS 拒绝只存在于无冲突分支 `persistCredentials`(tools.mjs:1012-1018)。证据 `evidence/D2-11/stdout.log`（实测 status=needs_confirmation）。

**#2 D2-4 / #8 D4-27 小写 ak/sk 漏脱敏**：`safety-policy.mjs:34-45` 密钥正则仅覆盖大写 `(AK|SK)`；`hcloud-cli.mjs:587-596` `redactOutput` 直接转发 `redactSecrets`，两路径同漏。证据 `evidence/D2-4/stdout.log`、`evidence/D4-27/stdout.log`。

**#3 D4-2 HW_ 前缀**：`safety-policy.mjs:399` env-dump 关键字正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/` 缺 `HW_`。证据 `evidence/D4-2/stdout.log`（`env | grep HW_ACCESS_KEY` → allow）。

**#4 D4-16 shell 包裹穿透**：`safety-policy.mjs:398` env-dump 检测依赖词边界，`sh -c` 使内层命令前为引号。证据 `evidence/D4-16/stdout.log`。

**#6 D4-8 Python/Node 不一致**：`huaweicloud-safety.py:170-188` Python `evaluate()` 仅 5 类窄检查，未覆盖 Node `classifyTextCommand` 能拦的 `configure show`/`DeleteServers`。证据 `evidence/D4-8/stdout.log`。

**#7 D4-17 fail-open**：`risk-rule-engine.mjs:105-107` 无规则命中默认 `allow`。证据 `evidence/D4-17/stdout.log`。

**#9 D10-3 中文路由**：`tools.mjs:1778-1886` routeMap 仅 sandbox/voucher 含 CJK 关键字。证据 eval harness HIT=3/MISS=11（21.4%）。

**#10 D9-2 错误码**：`mcp-protocol.mjs:46-77` dispatch 未校验 params 类型。证据协议探针 invalid-params 无 error 对象。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改进建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（npm.cmd spawnSync 无 shell:true 抛 EINVAL 静默失败），本机为 Linux，无 .cmd/EINVAL 语义 | 无需改用例：已由展开级 EXP-NR3-10 在 Linux 侧代表覆盖（54 条通用断言通过）；Windows 由 Windows 侧客户端覆盖 |
| EXP-E08 | 展开级 | P1 | NOT_RUN | 改用例 | 「我的 ECS 启动失败帮我分析原因」是诊断类意图，应走 explain_error 工具，不适用 serviceCatalog 服务路由（run-eval 期望映射为 null→N/A），当前展开级仍归类到 D10-3 路由评测集 | 建议：将 E08 从「D10评测集（路由）」改归「D10-4 诊断/explain_error」评测维度，或明确其断言为 explain_error 工具可达性而非 serviceCatalog 路由 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（真云 AK/SK 未出现在任何证据 stdout.log）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：3 项均为「历史已知缺陷复核」（D2-4/D4-2/D4-16），非本轮新增
- [x] 脱敏复核：证据目录无原始凭证明文（只读子账号 D4-13 证据仅含 API 响应，无 AK/SK 明文）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC (testbot3-hermes-e2e-\*) | 是 | 已删 | finally 归零（vpc✓ subnet✓） |
| Subnet | 是 | 已删 | 同上 |
| ECS (serverIds 返回) | 是 | 已删 | ECS✓（DeleteServers 已提交） |
| OBS bucket | 是 | 已删 | 删桶归零（Delete bucket successfully） |
| sandbox session | 是 | closed | close_session ok |

> 真云只删本次创建资源（唯一时间戳命名 `testbot3-hermes-*`）；删除前盘点，未触碰既有/他人资源。D4-13 只读子账号 CreateVpc 被 IAM 拒绝（PolicyNotAuthorized），未产生资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities.cancellation 未声明）、`D4-24`（确认令牌精确 JSON 契约未实现，本日为新增发现，昨日漏测）
- 本轮未覆盖范围：10 客户端终端矩阵（单机仅 Hermes）、真实 LLM Agent 会话行为评测（需 LLM harness，serviceCatalog 路由层已用 run-eval 代理）、macOS 专属
- 建议：`routeMap`（tools.mjs:1778-1886）补充中文意图关键字，D9/D4-24 精确协议契约优先补齐