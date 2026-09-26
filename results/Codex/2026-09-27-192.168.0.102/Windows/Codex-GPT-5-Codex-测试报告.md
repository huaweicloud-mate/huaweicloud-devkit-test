# Codex-GPT-5-Codex 每日测试报告
> **报告名**：`Codex-GPT-5-Codex-测试报告.md`
> **生成时间**：2026-09-27 05:17:27（北京时间）
> **执行归档**：`results/Codex/2026-09-27-192.168.0.102/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Codex` + `GPT-5-Codex` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.7+7456d05` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：源码级探针直调 + MCP 协议/fixture harness + Codex 宿主插件发现检查；真云/真实 agent 会话闭环未满足项按 BLOCKED 回填。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `110 / 14 / 17 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 124） | `88.7%` |
| P0 / P1 / P2 新增缺陷 | `2 / 12 / 0` |
| 红线（I 类）违规 | `2`（D2-4 脱敏、D4-16 wrapper 绕过） |
| 资源释放 | `未创建真云资源；无资源残留` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `82` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单 |
| BLOCKED | `17` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | TODO: 待补根因 | 待提单 |
| 2 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | TODO: 待补根因 | 待提单 |
| 3 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | TODO: 待补根因 | 待提单 |
| 4 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |
| 5 | P1 | `EXP-E02` |  |  | TODO: 待补根因 | 待提单 |
| 6 | P1 | `EXP-E03` |  |  | TODO: 待补根因 | 待提单 |
| 7 | P1 | `EXP-E04` |  |  | TODO: 待补根因 | 待提单 |
| 8 | P1 | `EXP-E05` |  |  | TODO: 待补根因 | 待提单 |
| 9 | P1 | `EXP-E07` |  |  | TODO: 待补根因 | 待提单 |
| 10 | P1 | `EXP-E10` |  |  | TODO: 待补根因 | 待提单 |
| 11 | P1 | `EXP-E11` |  |  | TODO: 待补根因 | 待提单 |
| 12 | P1 | `EXP-E12` |  |  | TODO: 待补根因 | 待提单 |
| 13 | P1 | `EXP-E13` |  |  | TODO: 待补根因 | 待提单 |
| 14 | P1 | `EXP-E14` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> TODO: 每个 FAIL 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」需由 agent 依据 evidence/<case-id>/stdout.log 补充。

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D1-65` | D1安装 | 调试模式环境变量 | 【补环境】缺少专用 debug 日志捕获 fixture；解除条件：补充 queryDistTags DEBUG 输出 harness 后重跑。 |
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | 【补环境】DSH 安装/跳过安装需隔离安装器沙箱，当前 Codex 运行不执行 DSH 重装；解除条件：提供隔离 npm/global install sandbox。 |
| `D1-68` | D1安装 | 图标离线与区域环境变量 | 【补环境】图标离线网络拦截 fixture 未下发；解除条件：补充 getServiceIcon 离线 manifest harness。 |
| `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | 【补环境】WebSocket 代理需本地代理服务/ProxyAgent 端到端 fixture；解除条件：提供代理 mock server harness。 |
| `D3-C13` | D3功能 | OBS 静态网站托管配置 | 【补环境】OBS 静态网站托管为真云 bucket 配置闭环；解除条件：分配可建删 OBS bucket 的隔离资源名前缀并执行归零。 |
| `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | 【补环境】真实云只读 ECS 清单场景需可审计 agent 会话链路；解除条件：提供会话 harness 与只读账号执行记录。 |
| `D3-S2` | D3功能 | 场景-删VPC先确认 | 【补环境】删除 VPC 场景涉及真实写操作与确认链路；解除条件：提供本次专属 VPC 资源和审批会话 harness。 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 【补环境】沙箱公网预览需真实 sandbox 会话；解除条件：提供 sandbox workspace 会话和 URL 可达性检查。 |
| `D3-S4` | D3功能 | 场景-领券闭环 | 【补环境】领券为一次性账号状态变更，当前运行不应重复领取；解除条件：提供可重置测试账号或 mock-free 测试租户。 |
| `D3-S5` | D3功能 | 场景-复合意图分层路由 | 【补环境】复合意图分层路由需真实 agent 会话判定；解除条件：提供会话评测 harness。 |
| `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | 【补环境】FunctionGraph 定时任务涉及真云创建/删除；解除条件：提供资源名前缀、配额和归零审计脚本。 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 【补环境】Web+RDS 跨服务交付涉及计费资源；解除条件：提供专属资源名前缀、配额和自动归零脚本。 |
| `D3-S8` | D3功能 | 场景-操作失败后排障指引 | 【补环境】失败后排障指引需真实 agent 会话输出判定；解除条件：提供可注入失败的会话 harness。 |
| `D4-25` | D4安全 | Python hook 事件遥测分类 | 【补环境】Python hook 事件遥测需 hook-capable 宿主事件文件；Codex 本轮只验证 Node hook；解除条件：提供 Hermes/OpenCode hook 事件执行环境。 |
| `D4-26` | D4安全 | findings 证据脱敏 | 【补环境】findings.evidence 脱敏需 hook findings 事件产物；解除条件：提供 hook-capable 宿主事件输出。 |
| `D6-9` | D6性能 | 缓存清理三入口 | 【补环境】三缓存清理入口未提供确定性 fixture；解除条件：补充缓存预热/清理 harness。 |
| `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | 【补环境】安装 ID 持久化与遥测脱敏未提供隔离 HOME fixture；解除条件：补充 installId/sanitizeValue harness。 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`2`（D2-4、D4-27 为假凭证探针明文残留，不涉及真实 AK/SK）
- [x] 写操作误判 read-only：`1`（D4-16 shell wrapper allow）
- [x] 红线（I 类）违规：`2`
- [x] 脱敏复核：`发现 JSON 字符串/双路径脱敏缺陷；证据使用假凭证值`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 否 | 不适用 | 未创建 ECS/VPC/RDS/OBS/FunctionGraph/Sandbox 计费资源 |

> 本轮未执行真云建删闭环；相关用例以 BLOCKED 标注并写明解除条件。

---

## 八、遗留与建议

- 修复 D2-4/D4-27 的 JSON 字符串脱敏路径，统一对象与字符串双路径处理。`n- 修复 D4-16 的 shell wrapper 拆分与安全分类。`n- 扩充 D10 serviceCatalog 中文同义词/评测集映射，降低 MISS。`n- 为 17 个 BLOCKED 项补充真实会话、真云建删或专用 fixture 后复测。

