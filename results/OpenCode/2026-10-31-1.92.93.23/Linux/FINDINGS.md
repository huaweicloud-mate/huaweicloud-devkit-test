# FINDINGS — 缺陷发现清单（OpenCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenCode/2026-10-31-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：`2026-10-31 05:52:40`（北京时间）

---

## #1【P1】D3-S1 场景-只读查ECS：serviceCatalog 未按 CJK 边界切分，英文码「ecs」黏中文「的」后无法路由

- **现象**：`service_catalog(intent="列出cn-north-4的ECS，只读不改")` 返回 `recommendedServices=["Run hcloud --help to list available services."]`，未命中 ECS。
- **断言**：该意图 `recommendedServices` 必须含 `ECS`。
- **根因**：`tools.mjs:2424` tokenizer 用 `it.split(/[\s,./-]+/)` 切词，不切 CJK 边界，「cn-north-4的ecs」被切成 token `4的ecs`，无法与 routeMap 的英文关键词 `ecs`（`tools.mjs:2200`）精确匹配。
- **影响**：中文场景描述中夹英文服务码的只读查询无法路由到正确服务，影响 D3-S1 等只读场景。
- **证据**：`evidence/D3-S1/stdout.log`

## #2【P2】D3-S5 场景-复合意图分层路由：复合意图「物联网+时序数据+前端托管」无关键词命中

- **现象**：`service_catalog(intent="物联网+时序数据+前端托管")` 返回 fallback，未拆分命中存储(DDS/GaussDB)+托管(OBS/ECS)多 service。
- **断言**：复合意图须命中 ≥2 个对应 service（存储 + 前端托管）。
- **根因**：`tools.mjs:2200+` routeMap 与 tokenizer 无「物联网/时序数据/前端托管」等组合关键词，无法拆分复合意图。
- **证据**：`evidence/D3-S5/stdout.log`

## #3【P2】D3-S6 场景-FunctionGraph定时任务：创建返回的 func_urn 含 `:latest`，DeleteFunction 未归一导致归零失败

- **现象**：真云 CreateFunction 返回 `func_urn=…:latest`，用该 URN 调 DeleteFunction 报 `FSS.0400 "Can't delete the 'latest' version"`，函数无法归零残留。
- **断言**：CreateFunction 创建的定时任务函数应可被 DeleteFunction 成功删除并归零（无 `:latest` 阻隔）。
- **根因**：FunctionGraph 创建返回 `func_urn` 带 `:latest` 后缀，删除前须去 `:latest`，当前 `hcloud-cli.mjs` 真云链路未归一化该后缀。
- **影响**：定时任务函数无法自动归零，真云 E2E 泄漏计费资源。
- **证据**：`evidence/D3-S6/stdout.log`

## #4【P1】D3-S7 场景-跨服务交付(Web+RDS)并归零：复合意图仅命中 RDS，未命中前端托管部署目标

- **现象**：`service_catalog(intent="部署一个带 MySQL 数据库的 Web 应用")` 仅返回 `["RDS"]`，未命中部署目标(沙箱/ECS/OBS)。
- **断言**：复合意图须命中 RDS + 部署目标(sandbox/ECS 之一)。
- **根因**：`tools.mjs:2424` routeMap/分词对「部署 Web 应用」的托管目标无命中，复合意图未拆分「存储 + 托管」双目标。
- **证据**：`evidence/D3-S7/stdout.log`

## #5【P0】D4-2 凭证env打印拦截：裸「access_key」词根未覆盖导致环境凭证 dump 漏拦

- **现象**：`classifyTextCommand("env | grep -i access_key")` 判 `allow`（risk=not_huaweicloud），其余 `HW_/HCLOUD/HUAWEICLOUD_SDK_AK` 变体均 `deny`。
- **断言**：所有环境凭证 dump 变体（含裸 `access_key` 词根）都必须判 `deny`。
- **根因**：`safety-policy.mjs:549-550` env-dump 门 regex 仅覆盖 `HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_` 前缀，未覆盖裸 `access_key` 词根。
- **影响**：P0 安全红线——`env | grep -i access_key` 可绕过拦截泄露凭证。
- **证据**：`evidence/D4-2/stdout.log`

## #6【P1】D4-6 adminPass回显警告：hcloud 的 `--admin_pass`(snake_case) 未触发回显警告

- **现象**：`evaluateCommandRisk("hcloud ECS CreateServer --admin_pass=MyPassword123!")` 返回 decision=allow、findings=[]，无回显警告。
- **断言**：`--admin_pass` 明文密码传入命令应触发 warn 级回显警告。
- **根因**：`cloud-risk-rules.json:372` hwc-command-secret-in-arg 仅匹配 `--adminPass`（camelCase），未覆盖 hcloud CLI 的 `--admin_pass`；`cloud-risk-rules.json:68` hwc-command-adminpass-exposure 的 stages 仅 `artifact/deploy_plan`，不含 `command`。
- **证据**：`evidence/D4-6/stdout.log`

