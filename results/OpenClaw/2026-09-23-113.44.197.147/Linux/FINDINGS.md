# FINDINGS — 缺陷发现清单（OpenClaw-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenClaw/2026-09-23-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：2026-09-23 05:41（北京时间）
> **被测版本**：`v1.1.6`（npm latest 正式版，gitHead `46152dd`，release-1.1.6）
> **工具全集**：40（`tools.mjs` TOOL_DEFINITIONS）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格。

## 去重结论（本轮先读）

本轮按「每日测试」强制完整重跑，全量探针 fresh 执行、证据全新落盘，被测 v1.1.6（gitHead `46152dd`），与 2026-09-22 的 v1.1.5 相比本次为**跨版本升级测试**。v1.1.6 已修复 2 项历史缺陷（见「版本修复」节，不计入新提单）：**D4-17**（hook 畸形输入 fail-open→fail-closed，`risk-rule-engine.mjs` 新增 `invalidRiskResult`，#564）与 **D9-2 tools/call 未知工具/缺参**（`mcp-protocol.mjs` 返回 -32602，#704）。其余 14 项 FAIL/SPEC 均为**历史同源**缺陷（多客户端多轮复现，上游已开单），`file_issue.py` 将自动查重，命中即不重复提单并生成 `HISTORY_LINKS.md`。

## 版本修复（v1.1.6 已修复，不计入提单）

- **D4-17**：hook 三工具畸形输入 fail-closed。#564 新增 `invalidRiskResult()`（`risk-rule-engine.mjs:125-136`），`evaluateCommandRisk`/`evaluateArtifacts`/`evaluateDeployPlan` 非空输入校验。今日实测 6 组畸形输入全部 `deny`+findings 非空 → **PASS**。
- **D9-2（tools/call 部分）**：#704 新增未知工具与缺必填参 `-32602`（`mcp-protocol.mjs:62-79`）。今日实测 `tools/call missing name`/`unknown tool` 均返回 `-32602` → 该子项已修复。

---

## #1【P0】D4-2 凭证 env 打印拦截不完整（`env | grep HW_SECRET_KEY` 漏网）

- **现象**：`env | grep HW_SECRET_KEY` 返回 `allow`（应 `deny`）；同族 `printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY`、`env | grep HUAWEICLOUD_ACCESS_KEY_ID` 均已 `deny`。
- **断言**：`env | grep HW_SECRET_KEY` 应返回 `deny`（唯一可判定：env-dump 分类 = deny）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398-405` env-dump 门正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_` 前缀；下方变量引用门（:414-419）只匹配 `$HW_*`/`printenv HW_*` 语法，`env | grep HW_SECRET_KEY` 无 `$` 也不含 `printenv`，两门均落空回退 `allow`。
- **影响**：高危凭证环境变量打印可绕过分类放行。
- **证据**：`evidence/d4-security-core/probe-p0-security.stdout.log`
- **状态**：历史同源（#650 等，`echo/printenv` 子项已在 #650 修复，`env | grep` 子项残留）

## #2【P0】D4-16 命令包裹穿透（`sh -c "env|grep"` 未解包）

- **现象**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY_ID"` 返回 `allow`（应 `deny`）；`bash -c "cat ~/.config/huaweicloud/credentials.json"` 已被 `deny`。
- **断言**：`sh -c "env | grep HUAWEICLOUD"` 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:384-401` `classifyTextCommand` 在 raw `text` 上先跑 env-dump 门（正则要求 `(^|\s)(env|printenv...)`，`sh -c "env ...` 中 `env` 前是引号非空白，不命中），且文本路径不做 `sh -c`/`bash -c` 解包（`stripExecutable` 仅作用于 hcloud args 路径 :67-98）。
- **影响**：命令包裹绕过凭证打印拦截。
- **证据**：`evidence/d4-security-core/probe-p0-security.stdout.log`
- **状态**：历史同源（#650 等，`bash -c cat credentials` 子项已修复，`sh -c env|grep` 子项残留）

## #3【P0】D4-21/D4-7 hook_check_artifacts broad IAM (`actions=["*"]`) 未检出

