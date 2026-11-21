# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-11-22-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：2026-11-22 05:30:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.15（gitHead bf79b643，PR #1166）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段。

> **版本注记**：本轮与昨日（2026-11-21）被测版本无变更（同为 1.1.15 / bf79b643）。1.1.15 仅新增「批量 manifest 审批」能力（`huaweicloud_plan_manifest` / `huaweicloud_run_approved_manifest`），未改动既有函数。本轮全量重跑复核：下列 17 FAIL + 3 SPEC-MISMATCH 与昨日完全一致；真云 E2E（D3-C1 建删归零、D3-C2 OBS 静态站、D3-C3/C6 沙箱、D3-C7 跨区域 EIP、D4-13 最小权限）均真机执行并归零验证通过。

---

## #1【P0】D2-4 凭证脱敏正确性—小写 ak=/sk= 与 JSON 带引号 key 未脱敏

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 与 `redactSecrets('{\"ak\":\"...\",\"sk\":\"...\"}')` 原样明文返回（大写 `AK=/SK=` 与对象键 `accessKeyId/secretAccessKey` 正常脱敏）。
- **断言**：对大小写 `ak=/sk=`、JSON 带引号 key `{\"ak\":...}/{\"sk\":...}`、对象键 `accessKeyId/secretAccessKey` 等所有形态 AK/SK，应一律返回 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` `redactString`/`redactSecrets` 的 `(AK|SK)` 键名正则大小写敏感（无 `/i`），且 `isSecretKeyName` 键名正则不匹配裸 `ak`/`sk` → 小写形态与 JSON 带引号 key 漏脱敏。
- **影响**：凭证脱敏能力存在覆盖缺口，日志/回显中出现小写或 JSON 形态 AK/SK 时明文泄露。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P0】D4-2 凭证 env 打印拦截不完整

- **现象**：`env | grep -i access_key` 判 `decision=allow risk=not_huaweicloud`（应 deny）；`env | grep HW_ACCESS_KEY`（大写）才被拦截。
- **断言**：含 `access_key`/`HW_ACCESS_KEY`/`HW_SECRET_KEY` 等凭证前缀的 env 打印命令应一律判 `deny`（risk=credential）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` env-dump 检测正则未覆盖裸 `access_key` 与 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀（漏判为 `not_huaweicloud`）。
- **影响**：攻击者可通过 `env | grep access_key` 绕过拦截读取环境变量中的凭证。
- **证据**：`evidence/D4-2/stdout.log`

## #3【P0】D4-21 hook_check_artifacts 制品预检漏拦宽泛 IAM 授权

- **现象**：HCL `actions=[\"*\"]` 形态与 `AdministratorFullAccess` 托管策略引用判 `decision=allow`；仅 JSON `\"Action\":\"*\"` 形态被 `hwc-iam-admin-policy` 拦截。
- **断言**：任何赋予宽泛管理员权限（JSON/HCL `Action:*`、`actions=[\"*\"]`、`AdministratorFullAccess` 托管策略）的制品均须判 `deny`。
- **根因**：`safety/rules/cloud-risk-rules.json` `hwc-iam-admin-policy` 规则仅匹配 JSON `Action:*` 关键字形态，未覆盖 HCL `actions=[\"*\"]` 与 `AdministratorFullAccess` 托管策略引用。
- **影响**：部署计划/制品预检可被宽泛 IAM 授权绕过，导致越权策略落地。
- **证据**：`evidence/D4-21/stdout.log`

## #4【P0】D9-12 initialize 握手协议安全基线不达标

