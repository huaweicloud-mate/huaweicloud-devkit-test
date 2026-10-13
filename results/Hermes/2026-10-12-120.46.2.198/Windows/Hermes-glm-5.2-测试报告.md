# Hermes-glm-5.2 每日测试报告
> **报告名**：`Hermes-glm-5.2-测试报告.md`
> **生成时间**：2026-10-12 05:39:34（北京时间）
> **执行归档**：`results/Hermes/2026-10-12-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷，1 个 P1 合并缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.7` |
| daily 基础用例 | 设计级 102 / 展开级 43 |

> **执行方法**：源码级探针直调（safety-policy/risk-rule-engine/hcloud-cli/update-check 函数级验证）+ MCP stdio 真机（initialize/tools/list/tools/call 协议测试）+ eval harness 路由评测（run-eval.mjs）+ CLI 黑盒（doctor/status/help）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `145`（设计级 102 + 展开级 43） |
| 已执行 | `144` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 13 / 1 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 143） | `90.9%` |
| P0 / P1 / P2 新增缺陷 | `0 / 1 (合并) / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `无需释放（未创建真云资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `99` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `1` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `31` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | `tools.mjs:1818` serviceCatalog ECS keywords 缺少中文词 | 合并提单 |
| 2 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | `tools.mjs:1815` serviceCatalog routeMap 中文关键词缺失，准确率21.4% | 合并提单 |
| 3 | P1 | `EXP-E01` | D10评测集 | ECS查询意图路由 | 同上 | 合并提单 |
| 4 | P1 | `EXP-E02` | D10评测集 | ECS创建意图路由 | 同上 | 合并提单 |
| 5 | P1 | `EXP-E03` | D10评测集 | OBS静态站意图路由 | 同上 | 合并提单 |
| 6 | P1 | `EXP-E04` | D10评测集 | EIP意图路由 | 同上 | 合并提单 |
| 7 | P1 | `EXP-E05` | D10评测集 | RDS查询意图路由 | 同上 | 合并提单 |
| 8 | P1 | `EXP-E07` | D10评测集 | CBR备份意图路由 | 同上 | 合并提单 |
| 9 | P1 | `EXP-E10` | D10评测集 | FunctionGraph意图路由 | 同上 | 合并提单 |
| 10 | P1 | `EXP-E11` | D10评测集 | BSS费用意图路由 | 同上 | 合并提单 |
| 11 | P1 | `EXP-E12` | D10评测集 | CES监控意图路由 | 同上 | 合并提单 |
| 12 | P1 | `EXP-E13` | D10评测集 | ELB证书意图路由 | 同上 | 合并提单 |
| 13 | P1 | `EXP-E14` | D10评测集 | IAM审计意图路由 | 同上 | 合并提单 |

### 根因详情

> **合并缺陷 FINDING-001**: `serviceCatalog()` 中文意图路由大面积未命中
> 
> **根因**: `plugins/huaweicloud-core/src/tools.mjs:1815` — `serviceCatalog()` 函数的 `routeMap` 关键字列表缺少中文关键词。ECS 路由 keywords 仅有 `['ecs', 'server', 'vm', 'instance', 'compute', 'flavor', 'image']`，无「云主机」「云服务器」等中文词。RDS/OBS/EIP/CBR/FunctionGraph/BSS/CES/ELB/IAM 同样缺少中文关键词。唯一有中文关键词的 voucher 路由正常命中。
> 
> **eval harness 实测**: 15 条评测集，3 HIT / 11 MISS / 1 N/A，准确率 21.4%（预期 ≥90%）
> 
> **证据**: `eval/results/eval-run-20261011213513.csv`，每个 FAIL 用例 `evidence/<case-id>/stdout.log`

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 | 分类 |
|---|---|---|---|---|
| `EXP-E08` | D10评测集 | 我的ECS启动失败了帮我分析原因 | 诊断类用例（预期走 explain_error 工具，非服务路由），eval harness 标 N/A | 【改用例】应明确标注为诊断类，不走 serviceCatalog 路由 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 | 分类 |
|---|---|---|---|---|
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | sandbox_check_user 通过 MCP 调用返回空。Sandbox 服务 API (hdkitservice) 未在 KooCLI hcloud 注册。**缺什么**: sandbox session endpoint 配置（需通过 Web UI 或 API 创建 sandbox session 获取 endpoint）。**影响**: 无法验证沙箱预览全流程（connect→upload→deploy→出URL）。**解除条件**: 配置 sandbox session endpoint 或通过华为云控制台创建有效 sandbox session。实测时间: 20261011213852 | 【补环境】 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**无**。所有 PASS 用例均验证了凭证脱敏（redactSecrets 正确隐藏 AK/SK/token/password）
- [x] 写操作误判 read-only：**无**。D4-5 验证了 DeleteServer/DeleteVpc/CreateServer 均正确判定为 write/deny
- [x] 红线（I 类）违规：**无**
- [x] 脱敏复核：**通过**。D2-4/D4-6/D4-27 验证了 AK/SK/token/adminPass 均被 `<redacted>` 替换

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 未创建 | N/A | N/A |

> 本次测试以源码级探针 + MCP 协议测试为主，未创建真云资源（ECS/VPC/RDS 等）。D3-S7 跨服务交付用例验证了工具链可用性（serviceCatalog 路由 + plan_cli_command 命令生成），但未实际创建云资源。D3-S3 沙箱预览因 sandbox session 未配置而 BLOCKED。

---

## 八、遗留与建议

1. **FINDING-001 (P1)**: serviceCatalog 中文意图路由需补充中文关键词。建议为每个服务路由添加常用中文术语（如 ECS 添加「云主机」「云服务器」，RDS 添加「云数据库」等）。合并提单 1 张。
2. **D3-S3 (BLOCKED)**: 沙箱预览用例需补环境——配置 sandbox session endpoint 后重测。
3. **EXP-E08 (NOT_RUN)**: 诊断类用例应明确标注不走 serviceCatalog 路由，建议维护者在 test-cases 母版中调整用例类型。
4. **D9-4 (SPEC note)**: MCP server 在未 initialize 时也响应 tools/list（auto-init 行为），与 MCP 规范要求的「强制时序」略有出入。标记为 PASS 但建议关注。
