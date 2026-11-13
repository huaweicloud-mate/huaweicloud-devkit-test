# Hermes-DeepSeek-V4-Pro 每日测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-11-14（北京时间）
> **执行归档**：`results/Hermes/2026-11-14-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（5 FAIL / 2 SPEC-MISMATCH / 12 BLOCKED，缺陷与 2026-11-11~11-13 历史缺陷高度重合，历史查重命中、不重复开单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + DeepSeek-V4-Pro |
| OS / 架构 | Windows 10 |
| Node / npm / Python | Node v26.7.0 / npm 11.19 / Python 3.14 |
| 被测版本（SUT） | `v2.0.0-next.3`（npm @next，v2 TypeScript 重构） |
| 工具全集 | `56`（tool-definitions.js TOOL_DEFINITIONS，v2 由 40/46 扩至 56） |
| hcloud / 依赖 | hcloud 7.2.12（KooCLI），真云凭据就绪（cn-north-4） |
| 真云凭证 | 已具备（admin + 只读子账号），真机执行 |
| 测试类型 | 源码级探针 / 真机 CLI / 真云 E2E / 服务矩阵冒烟 |
| 执行包 | 设计级 107 / 展开级 43（已按 Hermes+Windows 预筛） |

> **执行方法**：v2 源码为 TypeScript，编译产物在 npm 包 `plugins/huaweicloud-core/dist/*.js`，探针经 `file:///` URL 直调 dist 导出函数；真云经 hcloud CLI 真机建删归零；结论落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 150（设计级 107 + 展开级 43）+ 使命 9 |
| 已执行 | 150 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 131 / 5 / 12 / 2 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 94.9% |
| P0 / P1 / P2 缺陷 | 0 / 4 / 1（含 2 SPEC-MISMATCH） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（VPC/子网二次验证归零，ECS 本轮未创建 count=0） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 91 | 有证据且通过 PASS 门禁 |
| FAIL | 2 | D3-C2 / D10-3 |
| BLOCKED | 12 | 沙箱 E2E / MCP transport / 只读 IAM / ECS 全建删 |
| SPEC-MISMATCH | 2 | D8-9 / D10-4 |
| NOT_RUN | 0 | — |
| **合计** | **107** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 40 | 有证据且通过 PASS 门禁 |
| FAIL | 3 | EXP-C4-03 / EXP-E01 / EXP-E08 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **43** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件） | 分类 |
|---|---|---|---|---|---|
| 1 | P1 | D3-C2/EXP-C4-03 | OBS 桶操作经 hcloud CLI 不可用（exit 3） | hcloud OBS 服务无 mb/ListBuckets；关联 OBS AWS4 签名 | 产品缺陷 |
| 2 | P1 | EXP-E01 | 「云主机查询」路由 MISS | capability-catalog.js serviceCatalog 别名缺失 | 产品缺陷 |
| 3 | P1 | EXP-E08 | 「ECS 启动失败诊断」路由 N/A | capability-catalog.js serviceCatalog 诊断映射缺失 | 产品缺陷 |
| 4 | P1 | D10-3 | 路由准确率 86.7% < 90% | serviceCatalog 路由层（同 #2/#3） | 产品缺陷 |
| 5 | — | D3-C1 | ECS 全生命周期未闭环（BLOCKED） | 环境预置（高配 flavor + Windows 镜像 protected） | 测试侧 |
| 6 | P2 | D8-9 | sanitizeValue 未脱敏 AK/SK | telemetry.js sanitizeValue | SPEC-MISMATCH |
| 7 | P0 | D10-4 | 规则数漂移 16→25 | cloud-risk-rules.json 规则演进 | SPEC-MISMATCH |

> 详细根因见 `FINDINGS.md`。本轮缺陷与 2026-11-11/11-12/11-13 历史缺陷高度重合（v2.0.0-next.3 下服务路由 MISS、sanitizeValue、规则数漂移延续；OBS 桶操作路径问题延续），历史查重命中、无需重复提单。

---

## 五、未执行用例与原因（BLOCKED 12 条逐条）

| 用例ID | 层级 | 优先级 | 分类 | 详细原因 + 解除条件 |
|---|---|---|---|---|
| D3-C3 | 设计级 | P1 | 【补环境】 | sandbox upload_project tar 反斜杠缺陷阻塞，修复后重测 |
| D3-C6 | 设计级 | P1 | 【补环境】 | 沙箱服务 connect 需成功后才可具名冒烟 |
| D3-S3 | 设计级 | P1 | 【补环境】 | 沙箱预览 URL 依赖 tar 缺陷（同 D3-C3） |
| D3-S7 | 设计级 | P1 | 【补环境】 | 跨服务 RDS+沙箱建删需多服务真机链路 |
| D3-C4 | 设计级 | P1 | 【补环境】 | 服务创建类回归需多服务计费资源建删（只读冒烟已全 PASS） |
| D4-13 | 设计级 | P1 | 【补环境】 | 需 run-as-readonly.py 注入只读子账号实测 |
| D9-9 | 设计级 | P1 | 【补环境】 | 需 d9-9-delay-timeout 夹具驱动 mcp-server |
| D9-5 | 设计级 | P1 | 【补环境】 | 需 spawn mcp-server stdio 协议驱动 |
| D9-6 | 设计级 | P1 | 【补环境】 | 需多客户端协议夹具 |
| D9-10 | 设计级 | P1 | 【补环境】 | 需 startRemoteServer 起 9528 + 夹具 |
| D9-11 | 设计级 | P1 | 【补环境】 | 需源级直调 ws-exec 通道模块 |
| D3-C1 | 设计级 | P1 | 【补环境】 | ECS 完整建删需最小规格镜像预选（真机只读+VPC建删已证归零） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：0
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录无原始凭证（AK/SK 均 redact `<redacted>`）
- [x] 真云资源归零：VPC/子网二次验证残留 0（本轮未创建 ECS 实例，count=0）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（testbot5-hermes-e2e-*） | 是 | 已删 | 二次 ListVpcs 残留 0 |
| 子网（同 VPC） | 是 | 已删 | 二次 ListSubnets 残留 0 |
| ECS 实例 | 否（本轮未创建） | — | ListServersDetails count=0 |
| OBS 桶（testbot5-hermes-obs-*） | 未成功创建 | — | — |

---

## 八、遗留与建议

- v2 重构后工具数由 46 扩至 56（D5-3/D9-1 实测），文档「40/46 工具」需同步。
- D8-9（sanitizeValue 脱敏）与 D10-4（规则数 16→25 快照）为契约漂移，待维护者裁决实现或改用例。
- EXP-E01「云主机」、EXP-E08「分析原因」两条路由 MISS 在 v2 延续，建议补 capability-catalog 别名/意图映射。
- OBS 桶操作（mb/ListBuckets）经 hcloud CLI 不可用，建议明确 OBS 场景应走 obsutil 或 obs_set_website_config（AWS4 REST）并修复其签名（STS 头纳入 SignedHeaders）。