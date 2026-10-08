# WorkBuddy-glm-5.2 每日测试报告

> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-09 05:15:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-09-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：PARTIAL（1 FAIL，非 P0）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | WorkBuddy + glm-5.2 |
| OS / 架构 | Windows Server 2022 (x86_64) |
| Node / npm / Python | Node v22.22.2 / npm 10 / Python 3.11.9 |
| 被测版本（SUT） | v1.1.8-next.1（npm @next，gitHead ffd7b47） |
| 工具全集 | 40+（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 已配置 |
| 真云凭证 | cn-north-4（AKSK 已配置，本轮未创建云资源） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / eval harness |
| 设计真源 | 设计级 102 / 展开级 39 / 追踪表 |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。eval harness 跑 `run-eval.mjs` 获取 serviceCatalog 路由结果。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 141（设计级 102 + 展开级 39） |
| 已执行 | 141 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 140 / 1 / 0 / 0 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 99.3% |
| P0 / P1 / P2 新增缺陷 | 0 / 1 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建云资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 102 | 有证据且通过 PASS 门禁 |
| FAIL | 0 | — |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **102** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01 serviceCatalog 路由未命中"云主机" |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P1 | `EXP-E01` | serviceCatalog 路由未命中"云主机"意图 | 意图含"云主机"时 `recommendedServices` 应包含 `"ECS"` | 返回兜底 `"Run hcloud --help to list available services."` | `tools.mjs:1978-1981` | P | 待提单 |

### 根因详情

**#1 [P1] EXP-E01 serviceCatalog 路由未命中"云主机"意图**

- 期望：意图"帮我查一下我账号在华北北京四有哪些云主机"→ `recommendedServices` 包含 `"ECS"`
- 实际：返回 `recommendedServices: ["Run hcloud --help to list available services."]`（兜底）
- 根因：`plugins/huaweicloud-core/src/tools.mjs:1978-1981`
  `serviceCatalog()` 函数 ECS 路由的 keywords 列表含 `'弹性云服务器'`、`'云服务器'`、`'服务器'`，但缺少 `'云主机'`

```javascript
keywords: [
  'ecs', 'server', 'vm', 'instance', 'compute', 'flavor', 'image',
  '弹性云服务器',
  '云服务器',
  '服务器',
  '虚拟机',
  '镜像',
],
// ← 缺少 '云主机'
```

- 证据：`evidence/EXP-E01/stdout.log`，eval harness 结果 `eval-run-20261008211025.csv`

---

## 五、未执行用例与原因

无 NOT_RUN / BLOCKED 用例。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：0
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS / VPC / OBS 等 | 否 | N/A | 本轮未创建云资源 |

> 本轮测试为源码级探针 + eval harness，未创建真云资源。

---

## 八、遗留与建议

- 待提单：EXP-E01 serviceCatalog 缺少"云主机"关键词（P1，已记入 FINDINGS.md）
- 建议：在 ECS keywords 列表添加 `'云主机'`，该词为华为云控制台及用户常用同义词
- eval harness 路由准确率：13 HIT / 1 MISS / 1 N/A = 92.9%（基线 21.4% MISS，已大幅改善）
