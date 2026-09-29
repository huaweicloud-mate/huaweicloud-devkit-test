# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-30 05:35（北京时间）
> **执行归档**：`results/OpenClaw/2026-09-30-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（15 项 FAIL/SPEC 均为历史同源缺陷，1 项 BLOCKED 为环境阻塞）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（ecs-hd-ai-work-00-0003，IP 113.44.197.147） |
| Node / npm / Python | Node v22.13.0 / npm 10 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.7`（npm latest，gitHead `7456d05`） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 已配置 · doctor 确认就绪 |
| 真云凭证 | cn-north-4（AK/SK 管理员 + test001 只读子账号 + 保证金就绪） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（建删归零） |
| 设计真源 | 设计级 102 / 展开级 39 / 追踪表 211 行 |
| daily 基础用例 | 设计级 102（P0=21 P1=51 P2=30）/ 展开级 39（P1） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云 E2E 最低配置创建→测后删除→归零验证；证据统一落 `evidence/<case-id>/`。本轮 48 个探针 fresh 全量重跑（`run_all.sh`，2026-09-30 05:12-05:24），D9 协议层另跑权威 harness `eval/harness/protocol-probe.mjs` 佐证。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 141（设计级 102 + 展开级 39） |
| 已执行 | 140（设计级 101 + 展开级 39；设计级 1 条 D1-39 OS 专属豁免） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 113 / 25 / 1 / 1 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 81.3%（113/139） |
| P0 / P1 / P2 新增缺陷 | 0 / 0 / 0（全部历史同源，见 FINDINGS.md） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（真云建删 E2E 幂等归零验证通过） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 86 | 有证据且通过 PASS 门禁 |
| FAIL | 14 | 不符预期，根因见缺陷清单（D3-S5/D4-2/D4-6/D4-7/D4-16/D4-21/D4-23/D4-25/D4-27/D9-2/D9-4/D9-7/D9-12/D10-3） |
| BLOCKED | 0 | |
| SPEC-MISMATCH | 1 | D9-9 capabilities.cancellation 未暴露 |
| NOT_RUN | 1 | D1-39（Windows 专属用例，OS 列标注「专属」，Linux 结构性不适用） |
| **合计** | **102** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 27 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | EXP-E01/02/03/04/05/07/10/11/12/13/14（D10-3 中文意图 MISS） |
| BLOCKED | 1 | EXP-E08（诊断意图需真实 Agent 会话 harness，非 DSH 客户端本机无 dsh） |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **39** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 全部 15 项 FAIL/SPEC 均为**历史同源**缺陷，完整根因/断言/证据见 `FINDINGS.md`。本轮 fresh 重跑复现，根因（文件:行号）不变。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D9-12 | 未 initialize 先 tools/list 未返回 -32600 | mcp-protocol.mjs:30-59 | 历史同源 |
| 2 | P0 | D4-2 | 凭证 env 打印拦截不完整（HW_SECRET_KEY 漏网） | safety-policy.mjs:398-405 | 历史同源 |
| 3 | P0 | D4-16 | 命令包裹穿透（sh -c "env\|grep" 未解包） | safety-policy.mjs:384-401 | 历史同源 |
| 4 | P0 | D4-21/D4-7 | hook_check_artifacts broad IAM 未检出 | cloud-risk-rules.json:179-201 | 历史同源 |
| 5 | P0 | D4-23 | 全局规则 huawei-agent-rules.mdc 注入失效 | package.json:8-17 | 历史同源 |
| 6 | P1 | D4-6 | adminPass 空格形式未脱敏 | safety-policy.mjs:42-46 | 历史同源 |
| 7 | P2 | D4-25 | Python hook 写命令遥测误分类 cli:invoke | huaweicloud-safety.py:46 | 历史同源 |
| 8 | P1 | D4-27 | 裸 token=/小写 ak=/sk= 未脱敏 | safety-policy.mjs:34-46 | 历史同源 |
| 9 | P1 | D9-2 | tools/list 传 string params 未返回 -32602 | mcp-protocol.mjs:57-59 | 历史同源 |
| 10 | P1 | D9-4 | initialize 前 tools/list 未按规范报错 | mcp-protocol.mjs:30-59 | 历史同源 |
| 11 | P2 | D9-7 | protocolVersion 不校验不回显 | mcp-protocol.mjs:46 | 历史同源 |
| 12 | P1 | D9-9 | capabilities.cancellation 未暴露（SPEC） | mcp-protocol.mjs:47-49 | 历史同源 |
| 13 | P1 | D10-3 | 中文意图路由准确率 <90%（MISS 11/15） | tools.mjs:1816-1946 | 历史同源 |
| 14 | P2 | D3-S5 | 复合中文意图全角逗号不拆分 | tools.mjs:1923 | 历史同源 |

完整缺陷根因 + 复现证据逐条见 `FINDINGS.md`（#1~#16），`file_issue.py` 将自动查重生成 `HISTORY_LINKS.md`，命中历史单则**不重复开单**，仅在既有单补复核。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（OS 列标注「专属」：Windows 升级检测链 EINVAL/npm.cmd 专属）；Linux 无 npm.cmd/EINVAL 语义，本 OS 结构性不适用。Linux 侧检测链由源码级 `queryDistTagsSync` 探针佐证（evidence/d1-upgrade/probe-d1-39-linux.stdout.log dist-tags 含 latest+next）。 | 无（归属列正确；非 Linux 用例） |
| EXP-E08 | 展开级 | P1 | BLOCKED | 补环境 | 真实 Agent 会话「诊断意图」（ECS 启动失败分析）需真实 LLM Agent 判断是否路由 huaweicloud_explain_error；eval/harness/run-eval.mjs 的 serviceCatalog 确定性路由层无法代理该诊断意图（实测返回 N/A）。缺可交互真实 Agent 会话级 harness（仅 DSH/装了 dsh 客户端可用；本机 OpenClaw 无 dsh）。 | 补：本机接入 dsh 或 CDP 会话自动化后复测 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无新增`（D4-2/D4-16/D4-21/D4-23 等凭证/策略红线项均为历史已知缺陷，非本轮新增）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（探针日志均 `<redacted>` / 占位 AK/SK）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC 安全组（D3-C14） | 是 | 已删 | tctest- 剩余=0 |
| VPC/Subnet/RDS（D3-S7） | 是 | 已删 | tctest-s7- 剩余=0，RDS 删除完成（ACTIVE→DeleteInstance→名单消失） |
| FunctionGraph 函数（D3-S6） | 是 | 已删 | ListFunctions 无残留 |
| OBS 桶（D3-C13） | 是 | 已删 | 删桶成功 |
| 沙箱会话（D3-S3） | 是 | close_session ok | 会话已关闭 |

> 真云只删本次创建资源；`probe-realcloud.mjs` / `probe-scenario-realcloud.mjs` / `probe-d3-s7.mjs` / `probe-d3-s3-sandbox.mjs` 均含删除归零断言，全部通过。独立逐步核验 VPC/Subnet/SG/RDS 中 `tctest*` 前缀资源均已归零。

---

## 八、遗留与建议

- 待裁决 SPEC：D9-9（capabilities.cancellation 契约漂移，历史单已跟踪）
- 本轮未覆盖：真实 Agent 会话评测（D10-1/2/5/9，非 DSH 客户端需 CDP 自动化，本机未接入）
- 建议：15 项 FAIL/SPEC 全部历史同源且已有多客户端复现，建议优先收敛 P0 凭证/策略红线簇（D4-2/D4-16/D4-21/D4-23）与中文意图路由（D10-3/D3-S5）方向。