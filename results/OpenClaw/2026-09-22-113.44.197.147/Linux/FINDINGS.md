# FINDINGS — 缺陷发现清单（OpenClaw-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenClaw/2026-09-22-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：2026-09-22 05:55（北京时间）
> **被测版本**：`v1.1.5`（npm latest 正式版，gitHead `e7ed6f6`，release-1.1.5）
> **工具全集**：40（`tools.mjs` TOOL_DEFINITIONS）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格。

## 去重结论（本轮先读）

本轮按「每日测试」强制完整重跑，全量探针 fresh 执行、证据全新落盘，被测 v1.1.5（e7ed6f6），与 2026-09-21 同版本（自 prepare_env 半自动切成 1.1.6-next.0 后，本 agent 依据 AGENTS.md §0「默认 latest 正式版」强制 `--latest` 回归 1.1.5）。15 项 FAIL + 1 项 SPEC-MISMATCH 全部为 **历史同源**缺陷（多客户端多轮复现，上游已开单）。`file_issue.py` 将自动做历史查重，命中即不重复提单，生成 `HISTORY_LINKS.md` 关联清单；仅在有确凿新根因时才开新单。

---

## #1【P0】D4-2 凭证 env 打印拦截不完整（HW_SECRET_KEY 漏网）

- **现象**：`env | grep HW_SECRET_KEY` 返回 `allow`（应 `deny`）；同族 `printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 已 `deny`。
- **断言**：`env | grep HW_SECRET_KEY` 应返回 `deny`（唯一可判定：env-dump 分类 = deny）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` env-dump 正则/枚举未覆盖 `HW_SECRET_KEY` 这一 `HW_` 前缀键的精确形态（覆盖了 `HW_ACCESS_KEY` 但漏同前缀 secret 键）。
- **影响**：高危写/读分类绕过，凭证环境变量打印可放行。
- **证据**：`evidence/d4-security-core/probe-p0-security.stdout.log`
- **状态**：历史同源（#651/#652/#673/#674/#676/#679/#681/#682/#690/#694 等）

## #2【P0】D4-16 命令包裹穿透（`sh -c "env|grep"` 未解包）

- **现象**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY_ID"` 返回 `allow`（应 `deny`）；`bash -c "cat ~/.config/huaweicloud/credentials.json"` 已被 `deny`。
- **断言**：`sh -c "env | grep HUAWEICLOUD"` 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` 包裹命令（`sh -c`/`bash -c` 内嵌）未解包再判，仅对部分包裹形态（cat 文件读取）生效。
- **影响**：命令包裹绕过凭证打印拦截。
- **证据**：`evidence/d4-security-core/probe-p0-security.stdout.log`
- **状态**：历史同源（#651/#652/#673/#674/#676/#679 等）

## #3【P0】D4-21 hook_check_artifacts broad IAM policy (actions=["*"]) 未检出

- **现象**：HCL `iam_policy_document`/策略制品 `actions=["*"]` 经 `hook_check_artifacts` 仍返回 `allow`（应 `deny`）。
- **断言**：broad IAM（actions=["*"]）应被检出并 `deny`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs`（或制品规则）缺 broad IAM 规则。
- **影响**：高危策略制品预检漏检。
- **证据**：`evidence/d4-security-core/probe-p0-security.stdout.log`
- **状态**：历史同源（#651/#652 等）

## #4【P0】D4-23 全局规则 huawei-agent-rules.mdc 注入失效

- **现象**：`package.json` `files` 白名单不含 `rules/`，setup-cli 未引用 rules/.mdc 注入，安装目标缺失注入的 agent-rules 文件。
- **断言**：package.json `files` 白名单应含 `rules/`。
- **根因**：`plugins/huaweicloud-core/package.json` `files` 白名单未含 `rules/`，全局规则安装注入链断。
- **影响**：全局安全规则未随安装注入到 agent。
- **证据**：`evidence/d4-security-core/probe-d4-23-rules.stdout.log`
- **状态**：历史同源（#651/#673/#674/#676/#679 等）

## #5【P1】D4-6 adminPass 空格形式未脱敏

