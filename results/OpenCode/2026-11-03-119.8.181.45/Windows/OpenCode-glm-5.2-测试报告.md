# OpenCode-glm-5.2 每日测试报告

> **报告名**: `OpenCode-glm-5.2-测试报告.md`
> **生成时间**: 2026-11-03 05:17:00（北京时间）
> **执行归档**: `results/OpenCode/2026-11-03-119.8.181.45/Windows/`
> **被测对象**: huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**: PARTIAL（1 FAIL + 13 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenCode + glm-5.2 |
| OS / 架构 | Windows (win32) |
| Node / npm / Python | Node v22.22.2 / npm 12.1.0 / Python 3.11.9 |
| 被测版本（SUT） | v1.1.13-next.0（npm @next，gitHead 47170d1f） |
| 工具全集 | 46（tools/list 实测） |
| hcloud / 依赖 | hcloud 7.3.12 / check_cli authenticated=true |
| 真云凭证 | cn-north-4（AKSK / 凭证无效 APIGW.0301） |
| 测试类型 | 源码级探针 / MCP 工具调用 / 真机 CLI / 评测集路由 |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**: 探针脚本(.mjs)直调源码导出函数 + MCP 工具真实调用 + eval harness 评测集路由 + fixture 夹具批量执行。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146（设计级 107 + 展开级 39） |
| 已执行 | 146 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 132 / 1 / 13 / 0 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC，不含 BLOCKED/NOT_RUN） | 99.2% |
| P0 / P1 / P2 新增缺陷 | 0 / 1 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（未创建真云资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 94 | 有证据且通过 PASS 门禁 |
| FAIL | 0 | — |
| BLOCKED | 13 | 真云凭证无效(APIGW.0301) + 沙箱维护中 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **107** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01 serviceCatalog 路由 MISS |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P1 | `EXP-E01` | serviceCatalog 中文意图"查云主机"未命中 ECS | recommendedServices 包含 "ECS" | 返回 ["Run hcloud --help"]，不含 ECS | `capability-discovery.mjs` 意图匹配未覆盖"云主机"同义词 | P | 待提单 |

### 根因详情

**#1 [P1] EXP-E01 serviceCatalog 路由 MISS — 中文意图"查云主机"未命中 ECS**

- 期望：`serviceCatalog(intent="帮我查一下我账号在华北北京四有哪些云主机").recommendedServices` 包含 `"ECS"`
- 实际：返回 `["Run hcloud --help to list available services."]`，未命中 ECS
- 根因：`plugins/huaweicloud-core/src/capability-discovery.mjs` 中 `serviceCatalog()` 的意图匹配逻辑未覆盖"云主机"这一中文 ECS 同义词
- 证据：`evidence/EXP-E01/stdout.log`
- 评测基线：15 条中 1 条 MISS（6.7% MISS 率），优于历史基线 21.4%

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D3-C1 | 设计级 | P1 | BLOCKED | 补环境 | 真云凭证无效(APIGW.0301)，无法执行 ECS 创建/删除 E2E | — |
| D3-C2 | 设计级 | P1 | BLOCKED | 补环境 | 真云凭证无效，无法执行 OBS 静态站部署 E2E | — |
| D3-C3 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE) | — |
| D3-C6 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱服务维护中 | — |
| D3-C7 | 设计级 | P1 | BLOCKED | 补环境 | 真云凭证无效，无法执行跨区域 EIP 创建/删除 | — |
| D3-S1 | 设计级 | P1 | BLOCKED | 补环境 | 真云凭证无效 | — |
| D3-S2 | 设计级 | P1 | BLOCKED | 补环境 | 真云凭证无效 | — |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱服务维护中 | — |
| D3-S4 | 设计级 | P1 | BLOCKED | 补环境 | 需有效云账号认证领券 | — |
| D3-S5 | 设计级 | P2 | BLOCKED | 补环境 | 真云凭证无效 | — |
| D3-S6 | 设计级 | P2 | BLOCKED | 补环境 | 真云凭证无效 | — |
| D3-S7 | 设计级 | P1 | BLOCKED | 补环境 | 真云凭证无效 | — |
| D3-S8 | 设计级 | P1 | BLOCKED | 补环境 | 真云凭证无效 | — |

> 所有 BLOCKED 均为环境问题（真云凭证无效 APIGW.0301 或沙箱维护中），非用例设计问题。凭证修复后可复测。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：0
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（show_profile_redacted 验证 AK/SK=`<redacted>`）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 否 | N/A | 未创建真云资源（凭证无效，所有真云用例 BLOCKED） |
| 沙箱 | 否 | N/A | 沙箱维护中，未创建 |

> 本轮未创建任何真云资源，无需清理。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖：真云 E2E 用例（13 条 BLOCKED，因凭证无效/沙箱维护）
- 建议：修复真云凭证（AK/SK 返回 APIGW.0301 Unauthorized），复测 13 条 BLOCKED 用例；补充"云主机"同义词到 serviceCatalog 意图匹配规则
- 评测集路由命中率 93.3%（14/15），优于历史基线 78.6%