- **现象**：HCL `resource "huaweicloud_iam_policy" "p" { statement { actions = ["*"] } }` 经 `hook_check_artifacts` 返回 `allow`（应 `deny`）；`hook_check_deploy_plan` 公网暴露 22 端口已 `deny`。
- **断言**：broad IAM（`actions = ["*"]`）应被检出并 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:179-201` `hwc-iam-admin-policy` 三条正则均大小写敏感：要求 `"Action"`（大写 A）、`"Effect":"Allow"`、`Statement`（大写 S），而 Terraform HCL 惯用小写 `statement { ... }`、`actions = [...]`、无显式 `Effect` 块，故 `all` 匹配失败漏检。
- **影响**：高危策略制品预检漏检。
- **证据**：`evidence/d4-security-core/probe-p0-security.stdout.log`、`evidence/d4-security-core/probe-d4-7-hooks.stdout.log`
- **状态**：历史同源（#651/#652 等）

## #4【P0】D4-23 全局规则 huawei-agent-rules.mdc 注入失效

- **现象**：`package.json` `files` 白名单不含 `rules/`，setup-cli 未引用 rules/.mdc 注入，安装目标缺失注入的 agent-rules 文件。
- **断言**：package.json `files` 白名单应含 `rules/`。
- **根因**：`package.json:8-17` `files` 数组仅含 `cordis.patch.yml`/`bin`/`.agents`/`plugins/huaweicloud-core`/`integrations/*`，漏 `rules/`；全局规则安装注入链断。
- **影响**：全局安全规则未随安装注入到 agent。
- **证据**：`evidence/d4-security-core/probe-d4-23-rules.stdout.log`
- **状态**：历史同源（#651/#673/#674/#676/#679 等）

## #5【P1】D4-6 adminPass 空格形式未脱敏

- **现象**：`hcloud ECS CreateServers --adminPass Secret123 ...`（空格形式）回显未脱敏（args 保留 `Secret123`）；等号形式已脱敏（`<redacted>`）。
- **断言**：空格形式 adminPass 值应 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42-46` `redactString` 敏感键正则要求 `[:=]` 分隔符，`--adminPass Secret123` 空格形式不命中；`decide` 能告警但 args 回显未脱敏。
- **影响**：明文密码进入回显/日志。
- **证据**：`evidence/d4-security-core/probe-d4-6-adminpass.stdout.log`
- **状态**：历史同源（#712/#651/#673/#679 等）

## #6【P2】D4-25 Python hook 写命令遥测误分类为 cli:invoke（WRITE_OPERATION_RE 无空白边界）

- **现象**：`record_cli_event("hcloud VPC CreateSecurityGroup ...")` 产出事件 key 为 `cli:invoke`（应 `cli:write`）。
- **断言**：写操作动词 Create/Delete/Update 命中 `cli:write`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 用 `(^|[A-Za-z0-9])` 前缀，动词前紧邻空格（`VPC CreateSecurityGroup`）不命中行首/字母数字，漏判写分类。
- **影响**：Python hook 遥测「写操作」维度失真。
- **证据**：`evidence/new-cases/probe-d4-25-telemetry.stdout.log`
- **状态**：历史同源（#752，2026-09-20 AtomCode 已合单）

## #7【P1】D4-27 双路径输出脱敏不完整（裸 token=/小写 ak=/sk= 未脱敏）

- **现象**：`redactSecrets` 对象键 ak/sk/token/password/secret_key/adminPass 均 `<redacted>`，但文本裸 `token=`、小写 `ak=`/`sk=` 未脱敏。
- **断言**：裸 `token=`、小写 `ak=`/`sk=` 应无明文。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-46` `redactString` 仅覆盖大写 `(AK|SK)` 与 `access_key/secret_key/...` 身份键，未覆盖裸 `token=`、小写 `ak=`/`sk=`。
- **影响**：文本场景凭证泄漏。
- **证据**：`evidence/d4-security-core/probe-d4-27-redact.stdout.log`
- **状态**：历史同源（#726/#683 等）

## #8【P1】D9-2 JSON-RPC 错误码：tools/list 传 string params 未返回 -32602

- **现象**：`tools/list` 传 `params` 为 string，未返回 `-32602`（实际无 error 对象，正常返回 40 工具）。tools/call 的 unknown-tool/缺参 -32602 已于 v1.1.6 修复。
- **断言**：非法 params 应返回 `-32602`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57-59` `tools/list` 分支不做 params 类型校验（v1.1.6 仅在 tools/call 分支补了校验）。
- **影响**：协议合规性缺口。
- **证据**：`evidence/d9-protocol/probe-d9-2-invalid.stdout.log`、`eval/results/protocol-probe-20260922212632.json`
- **状态**：历史同源（#643/#672/#704 等，tools/list 子项残余）

## #9【P1】D9-4 协议生命周期：initialize 前 tools/list 未按规范报错

- **现象**：未 `initialize` 即 `tools/list` 仍正常返回 40 工具，未按 MCP 生命周期报错。
- **断言**：initialize 前 tools/list 应先报错。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:30-59` dispatch 无「已 initialize」门控状态。
- **影响**：协议生命周期合规缺口。
- **证据**：`evidence/d9-protocol/probe-d9-edge.stdout.log`
- **状态**：历史同源（#699 等）

## #10【P2】D9-7 协议版本协商降级：protocolVersion 不校验不回显

- **现象**：`initialize protocolVersion="2024-10-01"` / `"2099-01-01"` 均原样回显，不校验不降级。
- **断言**：应校验并回显 protocolVersion（未知版本应协商降级）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:46` `protocolVersion: params.protocolVersion || '2024-11-05'` 无校验协商逻辑。
- **影响**：协议版本协商合规缺口。
- **证据**：`evidence/d9-protocol/probe-d9-edge.stdout.log`
- **状态**：历史同源（#702 等）

## #11【P1】D9-9 tools/call 超时协议语义与取消（capabilities.cancellation 未暴露，SPEC）

- **现象**：`initialize.result.capabilities` 仅 `{tools:{}}`，未声明 `notifications.cancellation`。
- **断言**：`capabilities.cancellation` 应声明。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47-49` capabilities 仅写 `tools:{}`，缺 `notifications.cancellation`（契约漂移）。
- **影响**：协议契约漂移。
- **证据**：`evidence/d9-protocol/probe-d9-6-9-crossclient.stdout.log`
- **状态**：历史同源（#698 等）

## #12【P1】D10-3 服务目录中文意图路由准确率 21.4%（< 90%）（覆盖 EXP-E01~E15）

- **现象**：15 条中文意图仅 HIT=3（ECS 诊断 N/A），MISS=11，准确率 21.4%；英文意图 ECS/RDS/OBS 均 HIT。
- **断言**：中文意图路由准确率应 ≥ 90%。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1816-1946` `serviceCatalog` 的 `routeMap` 关键词全为英文（ecs/server/vm、obs/bucket/storage、rds/mysql/database…），中文意图（云主机/对象存储/数据库/云监控…）无任何中文关键词映射，`cjk` 分支仅对「含空格的英文多词」或「关键词本身含中文」生效，中文意图整体落空回退默认。
- **影响**：中文场景意图理解准确率低。
- **证据**：`evidence/d10-routing/probe-d10-routing.stdout.log`
- **状态**：历史同源（#705/#706/#714/#689/#680 等）

## #13【P2】D3-S5 复合中文意图分层路由拆分失败（全角逗号不拆分，仅命中单路 sandbox）

- **现象**：`serviceCatalog('部署一个网站，数据库用 MySQL，还需要对象存储')` 返回 `recommendedServices=["Sandbox","DevStation"]`，MySQL→RDS、对象存储→OBS 两路未命中。
- **断言**：`recommendedServices` 应同时含 `RDS` 与 `OBS`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1923` tokenizer `it.split(/[\s,./-]+/)` 仅按 ASCII 逗号断开，中文全角逗号 `，` 不拆分（与 D10-3 中文关键词缺失同族但为独立根因）。
- **影响**：中文复合意图分层路由失效。
- **证据**：`evidence/new-cases/probe-new-deterministic.stdout.log`
- **状态**：历史同源（#762/#761/#752 等，独立根因已复核）

## #14【非产品缺陷】D3-S3 沙箱预览 expose 步骤 BLOCKED（沙箱镜像 devbridge 0.1.13 + 无 API Key）

- **现象**：真机沙箱 E2E 核心步骤 connect / check_user / upload_project / deploy_nginx 全部 PASS，仅 expose 失败：沙箱内 `devbridge 0.1.13-release` 硬编码网关 `cn-north-4-bridge.myhuaweicloud.com` 已迁移失效（`devbridge host` 报 `Connection failed`），且沙箱未预置 0.2.x API Key（`/tmp/hw_api_key` 不存在、`sandbox_credentials` 无 `api_key` 注入），无法升级到 0.2.x 暴露公网 URL。
- **说明**：缺的是账号级 DevBridge API Key 凭证 + 沙箱镜像 0.2.x devbridge，非 hdk 源码缺陷（hdk 1.1.6 已实现 `sandbox_credentials` 的 `api_key` 注入路径）。计 BLOCKED + blockedReason，不计入产品缺陷提单。
- **证据**：`evidence/realcloud/probe-d3-s3-sandbox.stdout.log`

## #15【非产品缺陷】EXP-E08 真实 Agent 会话诊断意图 BLOCKED（非 DSH 客户端缺会话级 harness）

- **现象**：`eval/harness/run-eval.mjs` 的 serviceCatalog 确定性路由层对 E08「诊断意图」返回 N/A，无法代理真实 LLM Agent 判断是否路由 `huaweicloud_explain_error`。
- **说明**：需可交互真实 Agent 会话自动化（仅 DSH/装了 dsh 客户端可用），本机 OpenClaw 无 dsh 且无 CDP 会话自动化环境。计 BLOCKED + blockedReason，不计入产品缺陷提单。
- **证据**：`evidence/d10-routing/probe-d10-routing.stdout.log`