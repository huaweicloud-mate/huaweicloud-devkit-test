# FINDINGS — 缺陷发现清单（DSH-deepseek-v4-pro-0813）

> **落盘路径**：`results/DSH/2026-09-19-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-19 05:24（北京时间）
> **被测版本**：`huaweicloud-devkit@1.1.5`（npm latest 正式版，gitHead `e7ed6f666ac5049ab467ff03daedd463da754d8a`）
> **说明**：本轮在 v1.1.5 正式版复测（npm latest 仍为 1.1.5，gitHead `e7ed6f66e`）。以下 11 项为 v1.1.5 仍存的产品缺陷（10 FAIL + 1 SPEC-MISMATCH），**均为历史已提单/已查重问题**（历史单以用例号/语义查重命中后仅复核、不重复开单，关联清单见 `HISTORY_LINKS.md`）。其中 #11 D4-27 为前日 daily 新增纳入用例，缺陷已由同批客户端（Hermes #726）先行提单。

## #1【P0】D2-4 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式）

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；`access_key=`/`secret_key=`/`AK=` 大写键与对象路径均正常脱敏。
- **断言**：小写 `ak=`/`sk=` 格式凭证值应替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `.replace(/(AK|SK)\s*[:=]\s*(...)/g, ...)` 大小写敏感且仅覆盖大写 `AK|SK`，未覆盖 obsutilconfig 的小写 `ak=`/`sk=` 键。
- **影响**：真实 obsutil 配置的小写凭证字段不脱敏，AK/SK 可经 agent 上下文泄漏（红线 I 类）。
- **证据**：`evidence/security/stdout-probe-security.log`（FAIL `lowercase ak=/sk= redacted` => `ak=AK123456 sk=SKsecret`）

## #2【P0】D4-3 明文 secret API 拦截漏 kms DecryptData

- **现象**：`hcloud kms DecryptData --ciphertext x` 判 `decision=allow`、`risk=unknown_read`；`hcloud csms ShowSecretVersion` 正确 deny。
- **断言**：`hcloud kms DecryptData`（返回明文 secret）应判 `decision=deny`、`risk=secret`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:432` secret 正则 `/ShowSecretVersion|GetSecretValue|secret_string|secret_binary/i` 未覆盖 KMS `DecryptData`/`DecryptDataKey`。
- **影响**：明文解密 API 可被调用，明文 secret 进入 agent 上下文（红线）。
- **证据**：`evidence/security/stdout-probe-security.log`（FAIL `kms DecryptData deny`）

## #3【P0】D4-15 hook 命令替换绕过（$(...))

- **现象**：`hcloud $(echo $'E\x43S DeleteServer') --id x` 判 `decision=allow`（shell 展开后等价破坏性删除）；lowercase/mixed-case/url-encoded 均已 deny。
- **断言**：该命令应判 `deny`（命中破坏性删除规则）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:50-53` `conditionMatches()` 用 `new RegExp(condition.regex,'ims').test()` 纯文本匹配，不做 shell 命令替换展开，`$(...)` 破坏 `hcloud <service> <op>` 匹配。
- **影响**：P0 安全 hook 可被命令替换规避，破坏性删除绕过审批。
- **证据**：`evidence/security/stdout-probe-security.log`（FAIL `command-substitution deny`）

## #4【P0】D4-16 shell 包裹穿透未完全根除（bash -c "hcloud ..." 仍 allow）

- **现象**：`bash -c "hcloud ecs DeleteServers --server-id 1"` 仍判 `allow/not_huaweicloud`；`sh -c "echo x && hcloud rds CreateInstance"` 已判 `deny`（v1.1.5 部分修复）。
- **断言**：内层含 `hcloud <Svc> Delete*/Create*` 的包裹命令应判 `deny`。
- **根因**：v1.1.5 在 `classifyHcloudArgs` 内新增 `stripExecutable`/`findHcloudCommandSegments`（修复 `&&` 链接），但 `plugins/huaweicloud-core/src/safety-policy.mjs:428` 入口正则 `/(^|\s)hcloud(\.exe)?\s+/i` 仍不匹配引号包裹的 `bash -c "hcloud ..."`，导致该文本不进入解包，直接落到 `allow/not_huaweicloud`。
- **影响**：破坏性写操作仍可借 `bash -c "..."` 引号包裹绕过审批门（P0）。
- **证据**：`evidence/security/stdout-probe-security.log`（FAIL `bash -c hcloud DeleteServers deny`）

## #5【P1】D4-17 hook 畸形输入 fail-open（应 fail-closed）

- **现象**：`evaluateArtifacts([{path:'x.json', content:'{not-valid-json!!!'}])` 判 `decision=allow`、`findings=[]`，未按 fail-closed 语义拒绝。
- **断言**：无法匹配任何规则的异常/畸形输入应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，对空匹配输入直接 allow，缺 fail-closed 兜底。
- **影响**：畸形/异常输入缺省放行，与「异常输入默认拒绝」契约漂移。
- **证据**：`evidence/security/stdout-probe-security.log`（FAIL `malformed artifact fail-closed (deny)`）

## #6【P0】D4-23 全局规则 huawei-agent-rules 未随安装注入

- **现象**：隔离 HOME 执行 `install --target dsh`（exit=0）后全目录扫描 `huawei-agent-rules.*` 零命中（`found=0`）；npm 包 `package.json` `files` 数组不含 `rules`；源码 `hdk/rules/huawei-agent-rules.mdc` 沦为孤儿文件。
- **断言**：install 后安装目标目录应包含全局 MUST 级规则文件 `huawei-agent-rules.md`（或 `.mdc`）。
- **根因**：`hdk/package.json:8` `files` 数组未列 `rules`，导致规则文件未被打包/注入任何 client。
- **影响**：全局安全约束（禁直连 CSMS/KMS 等）未交付到任何 agent，安全约束降级（P0）。
- **证据**：`evidence/install/stdout-probe-install.log`（`found=0` + `files includes rules`=false + `installed package contains rules/`=false）

## #7【P1】D10-3 serviceCatalog 中文意图路由大量 miss（关键词英文-only）

- **现象**：「云主机」「云服务器」「弹性公网IP」「备份策略」「费用」「监控告警」「HTTPS证书」「权限审计」「函数」等中文意图 miss；仅 Redis→DCS、Kubernetes→CCE、代金券→voucher 命中（3/15，准确率 20%）。
- **断言**：中文意图「创建一台 2C4G 的 Ubuntu 云服务器」应路由到 ECS（recommendedService 含 ECS）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776-1907` `serviceCatalog()` 的 `routeMap` 关键词均为英文，`String(intent).toLowerCase()` 未做中文意图映射。
- **影响**：中文用户（主要目标群体）意图路由大幅 miss，路由准确率 3/15 远低于 ≥90% 门槛。
- **证据**：`evidence/routing/stdout-probe-routing.log`（`routing accuracy 3/15`）