## #7【P1】D4-17 hook模糊fail-closed：无规则命中默认 allow（fail-open）

- **现象**：`classifyTextCommand("???")` / `classifyTextCommand("hcloud")` 判 `allow`。
- **断言**：模糊/异常输入应默认拒绝（fail-closed）。
- **根因**：`safety-policy.mjs:609` 兜底返回 `decision: 'allow'`，无规则命中时 fail-open。
- **证据**：`evidence/D4-17/stdout.log`

## #8【P0】D4-21 hook_check_artifacts 具名回归：HCL `actions=["*"]` 与 `AdministratorFullAccess` 引用未被拦截

- **现象**：`evaluateArtifacts` 对 HCL `actions = ["*"]` 与 `AdministratorFullAccess` 引用均返回 decision=allow、findings=[]；仅 JSON `{"Action":"*"}` 命中。
- **断言**：broad IAM 制品（HCL `actions=["*"]`、`AdministratorFullAccess` 引用）均须拦截。
- **根因**：`cloud-risk-rules.json:196` hwc-iam-admin-policy regex 覆盖 JSON `"Action":"*"`，未覆盖 HCL `actions = ["*"]` 与 `AdministratorFullAccess` 数据源引用。
- **证据**：`evidence/D4-21/stdout.log`

## #9【P2】D4-25 Python hook 事件遥测分类：写操作误入 cli:invoke

- **现象**：Python hook 对 `hcloud vpc CreateVpc` 分类为 `cli:invoke`（应为 `cli:write`）。
- **断言**：只读→`cli:read`、写→`cli:write`、其他→`cli:invoke`。
- **根因**：`hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置捕获组 `(^|[A-Za-z0-9])` 要求写前缀前有字母/数字，「vpc CreateVpc」中 Create 前是空格，匹配失败致写操作误入 invoke。
- **证据**：`evidence/D4-25/stdout.log`

## #10【P0】D9-12 initialize 握手协议安全基线：无 initialize 前置状态机，initialize 不接 runVersionCheck

- **现象**：未 initialize 直接 tools/list 不被拒（listed=true）；initialize 响应无 `_updateInfo`（versionCheck init=false）。
- **断言**：initialize 前置于其他协议方法；initialize 应返回 protocolVersion+capabilities+serverInfo 并接 runVersionCheck。
- **根因**：`mcp-protocol.mjs:34-50` dispatch 无 initialize 前置状态机，initialize 分支不调用 runVersionCheck。
- **证据**：`evidence/D9-12/stdout.log`

## #11【P1】EXP-E01 serviceCatalog 评测「云主机」别名：口语化别名未路由到 ECS

- **现象**：`service_catalog(intent="帮我查一下我账号在华北北京四有哪些云主机")` 返回 MISS（fallback）。
- **断言**：「云主机」意图须命中 ECS。
- **根因**：`tools.mjs:2200` routeMap ECS keywords 缺口语化别名「云主机」。
- **证据**：`evidence/EXP-E01/stdout.log`

## #12【P1】D9-9 tools/call 超时协议语义与取消：capabilities 未声明 cancellation（SPEC-MISMATCH）

- **现象**：initialize 返回 `capabilities={"tools":{}}`，无 cancellation 声明。
- **断言**：capabilities 应声明 tools.cancellation。
- **根因**：`mcp-protocol.mjs` capabilities 仅 `{tools:{}}`，未声明 cancellation，与协议契约漂移。
- **证据**：`evidence/D9-9/stdout.log`

## #13【P2】D8-9 安装 ID 与遥测值脱敏：sanitizeValue 未移除 AK/SK/token 敏感值（SPEC-MISMATCH）

- **现象**：`sanitizeValue("AK=ABC123DEF456GHI")` 返回原值，未脱敏。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值。
- **根因**：`telemetry/telemetry.mjs:190` sanitizeValue 仅去控制字符+截断，未做敏感值脱敏。
- **证据**：`evidence/D8-9/stdout.log`

## #14【P0】D10-4 安全干预-静态规则层：规则库计数已变更（9 deny + 10 warn），用例断言计数滞后（SPEC-MISMATCH）

- **现象**：规则库实载 19 条（9 deny + 10 warn），用例断言仍为（9 deny + 7 warn）。
- **断言**：规则库断言计数应与实载一致（测试基线）。
- **根因**：`cloud-risk-rules.json` 规则数 16→19（新增 warn），用例断言计数滞后（测试基线问题，非产品缺陷）。
- **证据**：`evidence/D10-4/stdout.log`