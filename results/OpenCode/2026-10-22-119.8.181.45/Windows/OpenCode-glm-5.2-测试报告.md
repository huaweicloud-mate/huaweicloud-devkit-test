# OpenCode-glm-5.2 每日测试报告
> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-10-22 05:14:57（北京时间）
> **执行归档**：`results/OpenCode/2026-10-22-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PASS`（无 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.10` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级直调（safety-policy/risk-rule-engine/update-check/auth/credentials 等模块函数直调）+ MCP JSON-RPC 真机（spawn mcp-server.mjs，initialize/tools/list/tools/call 全链路）+ CLI 命令（npx huaweicloud-devkit doctor/status/help）+ eval harness（serviceCatalog 路由评测 15 条中文意图）+ MCP 工具直调（plan_cli_command/setup_obs_config/sandbox_check_user 等）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `146 / 0 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 146） | `100.0%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `N/A（本轮无真云资源创建）` |

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
| PASS | `39` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

本轮无 FAIL 用例。

---

## 五、未执行用例与原因

无未执行用例。全部用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`。D2-4/D4-27/redactSecrets 验证 AK/SK/password 字段均被 `<redacted>` 替换；D9-13 show_profile_redacted 输出无原始 AK/SK
- [x] 写操作误判 read-only：`无`。D4-5 验证 ListServers 决策=allow、CreateServers 决策=deny，读写分类正确
- [x] 红线（I 类）违规：`0`。所有 PASS 用例均经实测+证据落盘+evidencePath 回填，verify_no_fake_pass.py 通过
- [x] 脱敏复核：`通过`。D4-26 redactOutput、D4-27 redactSecrets、D2-4 凭证脱敏均验证无泄露

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 配置文件 | setup_obs_config 创建 .obsutilconfig | N/A（配置文件，非云资源） | N/A |
| ECS/VPC/RDS | 未创建（plan_cli_command 仅规划，未执行 run_approved_command） | N/A | N/A |

> 本轮测试以源码直调+MCP JSON-RPC+plan 规划为主，未触发真云资源创建。setup_obs_config 仅创建本地 .obsutilconfig 配置文件，非云资源。

---

## 八、遗留与建议

- 本轮 146 用例全部 PASS，无 FAIL/BLOCKED/SPEC-MISMATCH/NOT_RUN，通过率 100%。
- D4 安全维度 29 条全 PASS：hook_check_command/artifacts/deploy_plan 三工具对凭证读取、明文 secret、命令包裹穿透、公开暴露等场景均正确拦截。
- D10 评测集 15 条 serviceCatalog 路由全 PASS，路由准确率 100%（基线 21.4% MISS 已改善）。
- EXP-C4 22 服务矩阵全 PASS：list_operations + plan_cli_command 对 ECS/VPC/OBS/RDS/GaussDB/CCE/FunctionGraph/IAM/CTS/CES/DDS/DCS/SMN/DMS/WAF/CDN/ModelArts/DEW/CBR/EVS/EIP/ELB 均可用。
- 无遗留问题。
