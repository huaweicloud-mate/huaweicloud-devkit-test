# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-16 07:50`（北京时间）
> **执行归档**：`results/OpenClaw/2026-09-16-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（1 项 P2 新增提单 #702；其余 FAIL 均历史同源；1 项 P0 Windows 专属 OS 豁免）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 6.8.0-106-generic） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.5`（npm latest 正式版，gitHead `e7ed6f6`，release-1.1.5） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 11 pass 0 fail 确认已配置） |
| 真云凭证 | `cn-north-4`（管理员 AKSK + 只读子账号 `test001` 均已下调并实测有效） |
| 测试类型 | 源码级探针 / MCP 协议 / 真机 CLI / 真云 E2E（最小资源建删归零 + CTS 审计 + 审批流 + 最小权限） |
| daily 基础用例 | 设计级 78 / 展开级 39（本客户端 OpenClaw+Linux 预筛后） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 / 走真实 mcp-server JSON-RPC 协议，决策与结果落 `stdout.log`；证据统一落 `evidence/<case-id>/`。本轮 v1.1.4→v1.1.5 升级后全量重跑。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily，预筛后） | `117`（78 设计级 + 39 展开级） |
| 已执行 | `117` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `92 / 22 / 1 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC，去 BLOCKED/NOT_RUN） | `80.0%`（92/115） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 1`（仅 D9-7 新提单 #702） |
| 红线（I 类）违规 | `3`（D4-2/D4-16/D4-21 凭证/越权安全红线；v1.1.5 已部分修复 D4-2/D4-16，残留 env|grep HW_* 与 HCL broad IAM） |
| 资源释放 | `全部归零 / 本轮真机新建 VPC 安全组(tctest-d3c4-*) 测后删除归零` |

---

## 三、状态汇总

### 3.1 设计级（78，OS 专属豁免 1）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 65 | 有证据且通过 PASS 门禁（含 D1-1/3/4/5 真机 CLI 生命周期、D4-13 最小权限、D4-24 令牌边界、D4-10/12 源码级直调） |
| FAIL | 11 | D4-2/D4-16/D4-17/D4-21/D4-23（P0×5）+ D4-6/D4-7/D9-2/D9-4/D10-3（P1×5）+ D9-7（P2×1），根因见缺陷清单 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 1 | D9-9 capabilities.cancellation 未暴露 |
| NOT_RUN | 1 | D1-39（Windows 专属，OS 豁免） |
| **合计** | **78** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 27 | EXP-D5-9-1/9-3 + EXP-C4-01~22（22 服务只读规划冒烟）+ EXP-E06/E09/E15（路由命中） |
| FAIL | 11 | EXP-E01~E05/E07/E10~E14（路由 MISS，同 D10-3/#689 根因） |
| BLOCKED | 1 | EXP-E08（真实 Agent 会话诊断意图层，run-eval.mjs 无法代理） |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

