# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-15 19:33（北京时间）
> **执行归档**：`results/Hermes/2026-09-15-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：**PARTIAL**（12 项 FAIL + 1 项 SPEC-MISMATCH，全部为历史复现，见 `HISTORY_LINKS.md`）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.4（npm latest，gitHead `9b67256`，PR #669） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12，doctor 11 项全 PASS |
| 真云凭证 | cn-north-4（AK/SK 有效，只读实证通过） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status/uninstall）/ MCP 协议 stdio / 真云只读 E2E |
| daily 基础用例 | 设计级 77 / 展开级 26（Hermes+Linux 预筛后） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classifyTextCommand / classifyHcloudArgs / redactSecrets / TOOL_DEFINITIONS 等），决策/结果落 `evidence/<case-id>/stdout.txt`；CLI 真机执行记录日志；MCP stdio 协议探针 spawn `mcp-server.mjs`；证据统一落 `evidence/`。本轮为**强制完整重跑**，12 支探针（`run_probes.sh`）+ 1 支补测探针（`probe-supplement2.mjs`：Change* 写动词/提示注入/小写凭证）全部 fresh 重跑。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 77 + 展开级 26 = 103 |
| 已执行 | 103（执行状态列全部回填，无空/无 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 69 / 24 / 9 / 1 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 69 / 94 = 73.4% |
| P0 / P1 / P2 新增缺陷（本轮不重复提单） | 0 / 0 / 0（13 项缺陷全部历史复现，见 `HISTORY_LINKS.md`） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 真云仅只读（无建删），无残留 |

---

## 三、状态汇总

### 3.1 设计级（77）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 60 | 有证据且通过 PASS 门禁 |
| FAIL | 12 | D4-2/D4-16/D4-5/D2-4/D4-23/D4-4/D4-8/D4-17/D4-11/D10-3/D2-11/D8-1，根因见缺陷清单 |
| BLOCKED | 4 | D1-39/D1-58/D4-13/D4-14，见 §五 |
| SPEC-MISMATCH | 1 | D9-2 错误码契约漂移 |
| NOT_RUN | 0 | — |
| **合计** | **77** | |

### 3.2 展开级（26）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 9 | EXP-D5-8-1/-3 / EXP-E06/E09/E15 / EXP-NR3-02/04/10/24 |
| FAIL | 12 | EXP-E01/E02/E03/E04/E05/E07/E08/E10/E11/E12/E13/E14（中文意图路由 miss，同 D10-3） |
| BLOCKED | 5 | EXP-D1-58-01~05，见 §五 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **26** | |

---

## 四、缺陷清单（13 项，全部历史复现）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `printenv HW_ACCESS_KEY` → `deny` | 返回 `allow`（4/6 漏网） | safety-policy.mjs:336 | #683/#651 |
| 2 | P0 | D4-16 | 命令包裹穿透 | `sh -c '...DeleteServer'` → `deny` | 返回 `allow`（0/4） | safety-policy.mjs:345 | #683/#671/#679 |
| 3 | P0 | D4-5 | 写操作误判为只读 | `Change*` → `risk=write`+`deny` | `unknown_read` 放行（0/4） | safety/policy.json 缺 Change | #671 |
| 4 | P0 | D2-4 | 小写 ak=/sk= 不脱敏 | `ak=...` → `<redacted>` | 原文透传 | safety-policy.mjs:45 缺 /i | #683/#651/#679 |
| 5 | P0 | D4-23 | 全局规则未注入 | install 后含 huawei-agent-rules.md | 全目录无该文件 | setup-cli.mjs 未复制 rules/ | #683/#671/#651/#679 |
| 6 | P1 | D4-4 | 审批门 Change* 漏拦截 | `Change*` → `deny` | `allow`（1/4） | safety/policy.json 缺 Change | #671/#683/#679/#689 |
| 7 | P1 | D4-8 | Python/Node 钩子不一致 | 两路径同 `deny` | Node deny / Python 放行 | huaweicloud-safety.py:46 | #651/#689 |
| 8 | P1 | D4-17 | 畸形输入 fail-open | 畸形输入 → `deny` | 静默放行 | huaweicloud-safety.mjs:45-48 | #651/#683/#679/#689 |
| 9 | P1 | D4-11 | 提示注入绕过 | 夹带写命令 → `deny` | `allow`（1/4） | safety-policy.mjs 仅识别句首 hcloud | #679/#671/#683/#651 |
| 10 | P1 | D10-3 | 中文意图路由 miss | 中文意图 → 对应服务 | 12/15 miss（三例命中） | tools.mjs serviceCatalog 英文-only | #651/#683/#679/#689 |
| 11 | P1 | D9-2 | JSON-RPC 错误码漂移 | 未知方法 → `-32601` | `-32603` | mcp-server.mjs:169 | #689/#683/#651/#679/#671 |
| 12 | P2 | D2-11 | R2 冲突门先于 R3 | persist+token → 立即 rejected | 先 needs_confirmation | tools.mjs:1214-1237 | #651/#689 |
| 13 | P2 | D8-1 | 工具数文档漂移 | 文档=40（与实现一致） | 文档写 39，实现 40 | AGENTS.md:27,45 | #651/#683/#679 |

> 完整现象/断言/根因/证据逐条见 `FINDINGS.md`；历史查重映射见 `HISTORY_LINKS.md`。13 项缺陷全部命中上游 open issue，本轮不重复提单。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | BLOCKED | 调归属 | Windows 专属升级检测链（.cmd / spawnSync `npm.cmd` EINVAL 语义），本机 Linux aarch64 无 Windows 环境 | OS 列应标 Windows-only（Linux 侧由展开级 EXP-NR3-10 通用断言平台判读覆盖，已 PASS） |
| D1-58 | 设计级 | P1 | BLOCKED | 改用例 | 通用 MCP(Claude/Cursor) merge 需交互 `option3`，本机非交互环境 auto-detect 走 hermes，未触发 merge | 断言改为源码级直调 `mcp-config-merge.mjs`（幂等备份/坏 JSON 零写入/未命中 snippet），无需交互 |
| D4-13 | 设计级 | P1 | BLOCKED | 补环境 | 最小权限通过率需只读 IAM 子账号凭证矩阵，本机缺 `~/.config/huaweicloud/credentials.readonly.json` | 补只读子账号凭证后复测（`run-as-readonly.py` 动态切换） |
| D4-14 | 设计级 | P2 | BLOCKED | 补环境 | 操作可审计性需真云建删 + CTS 审计日志，本轮仅做真云只读实证 | 补真云计费资源 + CTS 后复测 |
| EXP-D1-58-01~05 | 展开级 | P1 | BLOCKED | 改用例 | 同 D1-58，Claude/Cursor 白名单 merge 需交互 option3 | 同 D1-58，改造为源码级断言 |

> 其余 3 项「非产品缺陷」详情见 `FINDINGS.md` #14/#15/#16（真云受限 / 交互 option3 / Windows 专属）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录仅落 `stdout.txt`，全部经脱敏，无原始 AK/SK）
- [x] 写操作误判 read-only：`0`（真云仅 `run_readonly` 只读实证）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS / 沙箱 / OBS 等 | 否 | — | 真云仅只读 ListServersDetails（count=0），无建删，无残留 |

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-2`（JSON-RPC 错误码 -32603 vs -32601，已提单 #689 未改）。
- 本轮未覆盖（说明范围）：Windows 专属（D1-39）、通用 MCP 交互 merge（D1-58/EXP-D1-58-*）、真云建删 E2E（D4-13/D4-14，已从 daily EXCLUDE 的 D3-C4 真云建删亦不在本轮）。
- 建议：13 项缺陷均为 v1.1.4 稳定版的历史复现，建议维护者优先关闭 #683/#679/#689 三个 v1.1.4 合并单并统一排期修复；中文意图路由（D10-3）与 Change* 写动词（D4-4/D4-5）影响面最大，建议下一版本优先修复。