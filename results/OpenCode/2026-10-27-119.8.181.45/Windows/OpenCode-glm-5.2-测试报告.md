# OpenCode-glm-5.2 每日测试报告
> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-10-27 09:52:58（北京时间）
> **执行归档**：`results/OpenCode/2026-10-27-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.12` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：MCP 真机调用（hook_check_command/plan_cli_command/service_catalog 等 40 工具）+ 源码级直调（risk-rule-engine/update-check/credentials 等函数级探针）+ 协议源码审查。真云 E2E 因凭证失效（APIGW.0301）和沙箱维护（HDKIT_SANDBOX_MAINTENANCE）标记 BLOCKED。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 4 / 12 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 134） | `97.0%` |
| P0 / P1 / P2 新增缺陷 | `0 / 3 / 1` |
| 红线（I 类）违规 | `0`（无凭证泄漏、无写操作误判、无 mock 假跑） |
| 资源释放 | `N/A`（真云 E2E 全部 BLOCKED，无资源创建/销毁） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `12` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `36` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `EXP-E01` | D10评测 | serviceCatalog 中文意图"查询ECS实例列表"路由未命中ECS | `tools.mjs:2417` CJK分词+精确token匹配失败 | 待提单 |
| 2 | P1 | `EXP-E08` | D10评测 | serviceCatalog "诊断API错误 explain error"无诊断路由 | `tools.mjs:2190-2415` routeMap缺诊断/排障路由 | 待提单 |
| 3 | P1 | `EXP-E09` | D10评测 | serviceCatalog 中文意图"创建CCE集群"路由未命中CCE | `tools.mjs:2269` CCE路由无CJK关键词+分词失败 | 待提单 |
| 4 | P2 | `D3-S5` | D3功能 | 复合意图"部署数据库和Web应用"未分层路由多服务 | `tools.mjs:2371-2388` sandbox路由缺'web应用'CJK关键词 | 待提单 |

### 根因详情

**EXP-E01**：期望 recommendedServices 包含 "ECS"；实际返回兜底 fallback。根因 `tools.mjs:2417` — `it.split(/[\s,./-]+/)` 按空白分词，中文"查询ECS实例列表"为单 token，line 2421 `tokens.has('ecs')` 精确匹配失败。证据：`evidence/EXP-E01/stdout.log`

**EXP-E08**：期望推荐 troubleshooting 技能；实际返回兜底 fallback。根因 `tools.mjs:2190-2415` — routeMap 无诊断/排障路由条目，"诊断"/"错误"/"explain" 未出现在任何路由关键词中。证据：`evidence/EXP-E08/stdout.log`

**EXP-E09**：期望 recommendedServices 包含 "CCE"；实际返回兜底 fallback。根因 `tools.mjs:2269` — CCE 路由关键词全为英文（无'集群'/'容器'），line 2417 分词后单 token，`tokens.has('cce')` 失败。证据：`evidence/EXP-E09/stdout.log`

