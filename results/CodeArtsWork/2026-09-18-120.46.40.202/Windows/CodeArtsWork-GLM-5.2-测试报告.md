# CodeArtsWork-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsWork-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-18 07:57:27（北京时间）
> **执行归档**：`results/CodeArtsWork/2026-09-18-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 16 个 FAIL，其中 3 个 P0 FAIL、11 个评测路由 FAIL、1 个 P1 安全 FAIL、1 个 P1 路由 FAIL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsWork + GLM-5.2 |
| OS / 架构 | Windows (win32) |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.11.15 |
| 被测版本（SUT） | `v1.1.5`（npm latest，gitHead `e7ed6f66`） |
| 工具全集 | 40+（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 未在 PATH（npx 调用正常）/ doctor 确认已配置 |
| 真云凭证 | cn-north-4（AKSK 已配置，readonly 子账号已配置） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / eval harness |
| daily 基础用例 | 设计级 80 / 展开级 39 |

> **执行方法**：MCP 工具直调 + 源码检查 + eval harness；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 119 |
| 已执行 | 119 |
| PASS / FAIL / NOT_RUN | 102 / 16 / 1 |
| 通过率（分母 = PASS+FAIL = 118） | 86.4% |
| P0 / P1 / P2 新增缺陷 | 3 / 13 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（无真云资源创建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 75 | 有证据且通过 PASS 门禁 |
| FAIL | 5 | D1-39, D4-2, D4-3, D4-6, D10-3 |
| NOT_RUN | 0 | 无 |
| BLOCKED | 0 | 无 |
| SPEC-MISMATCH | 0 | 无 |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 27 | EXP-D5-4-1/3, EXP-C4-01~22, EXP-E06/E09/E15 |
| FAIL | 11 | EXP-E01~E05, E07, E10~E14（eval 路由 MISS） |
| NOT_RUN | 1 | EXP-E08（诊断类 N/A，eval harness 标记 N/A） |
| BLOCKED | 0 | 无 |
| SPEC-MISMATCH | 0 | 无 |

---

## 四、缺陷清单

| # | 用例 | 优先级 | 缺陷描述 | 根因 |
|---|---|---|---|---|
| 1 | D4-2 | P0 | 凭证env打印拦截缺失 HW_ 前缀 | `cloud-risk-rules.json` 规则 `hwc-command-env-dump` regex 缺 `HW_` 前缀 |
| 2 | D4-3 | P0 | 明文secret API拦截缺失 ShowSecret 模式 | `cloud-risk-rules.json` 规则 `hwc-command-secret-value-read` regex 缺 `ShowSecret` |
| 3 | D1-39 | P0 | Windows 升级检测链失败 | `update-check.mjs` `queryDistTagsSync`/`queryDistTagsFetch` Windows 下无法获取 dist tags |
| 4 | D4-6 | P1 | adminPass 参数回显无警告 | `cloud-risk-rules.json` 无 adminPass 参数检测规则 |
| 5 | D10-3 | P1 | serviceCatalog 中文意图路由准确率 21.4% | `tools.mjs` `serviceCatalog` 中文关键词匹配覆盖不足 |
| 6 | EXP-E01~E14 | P1 | 11/15 中文意图路由 MISS | 同 D10-3 根因 |

---

## 五、未执行用例与原因

| 用例 | 层级 | 优先级 | 状态 | 分类 | 原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| EXP-E08 | 展开级 | P1 | NOT_RUN | 【改用例】 | eval harness 标记 N/A（诊断类意图，非路由判定用例） | 建议将 EXP-E08 从路由判定集移至诊断类，不计入路由准确率分母 |

---

## 六、安全/红线

- **真云资源**：本次测试未创建真云资源（源码级探针 + CLI 只读 + eval harness），无残留。
- **凭证安全**：AK/SK 未泄露到日志/报告；hook_check_command 拦截凭证文件读取（D4-1 PASS）。
- **PASS 门禁**：`verify_no_fake_pass.py` 通过，所有 PASS 用例均有 evidencePath 且证据存在。
- **覆盖率门禁**：`verify_coverage.py` 通过，P0 无 NOT_RUN/空，NOT_RUN+空占比 2.6% ≤ 15%。

---

## 七、资源释放

- 真云资源：无创建，无需释放。
- 临时文件：evidence/ 目录下探针文件为测试产物，保留作为证据。

---

## 八、遗留建议

1. **D4-2/D4-3**：`cloud-risk-rules.json` 需补充 `HW_` 前缀和 `ShowSecret` 模式到对应 regex。
2. **D1-39**：Windows 下 `update-check.mjs` dist tags 获取需修复（spawn `npm view` 或 fetch 网络问题）。
3. **D4-6**：需新增 adminPass 参数检测规则到 `cloud-risk-rules.json`。
4. **D10-3/EXP-E**：`serviceCatalog` 中文关键词匹配需扩展覆盖（11 条中文意图未命中）。
5. **EXP-E08**：建议从路由判定集移至诊断类，不计入路由准确率分母。