## #8【P1】D4-13 最小权限动态切换失效（run-as-readonly 注入只读 env 仍解析为管理员）

- **现象**：`resolveCredentials()` 返回管理员（ak 前缀 `HPUAN1`），而非只读 test001（ak 前缀 `HPUA3X`）；test001 inline 凭证写 VPC 被 IAM 拒绝（`VPC.0010 PolicyNotAuthorized`，此层正确）。
- **断言**：注入只读 env 后 `resolveCredentials()` 应返回 test001（ak 前缀 `HPUA3X`）。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:152-160`（R9）：`stored.configuredBySession === true` 时无条件 `ak = stored.ak; sk = stored.sk` 覆盖 env 注入；管理员 `credentials.json` 含 `configuredBySession: true`，`run-as-readonly.py` 未清理该 flag。
- **影响**：最小权限切账号路径失效——agent 试图切只读子账号时仍以管理员身份解析凭证。
- **证据**：`evidence/D4-13/stdout-probe.log`（`run-as-readonly 动态切换生效: false` + `写被拒绝: true`）

## #9【P2】D8-1 文档与能力漂移（AGENTS.md 39 vs 实现 40 工具）

- **现象**：`TOOL_DEFINITIONS.length` 实测 40，但源码仓库 `AGENTS.md:27` 写「39 tools in tools.mjs」、`:45` 写「39 MCP tool definitions」。
- **断言**：源码仓库文档声明的工具数应与 `TOOL_DEFINITIONS.length`（40）一致。
- **根因**：`hdk/AGENTS.md:27,45` 未随工具新增同步。
- **影响**：文档与能力漂移，误导 agent/开发者对工具全集的认知。
- **证据**：`evidence/doc/stdout-probe-doc.log`（`N=40 doc(39) vs impl(40) 一致 => FAIL`）

## #10【P1·SPEC-MISMATCH】D9-9 tools/call 超时/取消协议契约漂移

- **现象**：`initialize` 返回 `capabilities = { tools: {} }`，未声明 `notifications.cancellation`；未知方法错误码为 `-32603`（通用兜底），无 `-32000 timeout` 语义。
- **断言**（按用例契约）：① 取消能力按 capabilities 实测——不存在则标 SPEC-MISMATCH；② 超时错误精确 `{code:-32000, message 含 timeout}`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:63-65`（initialize capabilities 仅 `{tools:{}}`，无 `notifications.cancellation`）；`plugins/huaweicloud-core/src/mcp-server.mjs:169`（error 统一 `-32603` 兜底，无 `-32000 timeout` 分支）。
- **影响**：MCP 客户端无法据 capabilities 判定取消能力，超时语义不可机器断言。
- **证据**：`evidence/protocol/stdout-probe-blocked.log`（`cancellation 未声明` + `未知方法 code=-32603 非 -32000`）

## #11【P1】D4-27 redactSecrets/redactOutput 双路径脱敏缺裸 token 关键字

- **现象**：`redactSecrets('token=TokenValueABCDEF123456')` 返回原文；`redactOutput('token=TokenValueABCDEF123456')` 同样残留明文。同输入 `security_token=`/`x-auth-token=`/`password=`/`adminPass=` 均正常替换为 `<redacted>`。
- **断言**：裸 `token=` 关键字后跟的值应替换为 `<redacted>`（与 `security_token`/`x_auth_token`/`password` 等 secret 关键字同语义）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` `redactString` 第二条 replace 的 secret 关键字列表为 `(access[_-]?key|secret[_-]?key|security[_-]?token|x[_-]?auth[_-]?token|authorization|password|passwd|adminPass|credential)`，未包含裸 `token`；`hcloud-cli.mjs:587` `redactOutput` 复用 `redactSecrets`，双路径同步缺口。
- **影响**：`token=` 形式访问令牌可经日志/对话输出泄漏，D4-27「双路径脱敏完整性」设计级 P1 用例实测 FAIL（7 断言 2 FAIL）。
- **证据**：`evidence/D4-27/stdout-probe.log`（`redactSecrets 裸 token= 脱敏 => token=TokenValueABCDEF123456`）
- **状态**：已提单 #726（前日同批 Hermes 客户端先行提单）