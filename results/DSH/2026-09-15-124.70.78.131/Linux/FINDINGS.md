# FINDINGS — 缺陷发现清单（DSH-deepseek-v4-pro-0813）

> **落盘路径**：`results/DSH/2026-09-15-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-15 13:07（北京时间）
> **被测版本**：`huaweicloud-devkit@1.1.4`（npm latest 正式版，gitHead `9b67256e`）
> **说明**：本轮 10 项缺陷中 9 项为已提单缺陷在 v1.1.4 正式版未修复的复现，#3（kms DecryptData）为本轮新确认。

## #1【P0】D2-4 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式）

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；而 `access_key=`/`secret_key=` 大写键与对象路径 `{AK,SK}` 均正常脱敏。
- **断言**：小写 `ak=`/`sk=` 格式凭证值应替换为 `<redacted>`。
- **根因**：`safety-policy.mjs:45` `.replace(/(AK|SK)\s*[:=]\s*(...)/g, ...)` 大小写敏感（无 `i`）且仅覆盖大写 `AK|SK`，未覆盖 obsutilconfig 的小写 `ak=`/`sk=` 键。
- **影响**：真实 obsutil 配置的小写凭证字段不脱敏，AK/SK 可经 agent 上下文泄漏（红线 I 类）。
- **证据**：`evidence/security/stdout.log`（FAIL 断言 `lowercase ak=/sk= redacted`）

## #2【P0】D4-2 凭证 env 打印拦截不完整（HW_ 前缀漏网）

- **现象**：`printenv HW_ACCESS_KEY`、`echo $HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均判 `decision=allow`；而 `printenv HUAWEICLOUD_SK`、`env|grep HWC_` 被正确 deny。
- **断言**：`printenv HW_ACCESS_KEY`（及 `echo $HW_ACCESS_KEY`）应返回 `decision=deny`。
- **根因**：`safety-policy.mjs:336` env-dump 判定正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 README 官方凭证变量名 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 的 `HW_` 前缀。
- **影响**：P0 凭证环境变量可被打印进入对话上下文，泄露风险。
- **证据**：`evidence/security/stdout.log`（FAIL 断言 3 条）

## #3【P0】D4-3 明文 secret API 拦截漏 kms DecryptData

- **现象**：`hcloud kms DecryptData --ciphertext x` 判 `decision=allow`、`risk=unknown_read`；而 `hcloud csms ShowSecretVersion` 被正确 deny。
- **断言**：`hcloud kms DecryptData`（返回明文 secret）应返回 `decision=deny`、`risk=secret`。
- **根因**：`safety-policy.mjs:177`（classifyHcloudArgs）secret 操作正则 `/secret[_-]?string|secret[_-]?binary|showsecretversion|getsecretvalue/i` 与 `safety-policy.mjs:349`（classifyTextCommand）`/ShowSecretVersion|GetSecretValue|secret_string|secret_binary/i` 均未覆盖 KMS `DecryptData`/`DecryptDataKey`。
- **影响**：明文解密 API 可被调用，明文 secret 进入 agent 上下文（红线）。
- **证据**：`evidence/security/stdout.log`（FAIL 断言 `kms DecryptData deny`）

## #4【P0】D4-15 hook 命令替换绕过（$(...) + ANSI-C quoting）

- **现象**：`hcloud $(echo $'E\x43S DeleteServer') --id x` 判 `decision=allow`（`service="$(echo"`），shell 展开后等价破坏性删除。
- **断言**：该命令应判 `deny`（命中破坏性删除规则）。
- **根因**：`risk-rule-engine.mjs:50-53` `conditionMatches()` 用纯正则 `new RegExp(condition.regex,'ims').test()` 做文本匹配，不做 shell 命令替换/ANSI-C quoting 展开，`$(...)` 与 `$'\x43'`(=C) 破坏 `hcloud <service> <op>` 匹配。
- **影响**：P0 安全 hook 可被命令替换规避，破坏性删除绕过审批。
- **证据**：`evidence/security/stdout.log`（FAIL 断言 `command-substitution deny`）

## #5【P0】D4-16 shell 包裹穿透 hcloud 写操作拦截

- **现象**：`bash -c "hcloud ecs DeleteServers --server-id 1"` 返回 `allow`（仅 warn）；`sh -c "echo x && hcloud rds CreateInstance"` 返回 `allow/unknown_read`。
- **断言**：内层含 `hcloud <Svc> Delete*/Create*` 的包裹命令应判 `deny`。
- **根因**：`safety-policy.mjs:345` 正则 `/(^|\s)hcloud(\.exe)?\s+/i.test(text)` 仅匹配行首/空白后的 `hcloud`，引号包裹、`&&` 链接、`-c` 内层均绕过。
- **影响**：破坏性写操作可借 shell 包裹绕过审批门（P0）。
- **证据**：`evidence/security/stdout.log`（FAIL 断言 2 条）