> 本轮 12 项缺陷（设计级 11 FAIL + D9-9 SPEC）均有明确根因（`文件:行号`）+ 复现证据。经 `file_issue.py` 查重口径逐条核对上游 open issue：11 项命中历史同源单（不重复提单），仅 **1 项新提单 #702**（D9-7 protocolVersion 协商）。详见同目录 `FINDINGS.md` 与 `HISTORY_LINKS.md`。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截残留（`env|grep HW_*`） | `safety-policy.mjs:398-399` | 历史 #651/#652/#673/#674/#676/#679/#681 等（v1.1.5 修复不完整） |
| 2 | P0 | D4-16 | 命令包裹穿透残留（`sh -c "env|grep"`） | `safety-policy.mjs:67-102` text 路径未解包 | 历史同上（v1.1.5 修复不完整） |
| 3 | P1 | D4-17 | hook 三工具畸形输入 fail-open | `risk-rule-engine.mjs:111-119` | 历史 #564/#689 |
| 4 | P1 | D9-2 | JSON-RPC -32602 未区分（invalid params） | `mcp-protocol.mjs:46-98` | 历史 #643/#672（v1.1.5 仅修 -32601） |
| 5 | P2 | D9-7 | protocolVersion 不校验不回显（版本协商缺失） | `mcp-protocol.mjs:62` | **新提单 #702** |
| 6 | P0 | D4-21 | HCL `actions=["*"]` broad IAM 未拦截 | `cloud-risk-rules.json:188-196` | 历史 #651/#652 |
| 7 | P0 | D4-23 | huawei-agent-rules.mdc 注入失效 | `package.json:8-18` + `setup-cli.mjs` | 历史 #651/#673/#674/#676/#679 |
| 8 | P1 | D4-6 | adminPass 空格形式回显未脱敏 | `safety-policy.mjs:42` | 历史 #651/#673/#679 |
| 9 | P1 | D4-7 | hook_check_artifacts broad IAM 失效 | `cloud-risk-rules.json:188-196` | 历史 #651/#652 |
| 10 | P1 | D10-3 | 中文意图路由未命中（仅英文关键词） | `tools.mjs:1776-1910` | 历史 #689/#680 |
| 11 | P1 | D9-4 | initialize 握手时序未强制 | `mcp-server.mjs:156-162` | 历史 #699 |
| 12 | P1 | D9-9 | capabilities.cancellation 未暴露（SPEC） | `mcp-protocol.mjs:62-65` | 历史 #698 |

每个缺陷的「现象 + 精确断言 + 证据路径」见同目录 `FINDINGS.md`（严格遵循 file_issue.py 解析格式）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

> 本轮 NOT_RUN = 1（D1-39 Windows 专属，OS 豁免）。BLOCKED = 1（EXP-E08）。均写分类与详细原因。

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属（OS 列标注「专属」：Windows npm.cmd EINVAL 升级检测链专属），本机为 Linux，无 npm.cmd/EINVAL 语义，结构性不适用。Linux 检测链可用性已由源码级 `queryDistTagsSync` 负向探针（`evidence/d1-upgrade/probe-d1-39-linux`）佐证可用。 | 归属列已正确标注「专属」，无需改用例；Linux 覆盖率由源码级探针覆盖 |
| EXP-E08 | 展开级 | P1 | BLOCKED | 补环境 | 真实 Agent 会话诊断意图层（"ECS启动失败帮我分析原因"）需真实 LLM Agent 判断是否路由 `huaweicloud_explain_error`；`eval/harness/run-eval.mjs` 的 serviceCatalog 确定性路由层无法代理。缺可交互真实 Agent 会话 harness（ITER-004+ 待建）。 | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [ ] 红线（I 类）违规：`3`（D4-2/D4-16/D4-21 凭证/越权安全红线，均历史同源，v1.1.5 已部分修复 D4-2/D4-16 主干）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云探针 stdout.log 已脱敏，无明文 AK/SK）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC 安全组（tctest-d3c4-*） | 是 | 已删 | 剩余 0（`evidence/realcloud/probe-realcloud.stdout.log`） |

> 真云只删本次 tctest- 前缀资源；删除前全量盘点 + 白名单，未删既有/他人资源。D4-13 只读子账号仅做读 + 写拒绝验证，无资源创建。

---

## 八、遗留与建议

- **待裁决 SPEC**：`D9-9`（capabilities.cancellation 未暴露，历史 #698）；`D4-24` 令牌 TTL=5min 契约（docs 未明确 60s，历史 #643）。
- **本轮 v1.1.5 升级观察**：PR #650/#688 修复了 D4-2（`printenv HW_*`/`echo $HW_*`）、D4-16（`sudo/bash -c/shell-wrapper`）、D9-2（`-32601`）；但三项修复均留残留：①`env|grep HW_*` 裸词元仍放行 ②`sh -c "env|grep ..."` 文本 env-dump 路径未解包 ③`-32602` invalid params 未区分。建议修复方补齐这三处边界。
- **建议**：`serviceCatalog` 中文路由（#689/#680）与 `hook_check_artifacts` HCL broad IAM（#651/#652）为长期未闭环项，建议优先处理。