- **现象**：`hcloud ECS CreateServers --adminPass Secret123 ...`（空格形式）回显未脱敏；等号形式已脱敏（`<redacted>`）。
- **断言**：空格形式 adminPass 值应 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` adminPass 回显警告/脱敏仅覆盖等号形式。
- **影响**：明文密码进入回显/日志。
- **证据**：`evidence/d4-security-core/probe-d4-6-adminpass.stdout.log`
- **状态**：历史同源（#712/#651/#673/#679 等）

## #6【P1】D4-7 hook 三工具有效性不完整（hook_check_artifacts broad IAM 未拦截）

- **现象**：`hook_check_command` 高危 env dump / 凭证文件读取均 `deny`，但 `hook_check_artifacts` broad IAM 仍 `allow`。
- **断言**：hook_check_artifacts HCL broad IAM 应 `deny`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` broad IAM 规则缺失。
- **影响**：制品侧 hook 漏检。
- **证据**：`evidence/d4-security-core/probe-d4-7-hooks.stdout.log`
- **状态**：历史同源（#651/#652 等）

## #7【P1】D4-17 hook 三工具畸形输入 fail-open

- **现象**：`hook_check_command(null/"")`、`hook_check_artifacts("not-an-array")`、`hook_check_deploy_plan(null/12345)` 均返回 `{decision:"allow"}`（应 fail-closed）。
- **断言**：畸形输入应 fail-closed（deny），非 allow。
- **根因**：`plugins/huaweicloud-core/src/*` hook 三工具异常输入处理缺 fail-closed 分支。
- **影响**：异常输入放行，绕过安全预检。
- **证据**：`evidence/d4-security-core/probe-d4-17-hook.stdout.log`
- **状态**：历史同源（#564/#689 等）

## #8【P2】D4-25 Python hook 写命令遥测误分类为 cli:invoke（WRITE_OPERATION_RE 无词边界）

- **现象**：`record_cli_event("hcloud VPC CreateSecurityGroup ...")` 产出事件 key 为 `cli:invoke`（应 `cli:write`）。
- **断言**：写操作动词 Create/Delete/Update 命中 `cli:write`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 用 `(^|[A-Za-z0-9])` 前缀，动词前紧邻空格（`VPC CreateSecurityGroup`）不命中行首/字母数字，漏判写分类。
- **影响**：Python hook 遥测「写操作」维度失真。
- **证据**：`evidence/new-cases/probe-d4-25-telemetry.stdout.log`
- **状态**：历史同源（#752，2026-09-20 AtomCode 已合单）

## #9【P1】D4-27 双路径输出脱敏不完整（裸 token=/小写 ak=/sk= 未脱敏）

- **现象**：`redactSecrets` 对象键 ak/sk/token/password/secret_key/adminPass 均 `<redacted>`，但文本裸 `token=`、小写 `ak=`/`sk=` 未脱敏。
- **断言**：裸 `token=`、小写 `ak=`/`sk=` 应无明文。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` 脱敏模式未覆盖裸 token/小写键。
- **影响**：文本场景凭证泄漏。
- **证据**：`evidence/d4-security-core/probe-d4-27-redact.stdout.log`
- **状态**：历史同源（#726/#683 等）

## #10【P1】D9-2 JSON-RPC 错误码：tools/list 传 string params 未返回 -32602

- **现象**：`tools/list` 传 `params` 为 string，未返回 `-32602`（实际无 error 对象）。
- **断言**：非法 params 应返回 `-32602`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` 未校验 params 类型。
- **影响**：协议合规性缺口。
- **证据**：`evidence/d9-protocol/probe-d9-2-invalid.stdout.log`、`eval/results/protocol-probe-*.json`
- **状态**：历史同源（#704/#643/#672 等）

## #11【P1】D9-4 协议生命周期：initialize 前 tools/list 未按规范报错

