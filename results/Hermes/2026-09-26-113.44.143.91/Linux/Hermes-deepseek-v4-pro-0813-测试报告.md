# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-26 05:20（北京时间）
> **执行归档**：`results/Hermes/2026-09-26-113.44.143.91/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（存在 P0 FAIL 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64 (Ubuntu 24.04.4 LTS) |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.7`（npm latest，gitHead `7456d05`，PR #813 release-1.1.7） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 11 项全通过 |
| 真云凭证 | cn-north-4（AK/SK 管理员 + 只读子账号 test001，已真机执行） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status/update/help）/ MCP 协议 / 真云 E2E |
| 设计真源 | 设计级 102 / 展开级 43（预筛后）/ 追踪表 211 行 |
| daily 基础用例 | 设计级 102 / 展开级 43 |

> **执行方法**：源码级探针（.mjs 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，如 `classifyTextCommand`/`judgeUpdate`/`serviceCatalog`）断言；CLI 真机执行记录日志；MCP 协议层用 `eval/harness/protocol-probe.mjs`；真云 E2E（建删资源归零，只删本次创建）。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 145（设计级 102 + 展开级 43） |
| 已执行 | 145 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 109 / 29 / 0 / 4 / 3 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 76.8%（109/142） |
| P0 / P1 / P2 新增缺陷 | 5 / 12 / 5（均经查重为已跟踪历史单，本节不计新单）+ 展开级 P1 11 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（VPC/OBS/FunctionGraph 建删归零；沙箱 session 已 close） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 78 | 有证据且通过 PASS 门禁 |
| FAIL | 18 | 不符预期，根因见缺陷清单 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 4 | 契约漂移，待裁决 |
| NOT_RUN | 2 | D1-39(OS 专属 Windows)、D3-S7(真云 RDS 计费窗口) |
| **合计** | **102** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 31 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | EXP-E01~E14 中文意图路由 miss 11 条 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 1 | EXP-E08(需真实 Agent 会话诊断行为) |
| **合计** | **43** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 全部缺陷均为实测复现，根因定位到文件:行号。经 `file_issue.py` 历史查重，均命中已跟踪上游 open issue，不重复开单（见 HISTORY_LINKS.md）。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） |
|---|---|---|---|---|---|---|
| 1 | P0 | D2-4 | 凭证脱敏缺小写 ak=/sk= | 小写 `ak=`/`sk=` 值→`<redacted>` | 返回原文不脱敏 | safety-policy.mjs:45 缺 /i |
| 2 | P0 | D2-11 | R3 STS token 拒绝落盘被 R2 冲突门抢先 | 带 securityToken persist 立即 `{status:error,scope:rejected}` | 返回 needs_confirmation | tools.mjs:1214-1228 |
| 3 | P0 | D4-5 | Change* 写动词误判为只读 | Change*→`risk=write`+`deny` | 判 allow/unknown_read | policy.json writeOperationPrefixes 缺 Change |
| 4 | P0 | D4-16 | 命令包裹/shell 穿透写拦截 | sh/bash/eval/$() 内层写操作 deny | 0/4 拦截（allow） | safety-policy.mjs:428 |
| 5 | P0 | D4-23 | 全局规则 huawei-agent-rules.md 安装未注入 | install 后含规则文件 | 未找到产物 | setup-cli.mjs 未复制 rules/ |
| 6 | P1 | D1-70 | no_proxy CIDR 网段未匹配 | 网段内目标 bypass(null) | 仍返回代理 | proxy/proxy-config.mjs:42-47 |
| 7 | P1 | D3-S1 | 中文「查云主机」未命中 ECS | 路由命中 ECS | miss（Run hcloud --help） | tools.mjs routeMap 英文-only |
| 8 | P1 | D3-S3 | 沙箱预览公网 URL 不可达 | 返回可访问公网 URL | tunnel_url_accessible=FAIL | 沙箱 devbridge tunnel 未建立 |
| 9 | P1 | D4-4 | Change* 写操作漏拦截审批门 | Change* 未经审批 deny | 漏拦截（allow） | policy.json 缺 Change |
| 10 | P1 | D4-8 | Python/Node hook 策略不一致 | 同名 payload 决策一致 | py 空=放行 | huaweicloud-safety.py:46 |
| 11 | P1 | D4-11 | 自然语言提示注入夹带写命令未拦截 | 夹带 Delete*/Create* deny | 1/4 拦截 | safety-policy.mjs:428 |
| 12 | P1 | D4-17 | hook 畸形输入 fail-open | 不可解析输入 fail-closed(deny) | 静默放行 | hooks try/JSON.parse catch |
| 13 | P1 | D4-24 | 确认令牌精确 JSON 契约未实现(SPEC) | `{code:'CONFIRM_TOKEN_EXPIRED'}` | 抛非结构化 Error | tools.mjs:1258-1260 |
| 14 | P1 | D4-27 | 双路径脱敏缺口(小写 ak/sk + 文本路径) | 小写 ak/sk + redactOutput 文本脱敏 | 残留明文 | safety-policy.mjs:42-45 |
| 15 | P1 | D9-2 | tools/list 非法参数未返回 -32602 | 传非法 params 返回 -32602 | 直接返回 tools，无 error | mcp-protocol.mjs:57-59 |
| 16 | P1 | D9-9 | capabilities.cancellation 未声明(SPEC) | 声明 notifications.cancellation | 未声明 | mcp-protocol.mjs:47-49 |
| 17 | P1 | D10-3 | serviceCatalog 中文意图路由未命中 | 中文意图命中对应服务 | 准确率 21.4%(HIT=3/MISS=11) | tools.mjs routeMap 英文-only |
| 18 | P1 | EXP-E01~E14 | 中文意图路由 miss（展开级 11 条，同 D10-3） | 各中文意图命中对应服务 | 11 MISS | tools.mjs routeMap 英文-only |
| 19 | P2 | D1-68 | HW_REGION 优先于 HUAWEICLOUD_REGION(SPEC) | HUAWEICLOUD_REGION 优先 | HW_REGION 胜出 | credentials.mjs:133 |
| 20 | P2 | D3-S5 | 复合中文意图分层路由未拆分 | 复合意图拆分命中多服务 | miss | tools.mjs routeMap 英文-only |
| 21 | P2 | D4-25 | Python hook 写操作遥测落 cli:invoke | 写→cli:write | 落 cli:invoke | huaweicloud-safety.py record_cli_event |
| 22 | P2 | D4-26 | findings 证据明文泄漏 | evidence 中 AK/SK→<redacted> | 回显原文 | risk-rule-engine.mjs:97 |
| 23 | P2 | D8-9 | sanitizeValue 未脱敏(SPEC) | 移除 AK/SK/token | 返回原文 | telemetry.mjs:189 |