**D3-S5**：期望同时推荐 RDS + 部署类服务；实际仅推荐 RDS。根因 `tools.mjs:2371-2388` — sandbox 路由有 'web app' 但缺 'web应用' CJK 关键词，且未实现复合意图拆分。证据：`evidence/D3-S5/stdout.log`

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | Real cloud API returns APIGW.0301 (Incorrect IAM authentication information: Unauthorized). Credentials exist in credentials.json but hcloud profile has stale encrypted security token in cipher.json that cannot be cleared through available MCP tools. Attempted fixes: auth_confirm(s1)=aborted, auth_switch persist(mcp-config)=rejected(STS R3), auth_init clear=cleared but profile unchanged, hcloud configure delete/set=format errors. Sandbox unavailable (HDKIT_SANDBOX_MAINTENANCE). ECS lifecycle E2E requires create/delete ECS instances. |
| `D3-C2` | D3功能 | OBS静态站部署E2E | Real cloud API returns APIGW.0301 (Incorrect IAM authentication information: Unauthorized). Credentials exist in credentials.json but hcloud profile has stale encrypted security token in cipher.json that cannot be cleared through available MCP tools. Attempted fixes: auth_confirm(s1)=aborted, auth_switch persist(mcp-config)=rejected(STS R3), auth_init clear=cleared but profile unchanged, hcloud configure delete/set=format errors. Sandbox unavailable (HDKIT_SANDBOX_MAINTENANCE). OBS static site E2E requires create bucket, upload, deploy. |
| `D3-C3` | D3功能 | 沙箱部署E2E | Real cloud API returns APIGW.0301 (Incorrect IAM authentication information: Unauthorized). Credentials exist in credentials.json but hcloud profile has stale encrypted security token in cipher.json that cannot be cleared through available MCP tools. Attempted fixes: auth_confirm(s1)=aborted, auth_switch persist(mcp-config)=rejected(STS R3), auth_init clear=cleared but profile unchanged, hcloud configure delete/set=format errors. Sandbox unavailable (HDKIT_SANDBOX_MAINTENANCE). Sandbox deploy E2E requires sandbox connection (HDKIT_SANDBOX_MAINTENANCE). |
| `D3-C4` | D3功能 | 服务创建类回归 | Real cloud API returns APIGW.0301 (Incorrect IAM authentication information: Unauthorized). Credentials exist in credentials.json but hcloud profile has stale encrypted security token in cipher.json that cannot be cleared through available MCP tools. Attempted fixes: auth_confirm(s1)=aborted, auth_switch persist(mcp-config)=rejected(STS R3), auth_init clear=cleared but profile unchanged, hcloud configure delete/set=format errors. Sandbox unavailable (HDKIT_SANDBOX_MAINTENANCE). Service creation regression requires create/delete resources across services. |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | Real cloud API returns APIGW.0301 (Incorrect IAM authentication information: Unauthorized). Credentials exist in credentials.json but hcloud profile has stale encrypted security token in cipher.json that cannot be cleared through available MCP tools. Attempted fixes: auth_confirm(s1)=aborted, auth_switch persist(mcp-config)=rejected(STS R3), auth_init clear=cleared but profile unchanged, hcloud configure delete/set=format errors. Sandbox unavailable (HDKIT_SANDBOX_MAINTENANCE). Sandbox 7 implicit tools require sandbox connection (HDKIT_SANDBOX_MAINTENANCE). |
| `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | Real cloud API returns APIGW.0301 (Incorrect IAM authentication information: Unauthorized). Credentials exist in credentials.json but hcloud profile has stale encrypted security token in cipher.json that cannot be cleared through available MCP tools. Attempted fixes: auth_confirm(s1)=aborted, auth_switch persist(mcp-config)=rejected(STS R3), auth_init clear=cleared but profile unchanged, hcloud configure delete/set=format errors. Sandbox unavailable (HDKIT_SANDBOX_MAINTENANCE). Cross-region resource operations require create/delete EIP with valid credentials. |
| `D3-C13` | D3功能 | OBS 静态网站托管配置 | Real cloud API returns APIGW.0301 (Incorrect IAM authentication information: Unauthorized). Credentials exist in credentials.json but hcloud profile has stale encrypted security token in cipher.json that cannot be cleared through available MCP tools. Attempted fixes: auth_confirm(s1)=aborted, auth_switch persist(mcp-config)=rejected(STS R3), auth_init clear=cleared but profile unchanged, hcloud configure delete/set=format errors. Sandbox unavailable (HDKIT_SANDBOX_MAINTENANCE). OBS website config requires valid bucket with API access. |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | Sandbox under maintenance (HDKIT_SANDBOX_MAINTENANCE). Cannot test hdkitConnect/hdkitCredentials/hwlink getCredentials/createConnection. |
| `D3-S2` | D3功能 | 场景-删VPC先确认 | Real cloud API returns APIGW.0301 (Incorrect IAM authentication information: Unauthorized). Credentials exist in credentials.json but hcloud profile has stale encrypted security token in cipher.json that cannot be cleared through available MCP tools. Attempted fixes: auth_confirm(s1)=aborted, auth_switch persist(mcp-config)=rejected(STS R3), auth_init clear=cleared but profile unchanged, hcloud configure delete/set=format errors. Sandbox unavailable (HDKIT_SANDBOX_MAINTENANCE). Delete VPC with confirm requires create/delete VPC with valid credentials. |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Real cloud API returns APIGW.0301 (Incorrect IAM authentication information: Unauthorized). Credentials exist in credentials.json but hcloud profile has stale encrypted security token in cipher.json that cannot be cleared through available MCP tools. Attempted fixes: auth_confirm(s1)=aborted, auth_switch persist(mcp-config)=rejected(STS R3), auth_init clear=cleared but profile unchanged, hcloud configure delete/set=format errors. Sandbox unavailable (HDKIT_SANDBOX_MAINTENANCE). Sandbox preview URL requires sandbox connection (HDKIT_SANDBOX_MAINTENANCE). |
| `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | Real cloud API returns APIGW.0301 (credentials invalid). Cannot create FunctionGraph function or configure timer trigger. |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | Real cloud API returns APIGW.0301 (Incorrect IAM authentication information: Unauthorized). Credentials exist in credentials.json but hcloud profile has stale encrypted security token in cipher.json that cannot be cleared through available MCP tools. Attempted fixes: auth_confirm(s1)=aborted, auth_switch persist(mcp-config)=rejected(STS R3), auth_init clear=cleared but profile unchanged, hcloud configure delete/set=format errors. Sandbox unavailable (HDKIT_SANDBOX_MAINTENANCE). Cross-service delivery requires RDS + sandbox (both unavailable). |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（show_profile_redacted 全字段 <redacted>，hook_check_command 拦截 cat/printenv/secret API）
- [x] 写操作误判 read-only：`无`（DeleteServers --force 正确判定 deny，ListServersDetails 正确判定 allow）
- [x] 红线（I 类）违规：`0`（无 mock 假跑、无虚报 PASS、真云 BLOCKED 有详细原因）
- [x] 脱敏复核：`通过`（findings.evidence 中 AK/SK/token 均替换为 <redacted>，run_readonly_command 输出凭证注入为 <redacted>）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/RDS 等 | N/A（BLOCKED） | N/A | N/A（凭证 APIGW.0301 失效，未创建任何云资源） |
| 沙箱 | N/A（BLOCKED） | N/A | N/A（HDKIT_SANDBOX_MAINTENANCE，未创建沙箱实例） |

> 真云 E2E 用例全部 BLOCKED（凭证失效 APIGW.0301 + 沙箱维护中），未创建任何云资源，无需销毁/归零。本地执行的探针/MCP 调用无副作用资源。

---

## 八、遗留与建议

- **缺陷修复建议**：4 个 FAIL 均为 serviceCatalog 中文意图路由问题，建议：①为 CCE/部署等路由补充 CJK 关键词（'集群'/'容器'/'部署'/'web应用'）；②改进 CJK 分词逻辑（line 2417 按字符级或词典分词，而非仅按空白）；③新增诊断/排障路由条目映射到 huaweicloud-troubleshooting + explain_error；④考虑实现复合意图拆分逻辑。
- **BLOCKED 解除条件**：①刷新/修复真云凭证（清除 hcloud cipher.json 中过期的 security-token，或重新 auth init）；②等待沙箱维护完成（HDKIT_SANDBOX_MAINTENANCE 解除）。
- **SPEC-MISMATCH**：无。
- **通过率**：97.0%（130/134，分母=PASS+FAIL），P0 全通过（21/21），无 P0 缺陷。