- **现象**：未 `initialize` 即 `tools/list` 仍正常返回 40 工具，未按 MCP 生命周期报错。
- **断言**：initialize 前 tools/list 应先报错。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` 生命周期门控缺失。
- **影响**：协议生命周期合规缺口。
- **证据**：`evidence/d9-protocol/probe-d9-edge.stdout.log`
- **状态**：历史同源（#699 等）

## #12【P2】D9-7 协议版本协商降级：protocolVersion 不校验不回显

- **现象**：`initialize protocolVersion="2024-10-01"` / `"2099-01-01"` 均原样回显，不校验不降级。
- **断言**：应校验并回显 protocolVersion（未知版本应协商降级）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` 版本协商逻辑缺失。
- **影响**：协议版本协商合规缺口。
- **证据**：`evidence/d9-protocol/probe-d9-edge.stdout.log`
- **状态**：历史同源（#702 等）

## #13【P1】D9-9 tools/call 超时协议语义与取消（capabilities.cancellation 未暴露，SPEC）

- **现象**：`initialize.result.capabilities` 未暴露 `notifications.cancellation`。
- **断言**：`capabilities.cancellation` 应声明。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` capabilities 未暴露 cancellation（契约漂移）。
- **影响**：协议契约漂移。
- **证据**：`evidence/d9-protocol/probe-d9-6-9-crossclient.stdout.log`
- **状态**：历史同源（#698 等）

## #14【P1】D10-3 服务目录中文意图路由准确率 21.4%（< 90%）

- **现象**：15 条中文意图仅 HIT=3（ECS 诊断 N/A），MISS=11，准确率 21.4%；英文意图 ECS/RDS/OBS 均 HIT。
- **断言**：中文意图路由准确率应 ≥ 90%。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 中文关键词覆盖不足。
- **影响**：中文场景意图理解准确率低。
- **证据**：`evidence/d10-routing/probe-d10-routing.stdout.log`
- **状态**：历史同源（#705/#706/#714/#689/#680 等）

## #15【P2】D3-S5 复合中文意图分层路由拆分失败（全角逗号不拆分，仅命中单路 sandbox）

- **现象**：`serviceCatalog('部署一个网站，数据库用 MySQL，还需要对象存储')` 返回 `recommendedServices=["Sandbox","DevStation"]`，MySQL→RDS、对象存储→OBS 两路未命中。
- **断言**：`recommendedServices` 应同时含 `RDS` 与 `OBS`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1884` tokenizer `it.split(/[\s,./-]+/)` 仅按 ASCII 逗号断开，中文全角逗号 `，` 不拆分（与 D10-3 中文关键词缺失同族但为独立根因）。
- **影响**：中文复合意图分层路由失效。
- **证据**：`evidence/new-cases/probe-new-deterministic.stdout.log`
- **状态**：历史同源（#762/#761/#752 等，独立根因已复核）

## #16【非产品缺陷】D3-S3 沙箱预览 expose 步骤 BLOCKED（沙箱镜像 devbridge 鉴权参数变更）

- **现象**：真机沙箱 E2E 核心步骤 connect / check_user / upload_project / deploy_nginx 全部 PASS，仅最后 expose 步骤失败：沙箱内 `devbridge 0.2.2-release` 已移除 `devbridge auth login --huaweicloud --access-key ... --secret-key ...` 登录参数（现仅剩 `--api-key`），且沙箱未预置 api-key，`devbridge host` 报 `API key expired, please login again`。
- **说明**：此为沙箱镜像 devbridge 版本变更（2026-09-21 同探针旧参数 `Login successful`），非 hdk 源码缺陷（devkit 无 devbridge 鉴权/预置路径）。不计入产品缺陷提单，标 `BLOCKED` + blockedReason。
- **证据**：`evidence/realcloud/probe-d3-s3-sandbox.stdout.log`

## #17【非产品缺陷】EXP-E08 真实 Agent 会话诊断意图 BLOCKED（非 DSH 客户端缺会话级 harness）

- **现象**：`eval/harness/run-eval.mjs` 的 serviceCatalog 确定性路由层能标 E08「诊断意图」为 N/A，但无法代理真实 LLM Agent 判断是否路由 `huaweicloud_explain_error`。
- **说明**：需可交互真实 Agent 会话自动化（仅 DSH/装了 dsh 客户端可用），本 OpenClaw 客户端缺 CDP 会话自动化环境。不计入产品缺陷提单，标 `BLOCKED` + blockedReason。
- **证据**：`evidence/d10-routing/probe-d10-routing.stdout.log`