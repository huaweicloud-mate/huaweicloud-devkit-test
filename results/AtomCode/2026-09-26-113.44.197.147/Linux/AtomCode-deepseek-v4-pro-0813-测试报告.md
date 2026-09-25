# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-26 05:30:00（北京时间）
> **执行归档**：`results/AtomCode/2026-09-26-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.7（npm latest，gitHead `7456d059`） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 已装 + doctor 确认已配置 |
| 真云凭证 | `cn-north-4`（AKSK + 只读子账号 credentials.readonly.json） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| 设计真源 | 设计级 102 / 展开级 39（预筛后）/ 追踪表 |
| daily 基础用例 | 设计级 102（P0=21 P1=51 P2=30）/ 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；D10 路由用 `eval/harness` 源码级 serviceCatalog 路由评估；真云用例用 `probe-realcloud.mjs` 真机建删归零；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily 回填） | 设计级 102 + 展开级 39 = 141 |
| 已执行（有 stdout.log 回填） | 141 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 111 / 25 / 3 / 1 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 111/137 = 81.0% |
| P0 / P1 / P2 新增缺陷 | 5 / 7 / 3（`FINDINGS.md` 共 15 项） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 真云全部归零（tctest-d3c4- 剩余=0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 83 | 有证据且通过 PASS 门禁 |
| FAIL | 14 | 不符预期，根因见缺陷清单 |
| BLOCKED | 3 | 环境阻塞（D3-S7/D9-6/D1-67） |
| SPEC-MISMATCH | 1 | D9-9 capabilities 未声明 cancellation |
| NOT_RUN | 1 | D1-39（OS 专属：Windows 升级检测链） |
| **合计** | **102** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 28 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | EXP-E01/02/03/04/05/07/10/11/12/13/14 路由 MISS，同 D10-3 根因 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单（详见 FINDINGS.md）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件） |
|---|---|---|---|---|
| 1 | P0 | D2-4 | 凭证脱敏 JSON 场景漏脱敏 | `safety-policy.mjs:34/49`（redactString 未覆盖 JSON 键值字符串） |
| 2 | P0 | D4-2 | env\|grep HW_SECRET_KEY 漏拦 | `safety-policy.mjs:398-399` env-dump 正则缺 HW_ 裸字面 |
| 3 | P0 | D4-16 | sh -c "printenv…" 命令包裹穿透 | `safety-policy.mjs:398-399` env gate 正则要求空白/行首 |
| 4 | P0 | D4-21 | 制品预检未检出 broad IAM | `risk-rule-engine.mjs` 规则集缺 broad IAM 规则 |
| 5 | P0 | D4-23 | 全局规则注入链路缺失 | `package.json:8` files 白名单缺 rules/ + setup-cli 无 .mdc 注入 |
| 6 | P1 | D10-3 | 中文意图路由准确率仅 21.4% | `tools.mjs:1817` serviceCatalog 中文关键词覆盖不足 |
| 7 | P1 | D4-6 | adminPass 空格分隔值未脱敏 | `safety-policy.mjs:34` redactString 未覆盖空格分隔 |
| 8 | P1 | D4-27 | 小写 ak=/sk= 未脱敏 | `safety-policy.mjs:34` 大小写不敏感分支缺失 |
| 9 | P1 | D3-S8 | 排障意图路由缺失 | `tools.mjs:1817` routeMap 缺排障分支 |
| 10 | P1 | D9-2 | JSON-RPC 非法入参未返回 -32602 | `mcp-protocol.mjs:57` tools/list 缺入参校验 |
| 11 | P1 | D9-4 | 协议生命周期未强制（含 D9-12 时序守卫） | `mcp-protocol.mjs:57` 无 initialize 时序守卫 |
| 12 | P1 | D9-9 | capabilities 未声明 cancellation | `mcp-protocol.mjs:47-49` capabilities 仅 {tools:{}} |
| 13 | P2 | D4-25 | Python hook 写命令未分类 cli:write | `hooks/huaweicloud-safety.py:95-96` |
| 14 | P2 | D8-9 | 遥测 sanitizeValue 未脱敏 | `telemetry.mjs:189` 未调用 redactSecrets |
| 15 | P2 | D9-7 | 协议版本协商降级未实现 | `mcp-protocol.mjs:46` 透传 protocolVersion |

> 根因详情（代码片段 + 复现证据）见 `FINDINGS.md`，本报告不重复展开。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属（升级检测链 EINVAL/npm.cmd）；Linux 非对应 OS，由 NR3 终端矩阵负面/环境验证 + 源码级 `queryDistTagsSync` 探针佐证 dist-tags 含 latest+next | — |
| D3-S7 | 设计级 | P1 | BLOCKED | 补环境 | 需真实 RDS+沙箱多服务编排会话自动化（建库→部署→连接串注入→读写验证→归零）；本客户端无 dsh/CDP agent 会话 harness | — |
| D9-6 | 设计级 | P1 | BLOCKED | 补环境 | 跨客户端互通需官方 MCP Inspector + ≥2 真实客户端互通冒烟；本机源码级 clientInfo 互操作 10/10 已证，真实多客户端会话冒烟缺环境 | — |
| D1-67 | 设计级 | P2 | BLOCKED | 补环境 | 需真实 DSH 插件安装/跳过验证（AGENT_TOOLKIT_MODE/SKIP_DSH 注入为破坏性全局安装，run-only 不执行） | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（探针输出均已 `<redacted>`）
- [x] 真云只删本次创建（tctest-d3c4- 前缀），建删归零验证通过

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC 安全组（tctest-d3c4-sg-*） | 是 | 已删 | 剩余 0（`D3-C4 测后删除归零 => 0`） |

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities 未声明 cancellation，实现与设计契约漂移）。
- 本轮 BLOCKED（3 项 D3-S7/D9-6/D1-67）均为真·外部依赖（真实多服务编排会话 harness / 多客户端互通环境 / DSH 插件破坏性安装），blockedReason 已写明缺什么 + 解除条件，不属假阻塞。
- 建议：优先修复 5 个 P0 安全缺陷（D2-4/D4-2/D4-16/D4-21/D4-23），其中 D4-2/D4-16 为 env/凭证打印拦截绕过，I 类风险。