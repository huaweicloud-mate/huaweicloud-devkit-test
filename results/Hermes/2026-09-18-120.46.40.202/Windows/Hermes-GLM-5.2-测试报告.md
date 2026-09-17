# Hermes-GLM-5.2 每日测试报告

> **报告名**：Hermes-GLM-5.2-测试报告.md
> **生成时间**：2026-09-18 06:10:05（北京时间）
> **执行归档**：results/Hermes/2026-09-18-120.46.40.202/Windows/
> **被测对象**：huaweicloud-devkit（GitHub huaweicloud/huaweicloud-devkit）
> **结论**：PARTIAL（有 FAIL 和 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + GLM-5.2 |
| OS / 架构 | Windows Server (x86_64) |
| Node / npm / Python | Node v22.13.0 / npm 10.x / Python 3.11.15 |
| 被测版本（SUT） | v1.1.5（gitHead e7ed6f66，PR #696 release-1.1.5） |
| 工具全集 | 40（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 确认已配置 |
| 真云凭证 | cn-north-4（AKSK 已配置） |
| 测试类型 | 源码级探针 / MCP 协议 / eval harness / service matrix |
| 设计真源 | 设计级 80 / 展开级 43 / 追踪表 183 |
| daily 基础用例 | 设计级 80 / 展开级 43 |

> **执行方法**：探针脚本（.mjs）直调 hdk/plugins/huaweicloud-core/src/* 导出函数，决策/结果落 stdout.log；eval harness 跑 serviceCatalog 路由核对；protocol-probe 跑 JSON-RPC 错误码核对；证据统一落 evidence/<case-id>/。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 80 + 展开级 43 = 123 |
| 已执行 | 123 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 106 / 14 / 1 / 1 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 87.6% |
| P0 / P1 / P2 新增缺陷 | 2 / 2 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（源码级探针，未创建真云资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 75 | 有证据且通过 PASS 门禁 |
| FAIL | 3 | D4-2, D4-16, D9-2 不符预期，根因见缺陷清单 |
| BLOCKED | 1 | D10-4 需 LLM harness |
| SPEC-MISMATCH | 1 | D4-23 huawei-agent-rules.md 不存在 |
| NOT_RUN | 0 | 无 |
| **合计** | **80** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 31 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | EXP-E01~E07,E10~E14 serviceCatalog 中文意图路由 MISS |
| BLOCKED | 0 | 无 |
| SPEC-MISMATCH | 0 | 无 |
| NOT_RUN | 1 | EXP-E08 诊断类意图 N/A |
| **合计** | **43** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证env打印拦截不完整 | env grep HW_ACCESS_KEY 应 deny | 返回 allow | safety-policy.mjs:398-399 | P | 待提单 |
| 2 | P0 | D4-16 | 命令包裹穿透 | sh -c "hcloud ECS Delete..." 应 deny | 返回 allow | safety-policy.mjs classifyTextCommand | P | 待提单 |
| 3 | P1 | D9-2 | JSON-RPC invalid params 未返回 -32602 | 返回 {code:-32602} | 返回 TypeError | mcp-protocol.mjs dispatch() | P | 待提单 |
| 4 | P1 | EXP-E01~E14 | serviceCatalog 中文意图路由准确率低 | 78.6%应命中 | 21.4%命中 | tools.mjs huaweicloud_service_catalog | P | 待提单 |

### 根因详情

**#1 [P0] D4-2 凭证env打印拦截不完整**
- 期望：env | grep HW_ACCESS_KEY 应 deny
- 实际：返回 allow（risk: not_huaweicloud）
- 根因：plugins/huaweicloud-core/src/safety-policy.mjs:398-399，env-dump 正则 /HUAWEICLOUD|HWC_|HCLOUD|OS_/i 未覆盖 HW_ 前缀
- 证据：evidence/D4-2/stdout.log

**#2 [P0] D4-16 命令包裹穿透**
- 期望：sh -c "hcloud ECS DeleteServer --server_id=test" 应 deny
- 实际：返回 allow（risk: not_huaweicloud）
- 根因：plugins/huaweicloud-core/src/safety-policy.mjs classifyTextCommand() 未解析 shell wrapper 内的 hcloud 命令
- 证据：evidence/D4-16/stdout.log

**#3 [P1] D9-2 JSON-RPC invalid params 未返回 -32602**
- 期望：无效参数返回 {code: -32602, message: "Invalid params"}
- 实际：返回 TypeError "Cannot read properties of null"
- 根因：plugins/huaweicloud-core/src/mcp-protocol.mjs dispatch() 未做 null params 前置校验
- 证据：evidence/D9-2/stdout.log

**#4 [P1] EXP-E01~E14 serviceCatalog 中文意图路由准确率低**
- 期望：15条中文意图中大部分应正确路由到对应服务
- 实际：HIT=3 MISS=11 N/A=1，准确率 21.4%
- 根因：plugins/huaweicloud-core/src/tools.mjs huaweicloud_service_catalog 中文意图匹配不足
- 证据：evidence/EXP-E01/stdout.log

---

## 五、未执行用例与原因

| ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D10-4 | 设计级 | P0 | BLOCKED | 补环境 | 需 LLM harness 验证 Agent 行为层安全干预，serviceCatalog 路由层无法代理 | 无需改用例，补充 LLM harness 环境 |
| EXP-E08 | 展开级 | P1 | NOT_RUN | 改用例 | 诊断类意图（explain_error），serviceCatalog 路由层无法代理诊断路由 | 用例应标注需 LLM Agent 行为层验证 |

---

## 六、安全/红线

- **真云用例**：本轮未执行真云 E2E 用例（源码级探针测试），凭证已就绪但 daily 用例集无真云 E2E 用例
- **PASS 门禁**：所有标 PASS 用例均有探针脚本 + stdout.log 证据落盘，evidencePath 已回填
- **红线违规**：0
- **资源释放**：源码级探针测试，未创建任何真云资源，无残留

---

## 七、资源释放

- 源码级探针测试，未创建任何真云资源
- 临时 skip 文件已清理
- 无资源残留

---

## 八、遗留建议

1. **D4-2 修复建议**：在 safety-policy.mjs 的 env-dump 正则中添加 HW_ 前缀匹配，并扩展 HUAWEICLOUD_AK/SK 简写形式
2. **D4-16 修复建议**：在 classifyTextCommand() 中添加 shell wrapper 解析逻辑，检测 sh/bash/powershell/cmd -c 内的 hcloud 命令
3. **D9-2 修复建议**：在 dispatch() 函数开头添加 params null/undefined 校验，返回标准 -32602 错误
4. **EXP-E 修复建议**：改进 huaweicloud_service_catalog 的中文意图匹配逻辑，支持自然语言到服务名的映射
5. **D4-23 建议**：确认 huawei-agent-rules.md 是否为计划中但未实现的功能，或更新用例以匹配实际安全机制