- **现象**：① initialize 阶段不调用 runVersionCheck（版本检查已下沉 `huaweicloud_check_cli` 工具/prewarm）；② 未先 initialize 直接 `tools/list` 未拒（返回 tools=true，应 -32600）。
- **断言**：initialize 应完成版本检查（或明确在 capabilities 声明替代端点）；未 initialize 的非法时序 `tools/list` 应返 `-32600`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` initialize 不接 `runVersionCheck`；`dispatch` 无 initialize 前置状态机（非法时序未拦截）。
- **影响**：协议握手安全基线不完整，时序越界未被协议层拒绝。
- **证据**：`evidence/D9-12/stdout.log`

## #5【P1】D3-C4 服务创建类回归—DMS/DEW 两服务无规范路由

- **现象**：22 服务 `list_operations+plan` 冒烟中，DMS、DEW 两服务 `list_operations` 未返回 `command/result`（`plan` 亦无路由）。
- **断言**：22 个服务均应返回规范 `list_operations` 结果且 `plan` 可路由只读命令。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `huaweicloud_list_operations` 对 DMS、DEW 未返回 `command/result` 字段。
- **影响**：DMS/DEW 两个服务的能力路由缺失。
- **证据**：`evidence/D3-C4/stdout.log`、`evidence/realcloud-probe/stdout.txt`（展开级 `EXP-C4-14`(DMS)、`EXP-C4-18`(DEW) 同属此根因）

## #6【P1】D4-4 写操作审批门漏拦截 Change* 写动词

- **现象**：`hcloud ecs ChangeServerOsWithoutCloudInit`、`vpc ChangeVpc`、`rds ChangeInstanceConfiguration`、`evs ChangeVolumeType` 均判 `decision=allow risk=unknown_read`（应 deny/write）。
- **断言**：所有写操作（含 Change* 写动词）均须经审批门拦截（plan 判 deny + 审批 token）。
- **根因**：`safety/policy.json:27` `writeOperationPrefixes` 缺 `Change`/`Modify` 前缀 → Change* 写动词判 `allow(risk=unknown_read)`，审批门漏拦截。
- **影响**：Change* 类变更操作可绕过审批门直接执行。
- **证据**：`evidence/D4-4/stdout.log`

## #7【P1】D4-6 adminPass 回显警告缺失

- **现象**：`hook_check_command` 对含 `--admin_pass` 的命令返 `ok=true decision=allow findings=[]`（应 warn，回显 adminPass）。
- **断言**：含 adminPass/password 明文参数的写命令应触发 `hwc-command-adminpass-exposure` 警告（findings 非空）。
- **根因**：`safety/rules/cloud-risk-rules.json` `hwc-command-adminpass-exposure` stages 仅含 `artifact`/`deploy_plan`，未覆盖 `command` 阶段。
- **影响**：命令行 `--admin_pass` 明文回显无警告，误操作回显风险。
- **证据**：`evidence/D4-6/stdout.log`

## #8【P1】D4-17 hook 模糊输入 fail-open（应 fail-closed）

- **现象**：`&& rm -rf /*`、空串/空白/控制字符垃圾等无法命中规则的输入判 `decision=allow`（未拒绝）。
- **断言**：规则库无命中时默认应 `deny`（fail-closed），不得 fail-open 放行。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 无规则命中默认 `decision=allow`（fail-open）。
- **影响**：绕过型构造输入（畸形/空/控制字符）可穿透审批门。
- **证据**：`evidence/D4-17/stdout.log`

## #9【P1】D4-25 Python hook 写命令遥测分类错误

- **现象**：`hcloud vpc CreateVpc` 遥测事件分类为 `cli:invoke`（应 `cli:write`）。
- **断言**：写命令（Create*/Delete*/Change*）应分类为 `cli:write`，只读命令为 `cli:invoke`。
- **根因**：`hooks/huaweicloud-safety.py` `WRITE_OPERATION_RE` 前置捕获组致写命令被误分类为 `cli:invoke`。
- **影响**：Python 端 hook 遥测无法区分读写命令类别，审计失真。
- **证据**：`evidence/D4-25/stdout.log`

## #10【P1】D3-S7 跨服务交付（Web+RDS）最小参数集缺 db.password + 部署目标路由缺失

- **现象**：RDS `CreateInstance` 返 `[USE_ERROR]Invalid parameter: db.password`；复合意图 `部署目标命中=false`。
- **断言**：RDS 创建应带完整最小参数集（含 db.password），复合意图应命中 RDS + 部署目标。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` RDS 最小参数集缺 `db.password`；routeMap 无 Web 部署目标分解。
- **影响**：跨服务交付编排后半段（RDS 建库+连接串注入）无法完成。
- **证据**：`evidence/D3-S7/stdout.log`

## #11【P1】D10-3 路由准确率 92.9%（缺「云主机」同义词）

- **现象**：15 条意图 `HIT=13 MISS=1 N/A=1`，准确率 92.9%<100%，`云主机` 意图 MISS。
- **断言**：15 条中文意图应 100% 命中对应服务路由。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` routeMap ECS 关键词含「云服务器/服务器/虚拟机」但缺「云主机」口语化别名。
- **影响**：口语化意图路由漏命中。
- **证据**：`evidence/D10-3/stdout.log`（展开级 `EXP-E01` 同属此根因）

