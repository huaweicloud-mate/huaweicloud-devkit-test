# WorkBuddy-GLM-5.2 每日测试报告

> **报告名**：`WorkBuddy-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-24 10:30:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-09-24-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：PARTIAL（4 条设计级 FAIL + 11 条展开级 FAIL，含 2 条 P0，均为历史问题复现）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | WorkBuddy + GLM-5.2 |
| OS / 架构 | Windows Server 2022 (10.0.20348) x64 |
| Node / npm / Python | Node v22.22.2 / npm 12.1.0 / Python 3.11.9 |
| 被测版本（SUT） | v1.1.6（npm @latest，gitHead 46152dd） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS，MCP `tools/list` 实测 40） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 确认已配置 |
| 真云凭证 | cn-north-4（AKSK / 未使用真云 E2E 本次） |
| 测试类型 | 源码级模块直调 / MCP 协议探针 / eval harness / 源码静态检查 |
| 设计真源 | 设计级 102 / 展开级 39 / 追踪表 211 |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：本次为**全新一轮真机执行**（非复用历史证据）。14 个分组探针（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（safety-policy/risk-rule-engine/update-check/credentials/mcp-protocol/hcloud-cli/tools.mjs 等），结果落 `evidence/<group>/stdout.log`（JSON，含 results 数组），再提取为 `evidence/<case-id>/stdout.log`（per-case 格式，供 backfill_daily.py 批量回填）。覆盖 D1~D10 全维度 + C4 服务矩阵 22 服务 + D5 客户端矩阵 + E01~E15 评测集。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 102 + 展开级 39 = 141 |
| 已执行 | 141（100%） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 126 / 15 / 0 / 0 / 0 |
| 通过率（分母 = PASS+FAIL，不含 BLOCKED/NOT_RUN） | 89.4%（126/141） |
| P0 / P1 / P2 缺陷 | 2 / 2 / 1（均为历史问题复现） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 不涉及（本次未执行真云建删资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 98 | 有证据且通过 PASS 门禁 |
| FAIL | 4 | D4-16/D4-23/D4-26/D4-27（历史问题复现） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **102** | P0: 19 PASS / 2 FAIL |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 28 | C4 服务矩阵 22 + D5 客户端矩阵 5 + D9 协议 2 - 1 N/A |
| FAIL | 11 | EXP-E01~E14 serviceCatalog 路由 MISS（历史问题） |
| BLOCKED | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | 全部为 P1 |

### 3.3 追踪表

| 状态 | 数量 |
|---|---|
| 已回填执行时间 | 0（追踪表无执行状态列，仅回填执行时间） |
| 合计 | 211 |

---

## 四、缺陷清单

> 完整缺陷详情见 `FINDINGS.md`。所有缺陷均为**历史问题复现**（上游已有 open issue），本次为复核。

| # | 级别 | 用例 ID | 标题 | 状态 |
|---|---|---|---|---|
| 1 | P0 | D4-16 | 命令包裹穿透（sh -c 未拦截） | 历史问题 |
| 2 | P0 | D4-23 | huawei-agent-rules.md 全局规则未注入 | 历史问题 |
| 3 | P1 | D4-27 | 双路径输出脱敏不一致 | 历史问题 |
| 4 | P2 | D4-26 | findings 证据脱敏不完整（同 #3） | 历史问题 |
| 5 | P1 | EXP-E01~E14 | serviceCatalog 中文意图路由 21.4% | 历史问题 |

---

## 五、未执行用例与原因

无未执行用例。所有 141 条用例（设计级 102 + 展开级 39）均已执行并回填。

---

## 六、安全/红线

| 检查项 | 结果 |
|---|---|
| 真云 AK/SK 泄露 | 无（探针使用测试值，非真实凭证） |
| 真云资源残留 | 无（本次未执行真云建删资源操作） |
| PASS 门禁（verify_no_fake_pass） | 通过（所有 PASS 用例均有 evidencePath 且证据存在） |
| 覆盖率门禁（verify_coverage） | 通过（P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%） |
| 虚报检查 | 无虚报（所有 FAIL 均有实测证据） |

---

## 七、资源释放

本次测试未创建任何真云资源（源码级探针 + MCP 协议探针 + eval harness），无需清理。

---

## 八、遗留建议

1. **D4-16 命令包裹穿透**：`classifyTextCommand` 应扩展 `sh -c` 包裹检测（当前仅覆盖 `bash -c`），建议在 safety-policy.mjs 的包裹检测正则中添加 `sh\s+-c` 模式。
2. **D4-23 规则注入**：`setup-cli.mjs` 应增加 `rules/huawei-agent-rules.mdc` 文件的复制/注入逻辑，在安装时将其复制到各客户端插件目录。
3. **D4-27/D4-26 脱敏**：`redactSecrets` 应扩展字段名正则，覆盖 `"ak":`/`"sk":`/`"accessKeyId":` 等 JSON 字段名变体。
4. **EXP-E01~E14 路由**：`serviceCatalog` 应扩展中文意图词表，覆盖"云主机"/"云服务器"/"弹性公网IP"/"云数据库"/"函数"/"费用"/"用户权限"等常见中文表述。

> 以上 5 项缺陷均为历史问题（上游已有 open issue），本次为复核确认仍未修复。历史关联单号见 `HISTORY_LINKS.md`。
