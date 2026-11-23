# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4.1-flash-1017）

> **落盘路径**：`results/CodeArtsAgent/2026-11-24-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：`2026-11-24 05:55:00`（北京时间）
> **SUT**：huaweicloud-devkit 1.1.15（源码 bf79b643）
> **来源**：每日测试 146 条（PASS 118 / FAIL 19 / BLOCKED 8 / SPEC-MISMATCH 1）

## #1【P0】D1-39 Windows 升级检测链 npm dist-tags 解析失败

- **现象**：Windows 下 `check_update` 返回 `check_failed`；`npm view huaweicloud-devkit dist-tags --json` 实际输出为数组 `[{"latest":"1.1.15","next":"1.1.15-next.2"}]`，`parseDistTagsOutput` 返回 null，升级检测链静默失败。
- **断言**：Windows 下 `parseDistTagsOutput` 对 npm 数组输出应返回 `{latest:'1.1.15', next:'1.1.15-next.2'}`，`check_update` 不得返回 `check_failed`。
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs:87` — `if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;` 把 npm 的数组输出判为无效；未取数组首元素。
- **影响**：Windows 客户端升级提醒/自动升级链失效。
- **证据**：`evidence/D1-39/stdout.log`

## #2【P1】D2-1 auth init 三端配置文件未落盘

- **现象**：隔离 HOME 下调用 `huaweicloud_auth_init` 返回 `{"status":"ok","message":"Runtime credentials set for this MCP session."}`，但 S1/KooCLI/OBS 三端配置均未创建（s1=false/koo=false/obs=false）。
- **断言**：`auth_init` 成功返回后，三端配置文件必须落位；任一端缺失即缺陷。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1501` — `auth_init` 仅设置进程内 runtime credentials 并返回 ok，未调用 S1/KooCLI/OBS 落盘流程。
- **影响**：重启会话后凭证丢失。
- **证据**：`evidence/D2-1/stdout.log`

## #3【P1】D2-12 auth sync 在 runtime 凭证下错误码语义不符 R10

- **现象**：`auth_switch` 设 runtime 凭证后 `auth_sync` 返回 `HDKIT_CRED_MISSING`，而非 R10 约定的自动同步抑制；S1 未落盘。
- **断言**：runtime 凭证存在时 `auth_sync` 必须返回 `ok:false` 且 code=`HDKIT_SYNC_SKIPPED_RUNTIME`。
- **根因**：`plugins/huaweicloud-core/src/auth/service.mjs:201-210` — `syncAuth` 先读全局 S1，未命中即返回 `HDKIT_CRED_MISSING`；`hasRuntimeCredentials()` 的 R10 分支在其后。
- **影响**：用户被误导为未登录。
- **证据**：`evidence/D2-12/stdout.log`

## #4【P0】D4-2 凭证环境变量打印未被拦截

- **现象**：`huaweicloud_hook_check_command({"command":"set HW_SECRET_KEY"})` 返回 `decision=allow`、`findings=[]`。
- **断言**：`set HW_SECRET_KEY`、`echo $HW_SECRET_KEY` 等凭证环境变量输出必须 `decision=deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 缺该形式规则；`risk-rule-engine.mjs:143` 无命中即 allow。
- **影响**：凭证环境变量可被输出泄漏。
- **证据**：`evidence/D4-2/stdout.log`

## #5【P0】D4-3 KMS 解密明文密钥未被拦截

- **现象**：`hcloud KMS DecryptData --cipher_text=abc` 返回 allow；CSMS `ShowSecretVersion` 返回 deny。
- **断言**：KMS `DecryptData` 与 CSMS `ShowSecretVersion` 均必须 deny。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 仅覆盖 CSMS Secret 读取，缺 KMS Decrypt 规则。
- **影响**：可绕过策略获取密钥明文。
- **证据**：`evidence/D4-3/stdout.log`

## #6【P1】D4-6 adminPass 驼峰字段未被脱敏

