## Codex-1.1.7-next.1 每日测试报告

> **生成时间**：`2026-09-24 14:14:44`（北京时间）
> **执行归档**：`results/Codex/2026-09-24-192.168.0.102/Windows/`
> **被测对象**：huaweicloud-devkit `1.1.7-next.1`
> **结论**：`FAIL`（存在 FAIL；BLOCKED 已逐条说明）

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Codex |
| OS | Windows |
| 被测版本（SUT） | `1.1.7-next.1`，hdk checkout `657ceb7b` |
| 工具全集 | `40` |
| 测试类型 | 源码级探针 / MCP 协议 / fixture / 部分真云前置校验 |
| daily 基础用例 | 设计级 102 / 展开级 39 |

执行前已运行 `python scripts/prepare_env.py --update`，测试仓库与 hdk 已更新，npm `huaweicloud-devkit@next` 已安装。证据均落盘到 `evidence/<case-id>/stdout.log`。

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141` |
| 已回填 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `119 / 15 / 7 / 0 / 0` |
| 通过率（不含 BLOCKED/NOT_RUN） | `88.8%` |
| P0 / P1 / P2 新增缺陷 | `2 / 1 / 2` |
| 资源释放 | 未创建真云写资源；无本轮资源残留 |

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 |
|---|---:|
| PASS | 91 |
| FAIL | 4 |
| BLOCKED | 7 |
| SPEC-MISMATCH | 0 |
| NOT_RUN | 0 |
| 合计 | 102 |

### 3.2 展开级

| 状态 | 数量 |
|---|---:|
| PASS | 28 |
| FAIL | 11 |
| BLOCKED | 0 |
| SPEC-MISMATCH | 0 |
| NOT_RUN | 0 |
| 合计 | 39 |

## 四、缺陷清单

| 级别 | 用例ID | 缺陷描述 | 证据 |
|---|---|---|---|
| P0 | D9-12 | MCP initialize 安全基线部分断言失败：invalid params 未返回 -32602、`callTool('huaweicloud_service_catalog')` 未返回可用 content、`_decorateResult` 未标记提示消费 | `evidence/D9-12/stdout.log` |
| P0 | D9-13 | 凭证/审批安全基线部分断言失败：运行时凭证 set/resolve 形参契约不匹配、风险合并未拦截含凭证 artifact、审批 token 未按探针断言一次性消费 | `evidence/D9-13/stdout.log` |
| P1 | D4-16 | 安全 hook 对 `sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` 包裹命令未 deny | `evidence/D4-16/stdout.log` |
| P2 | D4-27 | 双路径凭证脱敏不完整，AK/SK/token 仍出现在序列化片段中 | `evidence/D4-27/stdout.log` |
| P1 | EXP-E01/E02/E03/E04/E05/E07/E10/E11/E12/E13/E14 | serviceCatalog 路由评测 11 条返回 MISS，期望 HIT | `evidence/EXP-E01..EXP-E14/stdout.log` |

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D3-C13 | 设计级 | P1 | BLOCKED | 补环境 | BLOCKED: requires a disposable real OBS bucket to set/get/delete website configuration and verify XML/status.解除条件: provide/create an OBS test bucket scoped for this run and allow cleanup verification. |
| D3-S1 | 设计级 | P1 | BLOCKED | 补环境 | BLOCKED: requires real cloud readonly ECS inventory in cn-north-4 and a session-level audit proving zero write calls.解除条件: provide readonly ECS target/account state and allow hcloud ListServersDetails evidence capture. |
| D3-S2 | 设计级 | P1 | BLOCKED | 补环境 | BLOCKED: requires a disposable test VPC and approved destructive delete confirmation path, plus post-delete zero-resource verification.解除条件: create/identify run-owned VPC and authorize delete. |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | BLOCKED: requires Huawei Cloud Sandbox quota plus deployable frontend project and public URL accessibility check.解除条件: sandbox session quota available and deploy target approved. |
| D3-S4 | 设计级 | P1 | BLOCKED | 补环境 | BLOCKED: voucher is one-time per account; current run cannot safely force claim without an unclaimed IAM account dedicated to this test.解除条件: provide unclaimed voucher test account. |
| D3-S6 | 设计级 | P2 | BLOCKED | 补环境 | BLOCKED: requires FunctionGraph write quota and cleanup of created function/timer trigger.解除条件: authorize run-owned FunctionGraph create/delete. |
| D3-S7 | 设计级 | P1 | BLOCKED | 补环境 | BLOCKED: requires RDS plus sandbox/ECS deployment quota and full cleanup verification across services.解除条件: authorize run-owned RDS/app deployment resources and cleanup checks. |

## 六、安全与红线合规

- 凭证泄漏事件：0（证据文件未写入真实 AK/SK）
- 写操作误执行：0（真云写资源未创建；写场景仅计划/分类或 BLOCKED）
- PASS 门禁：`verify_no_fake_pass.py Codex Windows` 通过
- 覆盖率门禁：`verify_coverage.py Codex Windows` 通过

## 七、资源释放

本轮未创建 ECS/VPC/OBS/RDS/FunctionGraph/沙箱写资源。所有运行的本地 fixture 使用临时目录或 mock，进程结束后清理。

## 八、遗留与建议

1. 优先修复 D9-12/D9-13 两条 P0 协议/安全基线问题。
2. 复测 D4-16、D4-27 后再重跑路由评测 EXP-E01~E15。
3. D3 真云/沙箱场景需提供 run-owned 资源配额和销毁授权后补测。
