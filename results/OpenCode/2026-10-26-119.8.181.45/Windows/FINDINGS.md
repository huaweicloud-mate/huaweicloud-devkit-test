# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-10-26-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-26 05:17:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】D4-3 hook_check_command 不拦截 CLI 参数值中的明文 adminPass

- **现象**：`huaweicloud_hook_check_command({ command: "hcloud ECS CreateServers --Server.adminPass=MyPassword123!" })` 返回 `decision=allow, findings=[]`，未检测到明文密码
- **断言**：hook_check_command 对含 `--Server.adminPass=<明文>` 的命令应返回 `decision=deny`，findings 含 `hwc-command-adminpass-exposure` 规则
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs`: `evaluateCommandRisk` 只匹配命令文本中的 credential-file/env-dump 模式，不解析 CLI 参数值（`--Server.adminPass=xxx`）中的明文密钥；`hook_check_artifacts` 能检测 IaC 文件中的 adminPass（`hwc-command-adminpass-exposure` 规则），但 `hook_check_command` 缺失等价检测
- **影响**：用户通过 hcloud CLI 创建 ECS 时，明文密码可能被记录到日志/审计中，存在凭证泄露风险
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #2【P1】EXP-E01 serviceCatalog 中文意图"云主机"未命中 ECS 路由

- **现象**：`huaweicloud_service_catalog({ intent: "帮我查一下我账号在华北北京四有哪些云主机" })` 返回 `recommendedServices: ["Run hcloud --help to list available services."]`，未命中 ECS
- **断言**：serviceCatalog 对含"云主机"的中文意图应返回 `recommendedServices` 含 `ECS`（或 `huaweicloud_run_readonly_command`）
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs`: serviceCatalog 路由层对该查询类中文意图未匹配 ECS 关键词（"云主机"未映射到 ECS 服务），eval harness 评测基线 21.4% MISS，本条为唯一 MISS
- **影响**：用户用"云主机"查询时无法自动路由到 ECS 服务，需手动指定服务名
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #3【非产品缺陷】admin AK/SK 过期导致真云写 E2E 用例 BLOCKED

- **现象**：`huaweicloud_run_readonly_command({ args: ["ECS", "ListServersDetails"] })` 返回 `errorCode: "APIGW.0301"`（IAM 认证失败）
- **说明**：credentials.json 中 admin AK/SK 失效（securityToken 为空但 AK/SK 返回 401），需通过 IAM 控制台创建新的永久 AK/SK 或重新获取有效 STS token。这是环境问题，非产品缺陷。影响 D3-C1/C2/C13/S2/S6/S7 共 6 个真云写 E2E 用例标 BLOCKED。

## #4【非产品缺陷】沙箱 check_user 失败导致沙箱 E2E 用例 BLOCKED

- **现象**：`huaweicloud_sandbox_check_user` 返回 `HDKIT_UPSTREAM_ERROR: 查询实名状态失败`
- **说明**：沙箱服务上游错误，非产品缺陷。影响 D3-C3/C6/S3 共 3 个沙箱 E2E 用例标 BLOCKED。
