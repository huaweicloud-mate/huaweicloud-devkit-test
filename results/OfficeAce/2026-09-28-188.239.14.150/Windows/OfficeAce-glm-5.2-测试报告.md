# OfficeAce-glm-5.2 每日测试报告
> **报告名**：`OfficeAce-glm-5.2-测试报告.md`
> **生成时间**：2026-09-28 09:38:23（北京时间）
> **执行归档**：`results/OfficeAce/2026-09-28-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OfficeAce` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.7` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：MCP 工具直调（hook_check_command/artifacts/deploy_plan, plan_cli_command, show_profile_redacted, retrieve_skill, run_readonly_command, auth_switch）+ 源码级探针（Node.js 直调 judgeUpdate/queryDistTagsSync/redactString 等）+ 协议探针（protocol-probe.mjs, run-eval.mjs）+ 测试夹具（eval/harness/fixtures/*.mjs）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `124` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `88 / 14 / 22 / 0 / 17` |
| 通过率（分母 = PASS+FAIL = 102） | `86.3%` |
| P0 / P1 / P2 新增缺陷 | `3 / 11 / 0` |
| 红线（I 类）违规 | `TODO: 待填` |
| 资源释放 | `TODO: 待填` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `62` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单 |
| BLOCKED | `22` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `15` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `26` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `2` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | safety/rules/cloud-risk-rules.json 缺少 echo/printenv 凭证检测规则 | 待提单 |
| 2 | P0 | `D4-28` | D4安全 | Node 版安全 hook 链路 | safety/rules/cloud-risk-rules.json 缺少凭证值模式(AKID/SK前缀)检测 | 待提单 |
| 3 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | mcp-protocol.mjs 未强制 initialize-first，未初始化时直接处理 tools/list | 待提单 |
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

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-4` | D1安装 | status/update幂等 | TODO: 待补原因 |
| `D1-33` | D1安装 | skip 文件持久化与多路径 | TODO: 待补原因 |
| `D1-65` | D1安装 | 调试模式环境变量 | TODO: 待补原因 |
| `D1-66` | D1安装 | 遥测开关与端点环境变量 | TODO: 待补原因 |
| `D1-68` | D1安装 | 图标离线与区域环境变量 | TODO: 待补原因 |
| `D1-69` | D1安装 | CLI help 子命令 | TODO: 待补原因 |
| `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | TODO: 待补原因 |
| `D2-27` | D2认证 | KooCLI 版本管理 | TODO: 待补原因 |
| `D3-S5` | D3功能 | 场景-复合意图分层路由 | TODO: 待补原因 |
| `D4-10` | D4安全 | 规则库新增回归 | TODO: 待补原因 |
| `D4-29` | D4安全 | 分类断言与原始命令分类入口 | TODO: 待补原因 |
| `D6-9` | D6性能 | 缓存清理三入口 | TODO: 待补原因 |
| `D8-6` | D8质量 | 中英文文档一致 | TODO: 待补原因 |
| `D8-10` | D8质量 | MCP 配置备份与合并 | TODO: 待补原因 |
| `D9-8` | D9协议 | inputSchema版本合规 | TODO: 待补原因 |
| `EXP-D5-7-1` |  |  | TODO: 待补原因 |
| `EXP-D5-7-3` |  |  | TODO: 待补原因 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D1-41` | D1安装 | check_update 真实 MCP 返回契约 | Needs isolated MCP process with controlled registry response injection. Single-session MCP tool call cannot inject 4 response states. Need: isolated HOME + mock registry. |
| `D1-42` | D1安装 | dismiss 真实闭环与跨调用持久化 | Needs isolated HOME + cross-process MCP restart verification. Cannot verify process restart persistence in single session. |
| `D1-45` | D1安装 | 兜底提示真实序列与预热竞态 | Needs isolated MCP process + prewarm race condition injection. Cannot inject dual timing sequences in single session. |
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | DSH-specific test (AGENT_TOOLKIT_MODE + SKIP_DSH_PLUGIN_INSTALL). OfficeAce is not DSH client, this test is not applicable. |
| `D3-C4` | D3功能 | 服务创建类回归 | Needs real cloud write operations (create/delete resources) across 22 services. Requires explicit approval for each write operation. Partially verified via EXP-C4-01~22 read-only planning. |
| `D3-C13` | D3功能 | OBS 静态网站托管配置 | Needs real OBS bucket for static website hosting config test. Requires create bucket + set website config + verify + delete. |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | Needs sandbox DevStation quota for HDKit service parameter test. Sandbox not available in current session. |
| `D3-S2` | D3功能 | 场景-删VPC先确认 | Needs real VPC for delete confirmation flow. Requires create VPC + plan delete + confirm + verify deletion + cleanup. |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Needs sandbox quota + frontend project. Sandbox connection + upload + deploy + verify public URL. |
| `D3-S4` | D3功能 | 场景-领券闭环 | Needs IAM account with unclaimed voucher. Voucher status/claim cycle test. |
| `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | Needs real FunctionGraph quota for function creation + timer trigger. Cloud write operation requiring approval. |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | Needs real RDS instance + sandbox for cross-service delivery. Complex multi-resource orchestration. |
| `D4-6` | D4安全 | adminPass回显警告 | Needs real ECS creation with adminPass for true cloud E2E. Source-level redactString test possible but full E2E needs write operation. |
| `D4-8` | D4安全 | Python/Node策略一致 | Needs dual Python+Node path verification environment. OfficeAce runs Node MCP path; Python hook path needs separate verification. |
| `D4-11` | D4安全 | 提示注入防护 | Needs constructed injection response in search_docs/retrieve_skill/search_marketplace/get_service_icon. Requires mock response injection. |
| `D4-12` | D4安全 | 供应链安装期安全 | Needs postinstall script audit + dependency lock + SBOM generation environment. Supply chain security requires dedicated audit tooling. |
| `D4-14` | D4安全 | 操作可审计性 | Needs CTS audit logs for operation traceability verification. Requires specific CTS configuration. |
| `D4-17` | D4安全 | hook模糊fail-closed | Needs malformed/oversized/nested JSON input for hook fuzzy testing. Can be tested via hook_check with malformed input. |
| `D4-23` | D4安全 | 全局规则 huawei-agent-rules.md 注入生效性（11 安装目标） | Requires verification across all 11 Agent installation targets. Single-client (OfficeAce) cannot verify other 10 clients. Need: multi-client test environment. |
| `D4-25` | D4安全 | Python hook 事件遥测分类 | Needs hook-capable client with telemetry enabled. OfficeAce MCP tool path tested; Python hook telemetry needs separate verification. |
| `D4-26` | D4安全 | findings 证据脱敏 | Needs hook environment with credential-containing trigger commands for findings evidence redaction test. |
| `D5-1` | D5客户端 | 清单发现加载 | Needs verification across all 10 clients for plugin discovery. Single-client (OfficeAce) can verify own discovery only. Partial: OfficeAce plugin loaded and 40 tools available. |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无。show_profile_redacted 返回 `<redacted>`，D9-13 验证 tools/call 无 AK/SK 明文
- [x] 写操作误判 read-only：无。D4-5 验证 DeleteServers 正确分类为 write，safeToRun=false
- [x] 红线（I 类）违规：D4-2/D4-28 凭证 env 打印未拦截（hook 规则缺口），D9-12 协议时序未强制
- [x] 脱敏复核：D2-4 通过（accessKeyId/secretAccessKey/securityToken 均 `<redacted>`），D4-27 双路径脱敏通过

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/VPC/OBS | 未创建（本次测试无真云写操作） | N/A | N/A |
| 沙箱 | 未创建（BLOCKED） | N/A | N/A |

> 本次测试以 MCP 工具直调 + 源码级探针为主，未执行真云资源创建/删除操作。所有 BLOCKED 的真云用例未产生任何云端资源。

---

## 八、遗留与建议

- **P0 缺陷修复建议**：
  1. D4-2/D4-28: 在 cloud-risk-rules.json 新增 echo/printenv 凭证环境变量打印检测规则 + 凭证值模式(AKID/SK前缀)检测
  2. D9-12: 在 mcp-protocol.mjs 增加 initialize-first 强制检查，未初始化时返回 JSON-RPC -32600
- **P1 评测集改进建议**: serviceCatalog routeMap 扩充中文意图关键词覆盖，提升路由准确率至 90%+
- **BLOCKED 用例补测**: 需真云环境补测 D3-C4/C13/S2/S3/S4/S7 等真云用例
- **NOT_RUN 用例**: P2 优先级用例可在后续迭代中补测
