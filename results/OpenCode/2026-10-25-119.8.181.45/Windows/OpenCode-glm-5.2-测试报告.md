# OpenCode-glm-5.2 每日测试报告
> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-10-25 05:22:59（北京时间）
> **执行归档**：`results/OpenCode/2026-10-25-119.8.181.45/Windows/`
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

> **执行方法**：MCP 工具真机调用（hook_check_command/artifacts/deploy_plan, plan_cli_command, run_readonly_command, show_profile_redacted, retrieve_skill, search_docs, list_operations, check_cli, explain_error, service_catalog, voucher_status, auth_switch/sync/status 等）+ 源码级直调探针（queryDistTagsSync, judgeUpdate, risk-rule-engine exports, tools.mjs 源码分析）+ MCP 协议探针（initialize/tools/list/tools/call 握手与响应格式）+ eval harness 路由评测（run-eval.mjs 15 条中文意图）+ hcloud CLI 只读查询（ECS ListServersDetails，readonly 子账号 test001 凭证）。真云写 E2E 因 admin AK/SK 过期（APIGW.0301）+ 沙箱协议未签署（HDKIT_NOT_AGREEMENT）标 BLOCKED。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `135 / 2 / 9 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 137） | `98.5%` |
| P0 / P1 / P2 新增缺陷 | `1 / 1 / 0` |
| 红线（I 类）违规 | `无` |
| 资源释放 | `无需释放（无真云写资源创建；readonly 查询无副作用）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `97` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `9` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `plugins/huaweicloud-core/src/risk-rule-engine.mjs`: hook_check_command 不扫描 CLI 参数值中的明文 adminPass，仅 hook_check_artifacts 检测 IaC 文件中的 adminPass | 待提单 |
| 2 | P1 | `EXP-E01` | D10评测 | 路由准确率-查ECS意图 | `plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog: 中文意图"帮我查一下我账号在华北北京四有哪些云主机"未命中 ECS，返回"Run hcloud --help" | 待提单 |

### 根因详情

**D4-3（P0）**：
- 期望：hook_check_command 拦截 `hcloud ECS CreateServers --Server.adminPass=MyPassword123!` 中的明文密码
- 实际：返回 `decision=allow, findings=[]`，未检测到明文 adminPass
- 根因：`risk-rule-engine.mjs` 的 `evaluateCommandRisk` 只匹配命令文本中的 credential-file/env-dump 模式，不解析 CLI 参数值（`--Server.adminPass=xxx`）中的明文密钥；`hook_check_artifacts` 能检测 IaC 文件中的 adminPass（`hwc-command-adminpass-exposure` 规则），但 `hook_check_command` 缺失等价检测
- 证据：`evidence/D4-3/stdout.log`

**EXP-E01（P1）**：
- 期望：serviceCatalog 路由中文意图"帮我查一下我账号在华北北京四有哪些云主机"→ECS
- 实际：返回 `recommendedServices: ["Run hcloud --help to list available services."]`，未命中 ECS
- 根因：`mcp-server.mjs` serviceCatalog 路由层对该查询类中文意图未匹配 ECS 关键词（"云主机"未映射到 ECS 服务）
- 证据：`evidence/EXP-E01/stdout.log`

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | ECS lifecycle E2E requires write (create/delete ECS). Admin AK/SK expired (APIGW.0301). Readonly creds valid for read-only only. |
| `D3-C2` | D3功能 | OBS静态站部署E2E | OBS static site E2E requires creating bucket. Admin AK/SK expired (APIGW.0301). |
| `D3-C3` | D3功能 | 沙箱部署E2E | Sandbox deploy E2E requires sandbox access. sandbox_check_user returned HDKIT_NOT_AGREEMENT. |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | Sandbox 7 tools requires sandbox access. sandbox_check_user returned HDKIT_NOT_AGREEMENT. |
| `D3-C13` | D3功能 | OBS 静态网站托管配置 | OBS static website config requires existing bucket + write. Admin AK/SK expired (APIGW.0301). |
| `D3-S2` | D3功能 | 场景-删VPC先确认 | Delete VPC requires write operations. Admin AK/SK expired (APIGW.0301). plan_cli_command + hook_check flow verified for write classification. |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Sandbox preview URL requires sandbox access. sandbox_check_user returned HDKIT_NOT_AGREEMENT. |
| `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | FunctionGraph scheduled task requires creating function + trigger (write operation). Admin AK/SK expired (APIGW.0301). plan_cli_command classifies CreateFunction as write. |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | Cross-service delivery requires creating RDS + sandbox deploy. Admin AK/SK expired + sandbox agreement not signed. |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`。hook_check_command 拦截凭证文件读取（D4-1）、env 打印（D4-2）、bash/sh 包裹穿透（D4-15/D4-16），均 deny。show_profile_redacted 全字段 <redacted>（D2-4）。
- [x] 写操作误判 read-only：`无`。plan_cli_command 正确分类 ECS CreateServers 为 write/deny（D4-5/D4-18），DeleteServers 为 destructive/warn（D4-9）。
- [x] 红线（I 类）违规：`无`。PASS 门禁通过（verify_no_fake_pass.py），覆盖率门禁通过（verify_coverage.py，P0 无 NOT_RUN）。
- [x] 脱敏复核：`通过`。hook_check_artifacts findings.evidence 中 adminPass 被替换为 <redacted>（D4-21）；run_readonly_command rawArgs 中 AK/SK/token 均为 <redacted>（D3-B3）。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS (ListServersDetails) | 无（只读查询） | N/A | count=0, servers=[] |
| VPC/EIP/RDS/OBS | 无（BLOCKED，admin AK/SK 过期） | N/A | N/A |
| 沙箱 | 无（BLOCKED，协议未签署） | N/A | N/A |

> 本次测试未创建任何真云写资源。readonly 子账号（test001）执行 ListServersDetails 返回 count=0（无残留）。admin AK/SK 过期导致写 E2E 用例 BLOCKED，未产生任何计费资源。

---

## 八、遗留与建议

- **D4-3 缺陷**：hook_check_command 应增加 CLI 参数值明文密钥扫描（与 hook_check_artifacts 的 adminPass 检测对齐）。修复建议：在 evaluateCommandRisk 中解析 `--*adminPass=*` / `--*password=*` 参数值并匹配 secret 正则。
- **EXP-E01 缺陷**：serviceCatalog 应增加"云主机"→ECS 的中文意图关键词映射。当前 92.9% 路由准确率（13/14 HIT），EXP-E01 为唯一 MISS。
- **BLOCKED 用例（9 项）**：admin AK/SK 过期（APIGW.0301）+ 沙箱协议未签署（HDKIT_NOT_AGREEMENT）。需在 IAM 控制台重新签发 admin AK/SK，并由用户签署沙箱最新协议后重跑 D3-C1/C2/C3/C6/C13/S2/S3/S6/S7。
- **环境修复建议**：credentials.json 中 admin AK/SK 失效（securityToken 为空但 AK/SK 返回 401），需通过 IAM 控制台创建新的永久 AK/SK 或重新获取有效 STS token。