## #12【P1】EXP-C4-14 DMS 服务只读规划冒烟失败

- **现象**：`huaweicloud_list_operations(DMS)` 未返回 `command/result`，`plan` 无法路由。
- **断言**：DMS 服务 list_operations + plan 只读命令冒烟应通过。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `huaweicloud_list_operations(DMS)` 未返回 `command/result`。
- **证据**：`evidence/EXP-C4-14/stdout.log`

## #13【P1】EXP-C4-18 DEW 服务只读规划冒烟失败

- **现象**：`huaweicloud_list_operations(DEW)` 未返回 `command/result`，`plan` 无法路由。
- **断言**：DEW 服务 list_operations + plan 只读命令冒烟应通过。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `huaweicloud_list_operations(DEW)` 未返回 `command/result`。
- **证据**：`evidence/EXP-C4-18/stdout.log`

## #14【P1】EXP-E01 ECS 路由缺「云主机」别名

- **现象**：`帮我查一下我账号在华北北京四有哪些云主机` → MISS（期望 ECS，实际返回 help）。
- **断言**：「云主机」意图应路由到 ECS 服务。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` routeMap ECS 关键词缺「云主机」别名。
- **证据**：`evidence/EXP-E01/stdout.log`

## #15【P1】D9-9 tools/call 超时协议语义契约漂移（SPEC-MISMATCH）

- **现象**：initialize `capabilities` 仅 `{tools:{}}`，未声明 `cancellation`。
- **断言**：initialize capabilities 应声明 cancellation（协议支持取消）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` initialize capabilities 未声明 `cancellation`。
- **影响**：协议取消能力未声明，客户端无法按协议发起取消。
- **证据**：`evidence/D9-9/stdout.log`

## #16【P2】D4-26 findings 证据脱敏不完整（JSON 带引号 key 残留）

- **现象**：`redactEvidence` 对 JSON 带引号 key `{\"secret_key\":...,\"adminPass\":...}` 明文残留。
- **断言**：findings.evidence 中任何形态（含 JSON 带引号 key）的 secret_key/adminPass/token 均应脱敏。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` `redactEvidence` 正则不匹配 JSON 带引号 key 形态。
- **影响**：hook 事件/findings 证据中明文字段残留。
- **证据**：`evidence/D4-26/stdout.log`

## #17【P2】D3-S5 场景-复合意图分层路由未拆分

- **现象**：复合意图（存储+托管）`serviceCatalog` 返回 `services=[\"Run hcloud --help to list available services.\"]`，`多路命中=false`。
- **断言**：复合意图应拆分命中多个 service（存储 OBS + 托管静态网站）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog` 单意图匹配，未做复合意图多路分解。
- **影响**：复合意图场景路由失败，多服务协同交付不可用。
- **证据**：`evidence/D3-S5/stdout.log`

## #18【P2】D3-S6 FunctionGraph 最小参数集缺 code

- **现象**：`CreateFunction` 最小参数集返 `[USE_ERROR]Invalid parameter: code`，URN 未返回、触发器未绑定。
- **断言**：FunctionGraph 创建函数应返回 URN 并成功绑定定时触发器。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` FunctionGraph 最小参数集缺 `code`（函数代码）。
- **影响**：FunctionGraph 定时任务场景无法落地。
- **证据**：`evidence/D3-S6/stdout.log`

## #19【P2】D8-9 安装 ID 与遥测值脱敏契约漂移（SPEC-MISMATCH）

- **现象**：`sanitizeValue` 仅去除控制字符+超长截断，`sanitize(AK=...)=AK=ABC123DEF456GHI`、`sanitize(access_key/token=...)` 明文保留。
- **断言**：遥测值 sanitize 应移除 AK/SK/token 敏感值（契约要求）。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs` `sanitizeValue` 无 AK/SK/token 脱敏分支。
- **影响**：遥测上报含敏感值风险。
- **证据**：`evidence/D8-9/stdout.log`

## #20【非产品缺陷】D10-4 用例断言计数滞后（改用例）

- **现象**：规则库实为 19 条（9 deny + 10 warn），用例断言「16 条(9 deny + 7 warn)」判定 FAIL。
- **说明**：实现侧规则库正常增长（新增 warn 规则），用例预期计数未同步，属测试侧用例需更新（改用例），不属产品缺陷。
- **证据**：`evidence/D10-4/stdout.log`