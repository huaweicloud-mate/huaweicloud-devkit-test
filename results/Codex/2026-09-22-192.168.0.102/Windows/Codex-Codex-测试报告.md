# Codex-Codex 每日测试报告

生成时间：2026-09-22（北京时间）
被测对象：huaweicloud-devkit@1.1.6-next.1，源码 commit `10e5243`
结论：FAIL

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Codex |
| OS / 架构 | Windows / x64 |
| Node / npm / Python | Node v22.23.2 / npm 10.9.8 / Python 3.11.15 |
| MCP 工具数 | 40 |
| 测试类型 | 源码级探针、MCP 工具调用、D9 协议探针、D10 路由评测、Codex fixture |
| daily 基础用例 | 设计级 100 / 展开级 39 |

按 P0→P1→P2 执行；每条已执行用例的探针和结论落在 `evidence/<case-id>/`。

## 二、执行摘要

| 层级 | PASS | FAIL | BLOCKED | NOT_RUN |
|---|---:|---:|---:|---:|
| 设计级 | 80 | 3 | 5 | 12 |
| 展开级 | 27 | 12 | 0 | 0 |
| 合计 | 107 | 15 | 5 | 12 |

可判定样本通过率：87.7%（107 / 122）。PASS 门禁与覆盖率门禁均通过。

## 三、状态汇总

设计级 100 条：PASS 80、FAIL 3、BLOCKED 5、NOT_RUN 12。展开级 39 条：PASS 27、FAIL 12。P0 `D2-4`、`D4-16` 均为 FAIL，未标 NOT_RUN。

## 四、缺陷清单

1. P0 `D4-16`：MCP `hook_check_command` 对 `sh -c` 包裹的 hcloud 写命令返回 allow；根因入口未正确解包，见 `safety-policy.mjs:384-429`。
2. P0 `D2-4`：字符串化 JSON 中的 `ak`/`sk` 未脱敏；根因 `redactString`/`redactSecrets`，见 `safety-policy.mjs:34-62`。
3. P1 `D4-27`：双路径脱敏对字符串化 JSON 凭证仍失败，同一脱敏根因，见 `safety-policy.mjs:34-62`。
4. P1 展开级 `EXP-D5-2-1`：Codex 插件发现 fixture 仅 2/5 断言通过，缺少 manifest/MCP 注册/bundle 格式。
5. P1 D10 路由：`EXP-E01~E05/E07/E10~E14` 共 11 条 MISS，根因 `tools.mjs:1815` 路由关键词覆盖不足；证据在对应 `evidence/EXP-E*/stdout.log`。
6. D9：`D9-9a-capabilities.cancellation` 为 SPEC-MISMATCH，`D9-2b-invalid-params` 为 FAIL，协议结果见 `eval/results/protocol-probe-20260922072556.json`。

## 五、未执行用例与原因

12 条 NOT_RUN 均已写明原因，主要为缺少独立环境变量/CLI 隔离夹具、真实 Agent 场景会话或破坏性操作审批闭环。5 条 BLOCKED 均已写明实测时间、缺少资源、影响和解除条件，涉及 sandbox/hwlink、FunctionGraph、RDS 跨服务交付和 WebSocket 隧道。

## 六、安全/红线

- 证据只使用合成凭证；真实 AK/SK 未写入 evidence。
- 本轮未创建真云资源，资源残留为 0。
- PASS 门禁通过；P0 无 NOT_RUN/空状态。
- 覆盖率门禁通过；设计级 NOT_RUN+空占比 12.0%。

## 七、资源释放

本轮执行源码直调、MCP 模拟调用、协议/路由评测和只读规划；未创建 ECS、VPC、OBS、RDS、沙箱或其他真云资源，无需删除。

## 八、遗留建议

统一提单后优先修复 `D4-16` shell wrapper 风险和 JSON 字符串凭证脱敏，再复跑 D4/D2 安全探针与 D10 路由评测；补齐 Codex manifest 注册和缺失环境后复测 BLOCKED/NOT_RUN 用例。