- **现象**：`redactSecrets('create ECS adminPass=MySecret123!')` 输出仍含明文（脱敏=false）。
- **断言**：`adminPass=xxx`（驼峰）与 `admin_pass=xxx` 均须替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` — 正则 `admin[_-]?pass` 不匹配驼峰 `adminPass`。
- **影响**：ECS 创建密码明文回显。
- **证据**：`evidence/D4-6/stdout.log`

## #7【P0】D4-9 公网安全组入站规则未被预检拦截

- **现象**：`hcloud VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0 --direction=ingress` 返回 allow。
- **断言**：开放 `0.0.0.0/0` 入站的安全组规则必须 deny/warn。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 缺公网入站规则。
- **影响**：管理端口可被暴露公网。
- **证据**：`evidence/D4-9/stdout.log`

## #8【P0】D4-15 引号拆分绕过风险分类

- **现象**：`hcloud ECS "Delete""Servers" --server_id=x` 返回 allow；`DELETESERVERS`/`%20` 形式可 warn。
- **断言**：去引号拼接后的逻辑参数 `DeleteServers` 必须识别为破坏性写操作。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:397` — `splitSimpleCommand` 把 `"Delete""Servers"` 切成两个 token，未拼回同一参数。
- **影响**：可绕过删除类命令拦截。
- **证据**：`evidence/D4-15/stdout.log`

## #9【P0】D4-16 命令包裹穿透（powershell/KMS 组合未拦截）

- **现象**：`cmd /c`、`sh -c` 包裹的 DeleteServers 已 warn；`powershell -Command "hcloud KMS DecryptData ..."` 返回 allow。
- **断言**：bash/sh/cmd/powershell 包裹的内层高危命令必须非 allow。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:100` unwrap 后命中规则集缺 KMS 规则（同 #5），最终 allow。
- **影响**：包裹命令穿透安全预检。
- **证据**：`evidence/D4-16/stdout.log`

## #10【P1】D4-17 畸形输入未 fail-closed

- **现象**：`hcloud\0ECS` 返回 allow，`12345` 返回 error（未归一 deny）。
- **断言**：空/空白/含 NUL/非字符串/超长输入必须统一 deny。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:524` — `classifyTextCommand` 对 NUL 截断后按 `hcloud` 兜底 allow，非字符串抛异常未 fail-closed。
- **影响**：异常输入下策略失效。
- **证据**：`evidence/D4-17/stdout.log`

## #11【P0】D4-18 写操作被直接拒绝而非「需确认」

- **现象**：`plan_cli_command` 规划 `hcloud VPC DeleteVpc --vpc_id=abc` 返回 `classification.decision=deny`、`safeToRun=false`（同时给出 approvalToken）。
- **断言**：写操作应返回「需用户显式确认」，`classification.decision` 不得为 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:284` — 写操作一律 `decision='deny'`、reason 为 "blocked until ... explicit user approval"，把待确认误表达为拒绝。
- **影响**：破坏审批交互契约（P0）。
- **证据**：`evidence/D4-18/stdout.log`

## #12【P0】D4-19 确认流程中无效/过期审批 token 未被拦截

- **现象**：confirm 流程携带无效 token 仍进入预检并返回 hook warn，未抛 Invalid/expired approval token。
- **断言**：无效/过期 approvalToken 必须被拒绝并返回明确错误，不得继续执行预检。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:284` 与 preflight 审批校验未在 token 失败时短路。
- **影响**：审批 token 校验可被绕过/重放。
- **证据**：`evidence/D4-19/stdout.log`

## #13【P2】D4-25 hook 事件 capability 值粗化为 cli

- **现象**：事件 key 正确为 `cli:*`，但 `capability` 统一为 `cli`，非 `cli:read`/`cli:write`。
- **断言**：`capability` 应为 `cli:read`/`cli:write`/`cli:invoke`。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:186` — `if (key.startsWith('cli:')) return 'cli';`。
- **影响**：遥测无法区分读写，审计粒度丢失。
- **证据**：`evidence/D4-25/stdout.log`

## #14【P2】D4-26 findings.evidence 含明文凭证

- **现象**：hook findings 的 evidence 出现明文 AK/SK/token/password（同段也有 `<redacted>`）。
- **断言**：findings.evidence 中所有凭证必须替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` — 脱敏正则不覆盖驼峰字段（adminPass/accessKey/secretKey）。
- **影响**：缺陷报告/遥测泄漏凭证。
- **证据**：`evidence/D4-26/stdout.log`

## #15【P1】D4-27 双路径（redactSecrets/redactOutput）脱敏均失败

