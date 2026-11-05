# Hermes-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-06 05:17:21（北京时间）
> **执行归档**：`results/Hermes/2026-11-06-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `1.1.13` |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：源码级探针（.mjs 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，`file://` import）落盘 `evidence/<case-id>/stdout.log`；MCP 协议探针直驱 `mcp-server.mjs` dispatch；真机 CLI（install/doctor/status）；真云 E2E 建删资源归零（`realcloud-probe.mjs` + `heavy_run.sh` + `aux_run.sh`）；D10 路由走 `eval/harness/run-eval.mjs`。证据统一落 `evidence/<case-id>/`，门禁 `verify_no_fake_pass.py` + `verify_coverage.py` 均通过。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `149` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 18 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 146） | `87.7%` |
| P0 / P1 / P2 新增缺陷 | `4 / 10 / 4` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `本次创建资源全部归零（ECS/VPC/OBS/EIP 建删归零，EIP=0）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `88` | 有证据且通过 PASS 门禁 |
| FAIL | `15` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `40` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | TODO: 待补根因 | 待提单 |
| 2 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | TODO: 待补根因 | 待提单 |
| 3 | P1 | `D3-C4` | D3功能 | 服务创建类回归 | TODO: 待补根因 | 待提单 |
| 4 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | TODO: 待补根因 | 待提单 |
| 5 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | TODO: 待补根因 | 待提单 |
| 6 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | TODO: 待补根因 | 待提单 |
| 7 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | TODO: 待补根因 | 待提单 |
| 8 | P1 | `D4-4` | D4安全 | 写操作审批门 | TODO: 待补根因 | 待提单 |
| 9 | P1 | `D4-6` | D4安全 | adminPass回显警告 | TODO: 待补根因 | 待提单 |
| 10 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | TODO: 待补根因 | 待提单 |
| 11 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | TODO: 待补根因 | 待提单 |
| 12 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | TODO: 待补根因 | 待提单 |
| 13 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | TODO: 待补根因 | 待提单 |
| 14 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | TODO: 待补根因 | 待提单 |
| 15 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | TODO: 待补根因 | 待提单 |
| 16 | P1 | `EXP-C4-14` |  |  | TODO: 待补根因 | 待提单 |
| 17 | P1 | `EXP-C4-18` |  |  | TODO: 待补根因 | 待提单 |
| 18 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> 逐条根因见 `FINDINGS.md`（21 项缺陷：18 FAIL + 3 SPEC-MISMATCH，全部为历史在案缺陷 v1.1.13 实测复现，`file_issue.py` 查重命中 -> 不重复提单，关联清单见 `HISTORY_LINKS.md`）。
> 3 项 SPEC-MISMATCH（gen_report 未列入上表）：`D10-4`（P0，规则库 16→19 条断言滞后）、`D9-9`（P1，initialize capabilities 未声明 cancellation）、`D8-9`（P2，telemetry sanitizeValue 未脱敏 AK/SK/token）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属用例（OS 列标注「专属」），Windows 侧专属；Linux 侧由展开级 `EXP-NR3-10`（disttags 探针 queryDistTags 返回对象无 EINVAL）代表覆盖，实测 PASS |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（redact/脱敏探针 D2-4/D4-26/D8-9 输出的 AK/SK 均为测试桩常量 `AK123456`/`SKsecret` 等，非真实凭证）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是（s6.small.1 最低配置，本次创建） | 已删（含系统盘） | `ListServersDetails` 不含本次资源 ✓ |
| VPC+子网（D3-C1/D4-14） | 是（本次创建 name 含 hermes 时间戳） | 已删（VPC+子网，顺序删除） | `ListVpcs` 不含本次 VPC ✓ |
| OBS 桶（D3-C2） | 是（tctest-hermes-obs-*） | 已删（清对象+删空桶） | 删桶归零 ✓ |
| EIP（D3-C7） | 是（本次 CreatePublicip） | 已释放（DeletePublicip） | `ListPublicips total_count=0` ✓ |
| 沙箱（D3-C3/C6/S3） | 是（会话，平台托管回收） | 已 close_session | 无计费落地资源 ✓ |

> 本轮真云建删全部归零；云上残留的 2 个 ECS + 2 个 VPC 为并发客户端 `testbot3` 的泄漏（name 前缀 `testbot3-hermes-*`，2026-11-05 创建），非本轮创建，按红线「只删本次创建」不处置，仅记录。

---

## 八、遗留与建议

- 待裁决 SPEC：`D10-4`（规则库计数 16→19 契约漂移）、`D9-9`（cancellation 能力未声明）、`D8-9`（sanitizeValue 未脱敏敏感值）。
- 本轮未覆盖（说明范围）：真实 LLM Agent 会话评测 `D10-1/2/5/9`（需 CDP 会话自动化 / dsh，非 DSH 客户端不适用，属真实外部依赖）；多终端矩阵属维护者聚合范围。
- 环境恢复说明：昨日 8 项「补环境」阻塞（沙箱维护 + VPC 配额 + 账号 op_restricted）本轮全部解除并真机复测 PASS，无 BLOCKED 项。
- 建议：DMS/DEW `list_operations` 路由补齐（影响 D3-C4/EXP-C4-14/18）；`writeOperationPrefixes` 补 `Change/Modify` 前缀（D4-4 P0 安全）；`redactString`/`redactEvidence` 正则加 `/i` 与 JSON 带引号 key（D2-4/D4-26 凭证脱敏缺口）。
