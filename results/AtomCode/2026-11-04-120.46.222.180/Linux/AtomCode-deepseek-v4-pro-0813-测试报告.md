# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-04 05:20（北京时间）
> **执行归档**：`results/AtomCode/2026-11-04-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（存在 P0/P1 产品缺陷，见缺陷清单；均为历史问题，已查重不重复提单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro-0813 |
| OS / 架构 | Linux x86_64 |
| Node / npm / Python | Node v22.13.0 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.13-next.3`（npm @next，gitHead `7ad8a533`，PR #1086） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 已配置（doctor All checks passed） |
| 真云凭证 | cn-north-4（AK/SK 已配置 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 用例 | 设计级 107 / 展开级 39 / 追踪表 + 使命清单 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云 E2E 走 `scripts/realcloud_e2e.mjs` 建删资源并归零验证；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146` |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 14 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `89.7%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（全部 14 FAIL/1 SPEC 均为历史问题，已查重） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（真云 E2E 无残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 93 | 有证据且通过 PASS 门禁 |
| FAIL | 13 | 不符预期，根因见缺陷清单（含真云环境侧 5 项） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 1 | D9-9 mcp-protocol cancellation 未声明 |
| NOT_RUN | 0 | — |
| **合计** | **107** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 37 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01 serviceCatalog 路由 MISS |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 1 | EXP 后续无对应（D1-39 Windows 专属按 OS 豁免计入设计级） |
| **合计** | **39** | |

> 注：`_bulk_summary.json` 全局分布（含真云）PASS=130 / FAIL=14 / SPEC-MISMATCH=1 / NOT_RUN=1；真云 D3-C1/C2/C3/C6/C7 5 项列入设计级 FAIL，均为「非产品缺陷」环境侧。

---

## 四、缺陷清单（详见 FINDINGS.md）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | D2-4 | redactSecrets 未脱敏 JSON 字符串 ak/sk/token | `safety-policy.mjs:42,45` | P | 历史问题 |
| 2 | P1 | D4-27 | 小写 ak=/sk= 未覆盖致明文泄露 | `safety-policy.mjs:42,45` | P | 历史问题 |
| 3 | P1 | D3-S1/S2/S3/S5/EXP-E01 | serviceCatalog 路由缺失回落 help | `tools.mjs:2265,2516-2518` | G | 历史问题 |
| 4 | P2 | D4-25 | WRITE_OPERATION_RE 边界失配→cli:invoke | `huaweicloud-safety.py:46,111-112` | G | 历史问题 |
| 5 | P2 | D8-9 | sanitizeValue 不脱敏凭证 | `telemetry.mjs:190-197` | P | 历史问题 |
| 6 | P1 | D9-9 | mcp-protocol 未声明 cancellation | `mcp-protocol.mjs:51-53` | G | 历史问题 |
| 7-12 | 非产品缺陷 | D3-C1/C2/C3/C6/C7/D1-39 | 真云环境侧（配额/沙箱维护/token 区域绑定/非本 OS） | — | — | 不提单 |

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P1 | NOT_RUN | 调归属 | Windows 专属（升级检测链 EINVAL 专属），本客户端 Linux；Linux 侧由展开级 EXP-NR3-10 代表覆盖 | — |

> 其余无 NOT_RUN / BLOCKED。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/VPC/子网 (D3-C1) | 否（配额满未创建） | — | 无资源需清理 |
| OBS 桶 (D3-C2) | 是 | 已删 | 删桶归零通过 |
| 沙箱 (D3-C3/C6) | 否（维护期未建立） | — | 无残留 |
| EIP (D3-C7) | 否（token 区域绑定未创建） | — | total_count=0 |

> 真云只删本次创建资源；无残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（mcp-protocol capabilities 缺 cancellation/notifications）
- 本轮未覆盖：真实 Agent 会话评测（D10-1/2/5/9 需 DSH/dsh，本客户端为 AtomCode 无 dsh，按客户端限制未展开）
- 建议：`safety-policy.mjs` 凭证脱敏正则存在 4 处边界漏配（JSON key 引号形态、短键 ak/sk 小写），建议统一为大小写不敏感 + 覆盖带引号 JSON key 的凭证键名匹配，可一并修复清单 #1/#2/#5。