- **现象**：`redactSecrets` 与 `redactOutput` 均未替换明文凭证（脱敏=false）。
- **断言**：两路径都必须把明文凭证替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` 正则缺驼峰；`hcloud-cli.mjs:816` `redactOutput` 复用同策略。
- **影响**：CLI 输出与策略层双路径泄漏。
- **证据**：`evidence/D4-27/stdout.log`

## #16【P2】D8-9 sanitizeValue 对对象输出 [object Object]

- **现象**：`sanitizeValue({...})` 返回 `[object Object]`，对象内容丢失。
- **断言**：`sanitizeValue` 对对象/数组应 JSON 序列化后脱敏。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190-192` — 非字符串一律 `String(value)`。
- **影响**：遥测丢弃结构化数据。
- **证据**：`evidence/D8-9/stdout.log`

## #17【P1】D9-4 协议生命周期未强制（initialize 前可 tools/list）

- **现象**：未 initialize 直接 `tools/list` 返回正常结果，未返回 -32600。
- **断言**：未初始化前调用 `tools/list`/`tools/call` 必须返回 -32600。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:190-204` — `handleMessage` 直接 dispatch，无 initialized 状态校验。
- **影响**：客户端可跳过握手。
- **证据**：`evidence/D9-4/stdout.log`

## #18【P0】D9-12 initialize 握手安全基线（非法时序未被拒）

- **现象**：initialize 返回正常，但随后非法时序 `tools/list` 返回 result，`error.code=undefined`。
- **断言**：非法时序必须返回含 code 的错误对象。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:190` 缺会话状态机；`mcp-protocol.mjs:70` tools/list 无前置状态断言。
- **影响**：P0 协议安全基线失守。
- **证据**：`evidence/D9-12/stdout.log`

## #19【P1】EXP-E01 中文「云主机/地域」意图未路由到 ECS

- **现象**：评测集 EXP-E01「帮我查一下我账号在华北北京四有哪些云主机」返回 `recommendedServices=["Run hcloud --help to list available services."]`（MISS），未命中 ECS；其余 13/14 命中。
- **断言**：该意图 `recommendedServices` 必须包含 `ECS`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2574` — `serviceCatalog(intent)` 关键词表未覆盖「云主机/华北北京四」组合，落入兜底 help。
- **影响**：中文用户查询引导到 help，路由准确率 92.9%。
- **证据**：`evidence/EXP-E01/stdout.log`、`evidence/D10-3/stdout.log`

## #20【P0】D10-4 风险规则库数量与设计契约漂移（SPEC-MISMATCH）

- **现象**：规则库实际 19 条（deny=9/warn=10），用例契约期望 16 条（9+7）；分类行为本身正确。
- **断言**：规则库应为 9 deny + 7 warn（共 16 条）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 规则新增至 19 条，未同步用例契约。
- **影响**：契约漂移，需裁决。
- **证据**：`evidence/D10-4/stdout.log`

## #21【非产品缺陷】D3-C2 OBS 公共访问策略环境阻塞

- **现象**：建桶/上传/签名读/删桶归零均成功（create=200 put=200 sigGET=200 cleaned=true），账号级 BlockPublicAccess 使匿名 GET 403。
- **说明**：账号策略限制，非产品缺陷。

## #22【非产品缺陷】D3-C3/D3-C6/D3-S3 沙箱会话缺失

- **现象**：`sandbox_check_user ok=false`、`sandbox_credentials ok=true`，缺 DevStation workspace 会话/配额。
- **说明**：外部沙箱依赖缺失，非产品缺陷。

## #23【非产品缺陷】D3-S4 领券接口 AK/SK 无效

- **现象**：`voucher_status` 可读，`voucher_claim` 返回 `HDKIT_CRED_INVALID`。
- **说明**：服务端凭证校验阻塞，非产品缺陷。

## #24【非产品缺陷】D3-S7 RDS 创建 SG 参数被拒

- **现象**：两次真机尝试 RDS CreateInstance 均 DBS.200050；已清理 VPC/子网/SG 归零。
- **说明**：RDS 接口参数/权限阻塞，非产品缺陷。

## #25【非产品缺陷】D4-11 提示注入需真实 Agent 会话

- **现象**：search_docs 可检索且含防护提示，但 Agent 行为需真实 LLM 会话，无 dsh/CDP 通道。
- **说明**：评测通道缺失，非产品缺陷。

## #26【非产品缺陷】D4-14 CTS 审计未启用

- **现象**：`hcloud CTS ListTraces rc=0 traces=0`。
- **说明**：账号 CTS 未启用，非产品缺陷。
