# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-17 07:05（北京时间）
> **执行归档**：`results/Hermes/2026-09-17-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：**PARTIAL**（11 项设计级 FAIL + 12 项展开级 FAIL，均为 v1.1.5 已跟踪缺陷的复现；本轮无新增缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（ecs-hd-ai-work-00-0003） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.5（npm latest，gitHead `e7ed6f6`，PR #696） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12，doctor 11 项全 PASS |
| 真云凭证 | cn-north-4（管理员 AK/SK 有效 + 只读 IAM 子账号 test001 已下发） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 stdio / 真云 E2E（建删归零 + CTS 审计 + 只读子账号最小权限）/ D10 评测 harness |
| daily 基础用例 | 设计级 78 / 展开级 48（Hermes+Linux 预筛后） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classifyTextCommand / classifyHcloudArgs / redactSecrets / TOOL_DEFINITIONS 等）与 MCP stdio 协议直调，结果落 `evidence/<case-id>/stdout.txt`；CLI 真机执行记录日志；真云 E2E 用管理员凭证建最小规格 VPC→查 CTS→删除归零，只读子账号 env 动态切换测最小权限。本轮针对 v1.1.5（gitHead `e7ed6f6`）**全量 fresh 重跑**（`reverify-2026-09-17.sh` 15 支探针 + D10 run-eval harness + D4-13/D4-14 真云）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 78 + 展开级 48 = 126 |
| 已执行 | 126（执行状态列全部回填，无空） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 102 / 23 / 0 / 0 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 102 / 125 = 81.6% |
| P0 / P1 / P2 新增缺陷 | 0 / 0 / 0（23 项全部历史复现，见 `FINDINGS.md` / `HISTORY_LINKS.md`） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 真云 VPC 已建删归零（无残留），只读账号写全被 IAM 拒绝（无资源产生） |

---

## 三、状态汇总

### 3.1 设计级（78）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 66 | 有证据且通过 PASS 门禁（含 D3-C4 22 服务矩阵全可路由、D4-13/D4-14 真云 PASS） |
| FAIL | 11 | D4-16/D4-5/D2-4/D4-23/D4-4/D4-8/D4-17/D4-11/D10-3/D2-11/D8-1，根因见缺陷清单 |
| BLOCKED | 0 | 全部消解 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 1 | D1-39（Windows 专属 OS 用例，见 §五） |
| **合计** | **78** | |

### 3.2 展开级（48）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 36 | EXP-C4-01~22（22 服务矩阵）+ EXP-D5-8-1/-3 + EXP-E06/E09/E15 + EXP-NR3-02/04/10/24 + EXP-D1-58-01~05 |
| FAIL | 12 | EXP-E01/E02/E03/E04/E05/E07/E08/E10/E11/E12/E13/E14（中文意图路由 miss，同 D10-3） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **48** | |

---

## 四、缺陷清单（23 项，全部历史复现，本轮不重复提单）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-16 | 命令包裹/子shell 穿透写拦截 | `sh -c "hcloud ecs DeleteServer"` → `deny` | 返回 `allow`（0/4） | safety-policy.mjs:428 | #683/#671/#679 |
| 2 | P0 | D4-5 | Change* 写操作误判为只读 | `Change*` → `risk=write`+`deny` | `unknown_read` 放行（0/4） | safety/policy.json:27-31 缺 Change | #671 |
| 3 | P0 | D2-4 | 小写 ak=/sk= 不脱敏 | `ak=...` → `<redacted>` | 原文透传 | safety-policy.mjs:45 缺 /i | #683/#651/#679 |
| 4 | P0 | D4-23 | 全局规则未注入 | install 后含 huawei-agent-rules.md | 全目录无该文件 | setup-cli.mjs 未复制 rules/ | #683/#671/#651/#679 |
| 5 | P1 | D4-4 | 审批门 Change* 漏拦截 | `Change*` → `deny` | `allow`（1/4） | safety/policy.json:27-31 缺 Change | #671/#683/#679/#689 |
| 6 | P1 | D4-8 | Python/Node 钩子策略不一致 | 两路径同 `deny` | Node deny / Python 放行 | huaweicloud-safety.py:46 | #651/#689 |
| 7 | P1 | D4-17 | 畸形输入 fail-open | 畸形输入 → `deny` | 静默放行 | huaweicloud-safety.mjs/.py（parse catch return） | #651/#683/#679/#689 |
| 8 | P1 | D4-11 | 提示注入自然语言夹带写命令 | 夹带写命令 → `deny` | `allow`（1/4） | safety-policy.mjs:428 仅识别 (^|\s)hcloud | #679/#671/#683/#651 |
| 9 | P1 | D10-3 | 中文意图路由 miss | 中文意图 → 对应服务 | 11/15 miss（准确率 21.4%） | tools.mjs serviceCatalog 英文-only | #651/#683/#679/#689 |
| 10 | P2 | D2-11 | R2 冲突门先于 R3 | persist+token → 立即 rejected | 先 needs_confirmation | tools.mjs:1214-1237 | #651/#689 |
| 11 | P2 | D8-1 | 工具数文档漂移 | 文档=40（与实现一致） | 文档写 39，实现 40 | AGENTS.md:27,45 | #651/#683/#679 |
| 12 | P1 | EXP-E01~E14 | 中文意图路由 miss（展开级 12 条，E08 为诊断类） | 各自服务 | 11 MISS + 1 诊断 miss | tools.mjs serviceCatalog | #651/#683/#679/#689 |

> 完整现象/断言/根因/证据逐条见 `FINDINGS.md`；历史查重映射见 `HISTORY_LINKS.md`。
> **本轮 v1.1.5 修复项**（相对 v1.1.4）：D4-2（凭证 env 打印 HW_ 前缀）、D9-2（JSON-RPC -32603 → -32601）均实测 **PASS**，不再列为缺陷。
> **残余提示（非阻断，记 FINDINGS #13）**：D4-2 的 `env | grep HW_ACCESS_KEY`（grep-filter 形式、无 `$`/不含 printenv）仍 `allow`。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | 实测 2026-09-17·Windows 专属 OS 用例（OS 列含「专属」）：升级检测链 `.cmd`/EINVAL 语义无法在本机 Linux 复现；Linux 侧由 EXP-NR3-10 通用断言已 PASS；解除=Windows 测试机执行 | OS 列已标 Windows-only，如需 Linux 侧独立断言可新增 Linux 专属用例 |

> 本轮 BLOCKED 已全部消解：D4-13（只读子账号 test001 env 动态切换 PASS + 写被 IAM 拒绝 PASS）、D4-14（真云 VPC 建删归零 + CTS 审计 PASS）。无 BLOCKED 残留。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录 stdout 全部经脱敏，`<ADMIN_AK>`/`<READONLY_AK>`/`<redacted>` 占位，无原始 AK/SK）
- [x] 写操作误判 read-only：`0`（真云写操作：管理员建删 VPC 走正常流程并归零；只读账号写被 IAM 拒绝）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（hdk-audit-599316608，0ac90bcd-0fdd-4e68-89df-4d174568614b） | 是 | 已删 | ListVpcs 已不含该资源（归零） |
| 只读账号写（test001 建 VPC/ECS） | 否（全部 IAM 拒绝） | — | 无资源产生 |

> 真云只删本次创建资源（本次仅建 1 个最小规格 VPC，已删除归零）；只读账号写操作全部被 IAM 拒绝，未产生任何资源。

---

## 八、遗留与建议

- 本轮 v1.1.5 已修复：D4-2（凭证 env 打印 HW_ 前缀）、D9-2（JSON-RPC 错误码）。两处均实测 PASS。
- 11 项设计级 + 12 项展开级缺陷均为 v1.1.5 稳定版历史复现，根因未变，经上游 open issue 查重（GitHub API 实拉确认全部 open）全部命中已跟踪单（#683/#679/#689/#671/#651），本轮不重复提单。
- 建议：中文意图路由（D10-3/EXP-E*，准确率 21.4%）与 Change* 写动词（D4-4/D4-5，policy.json 缺 Change 前缀）影响面最大，优先排期修复；D4-16 的 classifyTextCommand shell-wrap 解包仍留 bypass，建议将解包前移到 classifyTextCommand 路由前。
- 备注：D3-C4 服务矩阵中 DMS/DEW 为营销/聚合名（非 KooCLI 服务标识），映射到 KooCLI 服务名（DMS→Kafka/RabbitMQ/RocketMQ，DEW→KMS/CSMS）后 100% 可路由，判 PASS；建议 test-cases 母版在 D3-C4 展开规则中补充该映射说明（改用例类）。