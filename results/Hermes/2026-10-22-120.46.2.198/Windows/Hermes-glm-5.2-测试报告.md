# Hermes-glm-5.2 每日测试报告

> **报告名**：`Hermes-glm-5.2-测试报告.md`
> **生成时间**：2026-10-22 05:30:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-22-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（149 PASS / 1 FAIL，FAIL 为已知路由 MISS 基线）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `glm-5.2` |
| OS / 架构 | `Windows 10 (MSYS_NT-10.0-20348 x86_64)` |
| Node / npm / Python | `Node v26.7.0 / npm 11.19.0 / Python 3.14.7` |
| 被测版本（SUT） | `v1.1.10`（npm latest 正式版） |
| 工具全集 | `43`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 已配置 / doctor 确认` |
| 真云凭证 | `cn-north-4（AKSK 已配置）` |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / eval harness |
| 设计真源 | 设计级 107 / 展开级 43 / 追踪表 |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；MCP 协议通过 spawn mcp-server.mjs + JSON-RPC 交互验证；eval harness 跑路由评测集。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `150` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `149 / 1 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 150） | `99.3%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 1` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（无真云资源创建/删除）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `107` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | — |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 serviceCatalog 路由 MISS（已知基线） |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P1 | `EXP-E01` | serviceCatalog 路由未命中 ECS 查询意图 | 意图"帮我查一下我账号在华北北京四有哪些云主机"应命中 ECS 服务 | 返回 "Run hcloud --help to list available services"（未命中） | `tools.mjs:2023 serviceCatalog routeMap` keywords 未匹配"云主机"+region 组合查询 | P | 待提单 |

### 根因详情

```markdown
**#1 [P1] EXP-E01 serviceCatalog 路由未命中 ECS 查询意图**

- 期望：意图"帮我查一下我账号在华北北京四有哪些云主机" → serviceCatalog 命中 ECS 服务
- 实际：返回 "Run hcloud --help to list available services"（未匹配任何服务路由）
- 根因：`plugins/huaweicloud-core/src/tools.mjs:2023` serviceCatalog 函数 routeMap
  - routeMap 中 ECS keywords 含"云服务器"、"服务器"、"虚拟机"，但不含"云主机"
  - "云主机"是华为云 ECS 的常见中文别称，缺少该 keyword 导致路由未命中
- 影响：用户用"云主机"描述 ECS 查询意图时，serviceCatalog 无法路由到 ECS 服务，给出无效的 hcloud --help 提示
- 证据：`evidence/EXP-E01/stdout.log`，eval/harness/run-eval.mjs 实测 MISS
```

---

## 五、未执行用例与原因

无未执行用例。所有 150 条用例（设计级 107 + 展开级 43）均已执行，无 NOT_RUN / BLOCKED。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 验证：DeleteServer/CreateServer/DeleteVpc/DeleteInstance 全 deny/warn）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（redactSecrets 验证通过）
- [x] 凭证文件读取拦截：D4-1 验证 cat ~/.hcloud/credentials.json → deny
- [x] 凭证 env 打印拦截：D4-2 验证 HW_SECRET_KEY/HW_SECRET_ACCESS_KEY → deny
- [x] STS token 拒绝落盘：D2-11 验证 R3 规则（tools.mjs:1098）
- [x] hook 绕过防护：D4-15/D4-16 验证大小写/编码/包裹变体全拦截

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 否 | — | 无需清理 |
| 沙箱 | 否 | — | 无需清理 |
| OBS | 否 | — | 无需清理 |

> 本轮测试以源码级探针 + MCP 协议交互为主，未创建真云资源。无残留。

---

## 八、遗留与建议

- **EXP-E01 路由 MISS**：serviceCatalog routeMap 需补充"云主机"作为 ECS keyword。已知基线问题，eval harness 准确率 92.9%（13 HIT / 1 MISS / 1 N/A），满足 ≥90% 要求。
- **D10 评测集**：eval/harness/run-eval.mjs 已跑出基线，路由准确率从 21.4% MISS 改善至 7.1% MISS（92.9% 准确率）。
- 建议：补充 serviceCatalog routeMap 的中文同义词覆盖（云主机→ECS、云盘→EVS 等）。
