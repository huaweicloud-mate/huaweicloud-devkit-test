# WorkBuddy-GLM-5.2 每日测试报告

> **报告名**：`WorkBuddy-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-01 05:35:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-01-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（140/141 PASS，1 FAIL 为 P1 路由 MISS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `GLM-5.2` |
| OS / 架构 | `Windows Server 2022 Standard` |
| Node / npm / Python | `Node v22.22.2 / npm 12.1.0 / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.8-next.1`（npm @next，gitHead `ffd7b47`） |
| 工具全集 | `41`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 已配置（doctor 确认）` |
| 真云凭证 | `cn-north-4（AKSK 已配置，未使用真云 E2E）` |
| 测试类型 | 源码级探针 / MCP 协议 / 评测集路由 |
| 设计真源 | 设计级 102 / 展开级 39 / 追踪表 |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；eval harness 跑 serviceCatalog 路由评测集；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141` |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `140 / 1 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `99.3%` |
| P0 / P1 / P2 新增缺陷 | `0 / 1 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（未创建真云资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `101` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 路由 MISS（serviceCatalog 未识别"云主机"意图） |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `39` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 无 |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

> **注**：EXP-E01 在展开级属 P1，路由 MISS 为 1 条 FAIL。

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P1 | `EXP-E01` | serviceCatalog 路由未识别"云主机"意图 | `serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 应路由到 `ECS` | 路由 MISS（返回 `Run hcloud --help to list available services.`） | `plugins/huaweicloud-core/src/tools.mjs:serviceCatalog routeMap` | P | 待提单 |

### 根因详情

```markdown
**#1 [P1] EXP-E01 serviceCatalog 路由未识别"云主机"意图**

- 期望：`service_catalog({ intent: "帮我查一下我账号在华北北京四有哪些云主机" })` → 路由到 ECS
- 实际：路由 MISS（返回推荐 `Run hcloud --help to list available services.`）
- 根因：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog routeMap
  routeMap 使用"云服务器"关键词匹配 ECS，但用户意图"云主机"未纳入路由关键词。
  "云主机"是华为云控制台/文档中对 ECS 的常用别名，应被 routeMap 识别。

- 证据：`evidence/EXP-E01/stdout.log`，eval harness 结果 `MISS (expected=ECS, actual=Run hcloud --help)`
```

---

## 五、未执行用例与原因

无未执行用例。所有 141 条用例（设计级 102 + 展开级 39）均已实际执行并落盘证据。

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
| 真云资源 | 否 | 不适用 | 不适用（未创建真云资源） |

> 本轮测试为源码级探针 + MCP 协议 + 评测集路由，未创建真云资源。

---

## 八、遗留与建议

- **EXP-E01 路由 MISS**：serviceCatalog routeMap 需增加"云主机"→ECS 路由关键词（P1 缺陷，已记入 FINDINGS.md）
- **路由准确率**：15 条评测集 13 HIT / 1 MISS / 1 N/A，准确率 92.9%（基线 21.4% MISS 已改善）
- **建议**：routeMap 增加"云主机"别名映射到 ECS