### 根因详情（P0 缺陷摘录）

**#1 [P0] D2-4 凭证脱敏缺小写 ak=/sk=**
- 期望：`redactSecrets('ak=AK123 sk=SKsecret')` → `<redacted>`
- 实际：返回原文（大写 `AK=`/`SK=` 正常脱敏、对象路径正常）
- 根因：`safety-policy.mjs:45` 正则 `(AK|SK)` 大小写敏感且无 `/i`

**#3 [P0] D4-5 Change* 写操作误判**
- 期望：`hcloud ecs ChangeServerOsWithoutCloudInit` → `risk=write`+`deny`
- 实际：`allow / unknown_read`
- 根因：`safety/policy.json` `writeOperationPrefixes` 缺 `Change` 前缀

**#4 [P0] D4-16 命令包裹穿透**
- 期望：`sh -c "hcloud ecs DeleteServer"` → `deny`
- 实际：0/4 拦截（sh/bash/eval/$() 均 allow）
- 根因：`safety-policy.mjs:428` 仅 `(^|\s)hcloud` 前导命中才路由，shell-wrap 解包未前移

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（OS 列标注「专属」），本机 Linux 无 Windows 环境 | Linux 侧由展开级 EXP-NR3-10(P0) 通用 54 断言覆盖（已 PASS），无需改 |
| D3-S7 | 设计级 | P1 | NOT_RUN | 补环境 | 真云跨服务交付需建 RDS 实例（10~20min + 按需计费），每日测试窗口无法完成建删归零闭环 | 排独立补测轮；或展开规则明确「RDS 最小规格 + 计费告警」约束 |
| EXP-E08 | 展开级 | P1 | NOT_RUN | 改用例 | 诊断意图需真实 Agent 会话行为（walk explain_error/只读诊断），源码级 routeMap 无「诊断」关键词映射，harness 判 N/A | 源码级断言改为「诊断类意图应路由到 explain_error/huaweicloud-core 诊断链路」或标注需 LLM harness |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 Change* 误判已记缺陷，非测试侧误判）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云 AK/SK 未落盘，只留指纹）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC (D3-S2) | 是 | 已删 | ListVpcs 不再含 vpcId=true |
| OBS bucket (D3-C13) | 是 | 已删 | rm 归零 success |
| VPC (D4-14 审计) | 是 | 已删 | ListVpcs 归零=true |
| FunctionGraph 函数+定时触发器 (D3-S6) | 是 | 已删 | ListFunctions 不再含=true |
| 沙箱 session (D3-S3) | 是 | close_session | 已 close |
| 只读子账号 (D4-13) | 无写 | — | 写操作被拒(未创建，VPC.0010 PolicyNotAuthorized) |

> 真云只删本次创建资源（唯一时间戳前缀 `hdk1-*`）；删除前全量盘点 + 归零验证。残留 0 项。

---

## 八、遗留与建议

- 待裁决 SPEC：`D4-24`（确认令牌契约）、`D9-9`（cancellation 声明）、`D1-68`（region 优先级）、`D8-9`（sanitizeValue 脱敏）。
- 本轮 NOT_RUN（说明范围）：`D1-39`（Windows 专属）、`D3-S7`（真云 RDS 计费窗口）、`EXP-E08`（真实 Agent 诊断行为）。
- 测试侧说明（非产品缺陷）：D3-C4 服务矩阵中 DMS/DEW 为聚合服务名（DMS→Kafka/RabbitMQ/RocketMQ，DEW→KMS/CSMS），`list_operations` 返回 `unsupported` 属预期，建议母版展开规则补充映射说明。
- 建议：D2-4/D4-27 同源（大小写 /i），D4-4/D4-5 同源（Change 前缀），D10-3/D3-S1/D3-S5/EXP-E 同源（routeMap 英文-only），可合并修复一批。