## #6【P0】D4-23 全局规则 huawei-agent-rules 未随安装注入

- **现象**：隔离 HOME 执行 `install --target dsh`（exit=0）后全目录扫描 `huawei-agent-rules.*` 零命中；npm 包 `package.json` `files` 数组不含 `rules`。
- **断言**：install 后安装目标目录应包含全局 MUST 级规则文件 `huawei-agent-rules.md`（或 `.mdc`）。
- **根因**：`package.json:8` `files` 数组（`[cordis.patch.yml, bin, .agents, plugins/huaweicloud-core, integrations/...]`）未列 `rules`；`hdk/rules/huawei-agent-rules.mdc` 沦为孤儿文件，未被打包/注入任何 client。
- **影响**：全局安全约束（禁直连 CSMS/KMS 等）未交付到任何 agent，安全约束降级（P0）。
- **证据**：`evidence/install/stdout.log`（`found=0` + `files includes rules` 为 false）

## #7【P1】D4-17 hook 畸形输入 fail-open（应 fail-closed）

- **现象**：`evaluateArtifacts([{path:'x.json', content:'{not-valid-json!!!'}]` 判 `decision=allow`、`findings=[]`，未按 fail-closed 语义拒绝。
- **断言**：无法匹配任何规则的异常/畸形输入应默认拒绝（fail-closed）。
- **根因**：`risk-rule-engine.mjs:106` `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，对空匹配输入直接 allow，缺 fail-closed 兜底。
- **影响**：畸形/异常输入缺省放行，与「异常输入默认拒绝」契约漂移。
- **证据**：`evidence/security/stdout.log`（FAIL 断言 `malformed artifact fail-closed (deny)`）

## #8【P1】D9-2 JSON-RPC 错误码契约漂移（未返回 -32601）

- **现象**：`dispatch('tools/bad', ...)` 直接抛普通 `Error('Unsupported method: tools/bad')`，无结构化错误码（`err.code` 为 undefined）。
- **断言**：未知方法应返回结构化 JSON-RPC 错误码 `-32601`（Method not found）。
- **根因**：`mcp-protocol.mjs:95` 对 unknown method 直接 `throw new Error(...)` 未封装 `{code,message}`；`mcp-server.mjs:169` 统一硬编码 `code:-32603`。
- **影响**：MCP 客户端无法区分「方法不存在」与「内部错误」，协议互操作受影响。
- **证据**：`evidence/protocol/stdout.log`（FAIL 断言 `unknown method code (-32601)`）

## #9【P1】D10-3 serviceCatalog 中文意图路由大量 miss（关键词英文-only）

- **现象**：「云主机」「云服务器」「云数据库MySQL」「弹性公网IP」「备份策略」「费用」「监控告警」「HTTPS证书」「权限审计」「函数」等中文意图 miss，返回 `Run hcloud --help...`；仅 Redis→DCS、Kubernetes→CCE、代金券→voucher 命中（3/15）。
- **断言**：中文意图「创建一台 2C4G 的 Ubuntu 云服务器」应路由到 ECS（recommendedService 含 ECS）。
- **根因**：`tools.mjs:1776-1907` `serviceCatalog()` 的 `routeMap` 关键词均为英文，`String(intent).toLowerCase()` 未做中文意图映射（仅 voucher/sandbox 有零星中文关键词）。
- **影响**：中文用户（主要目标群体）意图路由大幅 miss，D10-3 路由准确率仅 3/15，远低于 ≥90% 门槛。
- **证据**：`evidence/routing/stdout.log`（`3/15 hit`）

## #10【P2】D8-1 文档与能力漂移（AGENTS.md 39 vs 实现 40 工具）

- **现象**：`TOOL_DEFINITIONS.length` 实测 40（stable 新增 `huaweicloud_obs_set_website_config`），但源码仓库 `AGENTS.md:27` 仍写「39 tools in tools.mjs」、`:45` 仍写「39 MCP tool definitions」。
- **断言**：源码仓库文档声明的工具数应与 `TOOL_DEFINITIONS.length`（40）一致。
- **根因**：`hdk/AGENTS.md:27,45` 未随工具新增同步；`plugins/huaweicloud-core/src/tools.mjs` 已 40 项。
- **影响**：文档与能力漂移，误导 agent/开发者对工具全集的认知。
- **证据**：`evidence/doc/stdout.log`（`N=40 doc39=true`）