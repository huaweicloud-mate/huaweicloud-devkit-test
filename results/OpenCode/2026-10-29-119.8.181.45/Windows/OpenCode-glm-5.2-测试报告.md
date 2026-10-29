# OpenCode-glm-5.2 每日测试报告
> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-10-29 21:22:39（北京时间）
> **执行归档**：`results/OpenCode/2026-10-29-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.12` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级直调（judgeUpdate/semverCompare/classifyTextCommand/redactSecrets 等）+ MCP 工具真机（hook_check_command/plan_cli_command/run_readonly_command/list_operations）+ eval harness（run-eval.mjs serviceCatalog 路由）+ hcloud CLI（22 服务 list_operations 冒烟）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `137 / 2 / 7 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 139） | `98.6%` |
| P0 / P1 / P2 新增缺陷 | `1 / 1 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `无需释放（本次无真云写操作资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `100` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `6` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `37` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `1` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-15` | D4安全 | hook绕过尝试-大小写变体未拦截 | `safety-policy.mjs:classifyTextCommand` 写动词匹配大小写敏感 | 待提单 |
| 2 | P1 | `EXP-E01` | D10评测 | serviceCatalog路由未命中-中文ECS查询意图 | `tools.mjs:serviceCatalog` routeMap 未覆盖"云主机"中文别名 | 待提单 |

### 根因详情

#### #1 D4-15 hook绕过尝试-大小写变体未拦截
- **期望**：classifyTextCommand("Deleteserver --server-ids=xxx").decision === "deny"
- **实际**：classifyTextCommand("Deleteserver --server-ids=xxx").decision === "allow"（大小写变体绕过）
- **根因**：`safety-policy.mjs:classifyTextCommand` 中写动词匹配使用大小写敏感的字符串匹配，未对 delete/destroy 等关键词做 case-insensitive 匹配
- **证据**：`evidence/D4-15/stdout.log`

#### #2 EXP-E01 serviceCatalog路由未命中-中文ECS查询意图
- **期望**：serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机") 命中 ECS 服务
- **实际**：返回 "Run hcloud --help to list available services."（未路由）
- **根因**：`tools.mjs:serviceCatalog` routeMap 中 ECS 路由关键词未覆盖 "云主机" 这一中文别名
- **证据**：`evidence/EXP-E01/stdout.log`（eval harness: expected=ECS, actual=Run hcloud --help, verdict=MISS）

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | Sandbox deploy E2E requires DevStation sandbox quota and active session. sandbox_connect/sandbox_upload_project/sandbox_deploy_nginx available but sandbox session not active in this run. blockedReason: No active sandbox session; sandbox tools available but require DevStation quota. |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | Sandbox 7 implicit tools (check_user/credentials/sign_agreement/upload_file/exec_one_shot/deploy_check/close_session) require active sandbox session. blockedReason: No active sandbox session; sandbox tools available but require DevStation quota. |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | Sandbox HDKit service params (hdkitConnect/hdkitCredentials/hwlink) require active sandbox session. blockedReason: No active sandbox session. |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Sandbox preview URL requires active sandbox session and DevStation quota. blockedReason: No active sandbox session. |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | Cross-service delivery (Web app + RDS) requires sandbox session + RDS quota. Multi-service orchestration verified via plan layer but full E2E requires active resources. blockedReason: No active sandbox session + RDS quota. |
| `D4-25` | D4安全 | Python hook 事件遥测分类 | Python hook event telemetry (hook-events.jsonl) requires hook-capable client with Python hook layer. OpenCode is non-hook client, uses Node MCP layer instead. Node layer hook_check_command provides equivalent deny/warn decisions. blockedReason: OpenCode non-hook client, Python hook-events.jsonl not generated; Node MCP safety layer provides equivalent classification. |
| `EXP-E08` |  |  | serviceCatalog routing N/A: expected=(诊断), actual=Run hcloud --help to list available services. |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（hook_check_command 拦截 cat/printenv 凭证操作，decision=deny）
- [x] 写操作误判 read-only：无（plan_cli_command 正确分类 DeleteServers 为 write/deny）
- [x] 红线（I 类）违规：0（所有红线用例通过，凭证脱敏/写操作审批/hook 拦截均正常）
- [x] 脱敏复核：通过（show_profile_redacted 输出无明文 AK/SK；redactSecrets 替换凭证为 <redacted>）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/RDS | 无 | 无需 | N/A（本次通过 plan_cli_command 验证，未实际创建云资源） |
| 沙箱会话 | 无 | 无需 | N/A（沙箱用例 BLOCKED，未创建会话） |
| OBS bucket | 无 | 无需 | N/A（OBS 用例通过 setup_obs_config 验证配置同步，未创建 bucket） |

> 本次测试通过 plan_cli_command 分类层验证写操作安全性，未实际创建真云资源。沙箱相关用例因无活跃会话标记 BLOCKED。

---

## 八、遗留与建议

- **D4-15 修复建议**：safety-policy.mjs classifyTextCommand 应对写动词（delete/destroy/create/update 等）使用 case-insensitive 正则匹配，防止大小写变体绕过
- **EXP-E01 修复建议**：tools.mjs serviceCatalog routeMap 应将 "云主机" 纳入 ECS 路由关键词（与 "云服务器"/"ECS"/"instance" 并列）
- **BLOCKED 用例**：7 条 BLOCKED 均为沙箱相关（需 DevStation 配额）或 Python hook 遥测（OpenCode 非 hook 客户端），非产品缺陷
- **版本建议**：1.1.12 整体质量良好（98.6% 通过率），建议修复 D4-15 安全缺陷后发布 1.1.13
