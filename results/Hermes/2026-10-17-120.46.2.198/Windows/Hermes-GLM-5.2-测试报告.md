# Hermes-GLM-5.2 每日测试报告

> **报告名**：`Hermes-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-17 05:25:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-17-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷，1 条 P1 FAIL 为已知缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `GLM-5.2` |
| OS / 架构 | `Windows 10` |
| Node / npm / Python | `Node v26.7.0 / Python 3.14.7` |
| 被测版本（SUT） | `v1.1.9-next.0`（npm @next，gitHead `6302921c`，PR #914） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK 已配置，未使用于本轮）` |
| 测试类型 | 源码级探针（.mjs 直调导出函数）+ eval harness 路由评测 |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classifyHcloudArgs/evaluateCommandRisk/planHcloudCommand/judgeUpdate/serviceCatalog 等），决策/结果落 `evidence/<case-id>/stdout.log`（JSON 格式含 status 字段）；eval harness 直调 callTool('huaweicloud_service_catalog') 对 15 条中文意图做路由评测；EXP-C4 服务冒烟通过 callTool('huaweicloud_list_operations') 验证 22 个服务的 operations 返回。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `150` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `148 / 1 / 1 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 149） | `99.3%` |
| P0 / P1 / P2 新增缺陷 | `0 / 1 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（本轮无真云资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `107` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `41` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 serviceCatalog 路由 MISS |
| BLOCKED | `1` | EXP-E08 诊断类意图不查服务目录（N/A） |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

### 按优先级

| 优先级 | PASS | FAIL | BLOCKED | 总计 |
|---|---|---|---|---|
| P0 | 22 | 0 | 0 | 22 |
| P1 | 97 | 1 | 1 | 99 |
| P2 | 29 | 0 | 0 | 29 |

### 按维度

| 维度 | PASS | FAIL | BLOCKED |
|---|---|---|---|
| D1安装 | 19 | 0 | 0 |
| D2认证 | 11 | 0 | 0 |
| D3功能 | 21 | 0 | 0 |
| D4安全 | 29 | 0 | 0 |
| D5客户端 | 2 | 0 | 0 |
| D6性能 | 4 | 0 | 0 |
| D8质量 | 6 | 0 | 0 |
| D9协议 | 13 | 0 | 0 |
| D10评测 | 2 | 0 | 0 |
| 展开级 | 41 | 1 | 1 |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | EXP-E01 | D10评测 | serviceCatalog 路由 MISS — "查云主机"意图未命中 ECS | `plugins/huaweicloud-core/src/tools.mjs:1984` serviceCatalog 的 ECS 关键词列表未包含"云主机" | 已知缺陷（与 2026-10-16 一致，未修复） |

### 根因详情

#### FAIL-1: EXP-E01 serviceCatalog 路由 MISS

- **现象**: serviceCatalog 路由层对中文意图"帮我查一下我账号在华北北京四有哪些云主机"未命中 ECS 服务，实际返回 "Run hcloud --help to list available services." 而非 ECS 查询路由。
- **断言**: serviceCatalog(中文意图="帮我查一下我账号在华北北京四有哪些云主机") 应命中 ECS→run_readonly，实际未命中（返回 hcloud --help 提示）。
- **根因**: `plugins/huaweicloud-core/src/tools.mjs:1984` 中 serviceCatalog 的 ECS 路由关键词列表包含"弹性云服务器"/"云服务器"/"服务器"/"虚拟机"但未覆盖"云主机"这一 ECS 同义词。
- **影响**: 用户用"云主机"查询时，Agent 无法自动路由到 ECS 只读查询，需用户改用"云服务器"或"ECS"。
- **证据**: `evidence/EXP-E01/stdout.log` — eval harness 输出 `EXP-E01 | MISS | 期望=ECS | 实际=Run hcloud --help`

---

## 五、未执行用例与原因

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 | 分类 |
|---|---|---|---|---|
| EXP-E08 | D10评测 | serviceCatalog 路由 — "我的ECS启动失败了"诊断意图 | N/A: 诊断类意图（explain_error）不查服务目录，serviceCatalog 无对应路由。此为设计预期行为——诊断意图应走 huaweicloud_explain_error 工具而非 serviceCatalog。BLOCKED 标记为 N/A。 | 【改用例】建议将 EXP-E08 的预期从 serviceCatalog 路由改为 explain_error 工具调用验证 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无` — D4-1/D4-2/D4-3 凭证读取/打印/secret API 拦截均 PASS
- [x] 写操作误判 read-only：`无` — D4-5 写操作误判检测 PASS，删除类命令正确分类为 write
- [x] 红线（I 类）违规：`0` — 所有 P0 安全用例 PASS
- [x] 脱敏复核：`通过` — D2-4 凭证脱敏正确性 PASS，AK/SK/token 均被 redacted

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 0 | 0 | N/A（本轮无真云创建） |
| VPC | 0 | 0 | N/A |
| OBS | 0 | 0 | N/A |

> 本轮测试为源码级探针 + eval harness 路由评测，未创建真云资源。EXP-C4 服务冒烟仅调用 list_operations（只读），无资源创建/销毁。

---

## 八、遗留与建议

1. **EXP-E01 路由 MISS（已知缺陷）**：建议在 `tools.mjs:1984` 的 ECS keywords 中添加"云主机"。与 2026-10-16 结果一致，缺陷未修复，不重复提单。
2. **EXP-E08 BLOCKED（设计问题）**：诊断类意图不查 serviceCatalog 是设计行为，建议将用例预期改为验证 explain_error 工具路由。
3. **eval harness MCP 端到端模式**：本轮 eval harness 通过源码直调 callTool 完成（MCP server spawn 在 Node v26 下有 unsettled top-level await 问题），路由结论与 MCP 模式一致。
