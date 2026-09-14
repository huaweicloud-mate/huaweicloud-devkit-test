# FINDINGS — 缺陷发现清单（DSH-deepseek-v4-pro-0813）

> **落盘路径**：`results/DSH/2026-09-14-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-14 23:06（北京时间）
> **被测版本**：`huaweicloud-devkit@1.1.4-next.6`（npm @next，gitHead `69ac7279`，hdk checkout 同 commit）
> **本清单是统一提单脚本 file_issue.py 的解析输入**，格式严格遵循 templates/findings.md。

## #1【P0】凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式）

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；而对象路径 `{AK:..., SK:...}`、`access_key=`/`secret_key=` 大写键均正常脱敏。
- **断言**：小写 `ak=`/`sk=` 格式凭证值应被替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `.replace(/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g, ...)` 大小写敏感且未覆盖 `access_key`/`secret_key` 下划线小写与 `ak=`/`sk=` 小写键。
- **影响**：真实 obsutil 配置的小写凭证字段不脱敏，AK/SK 可经 agent 上下文泄漏（红线 I 类）。
- **证据**：`evidence/d4-security/stdout.log`（FAIL 断言：`lowercase ak=/sk= redacted` 为 false）

## #2【P0】凭证 env 打印拦截不完整（HW_ 前缀漏网）

- **现象**：`printenv HW_ACCESS_KEY`、`echo $HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均判 `decision=allow`、`risk=not_huaweicloud`；而 `printenv HUAWEICLOUD_SK`、`env|grep HWC_` 被正确 deny。README 定义的官方凭证环境变量名 `HW_ACCESS_KEY/HW_SECRET_KEY` 不在拦截覆盖内。
- **断言**：`printenv HW_ACCESS_KEY`（及 `echo $HW_ACCESS_KEY`）应返回 `decision=deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:336` env-dump 判定正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_` 前缀；`echo $VAR` 形式同路径未覆盖。
- **影响**：P0 凭证环境变量可被打印进入对话上下文，泄露风险。
- **证据**：`evidence/d4-security/stdout.log`（FAIL 断言 3 条）

## #3【P0】hook 命令替换绕过（$(...) + ANSI-C quoting）

- **现象**：`hcloud $(echo $'E\x43S DeleteServer') --id x` 判 `decision=allow`（`service="$(echo"`、`risk=unknown_read`），shell 展开后等价破坏性删除。
- **断言**：该命令应判 `deny`（命中破坏性删除规则）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:50-53` `conditionMatches()` 用纯正则 `new RegExp(condition.regex,'ims').test()` 做文本匹配，不做 shell 命令替换/ANSI-C quoting 展开，`$(...)` 与 `$'\x43'`(=C) 破坏 `hcloud <service> <op>` 匹配。
- **影响**：P0 安全 hook 可被命令替换规避，破坏性删除绕过审批。
- **证据**：`evidence/d4-security/stdout.log`（FAIL 断言：`command-substitution bypass deny`）

## #4【P0】shell 包裹穿透 hcloud 写操作拦截

- **现象**：`bash -c "hcloud ecs DeleteServers --server-id 1"` 返回 `allow`（仅附 warn `hwc-destructive-delete-operation`）；`sh -c "echo x && hcloud rds CreateInstance"` 返回 `allow`（risk=unknown_read）。
- **断言**：内层含 `hcloud <Svc> Delete*/Create*` 的包裹命令应判 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:345` 正则 `/(^|\s)hcloud(\.exe)?\s+/i` 仅匹配行首/空白后的 `hcloud`，引号包裹、`&&` 链接、`-c` 内层均绕过；`stripExecutable`（同文件 67-77 行）只剥离行首可执行名。
- **影响**：破坏性写操作可借 shell 包裹绕过审批门（P0）。
- **证据**：`evidence/d4-security/stdout.log`（FAIL 断言 2 条）

## #5【P1】hook 畸形输入 fail-open（应 fail-closed）

- **现象**：`evaluateArtifacts([{path:'x.json', content:'{not-valid-json!!!'}]})` 判 `decision=allow`、`findings=[]`，未按 fail-closed 语义拒绝。
- **断言**：无法匹配任何规则的异常/畸形输入应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:103-106` `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，对空匹配输入直接 allow，缺 fail-closed 兜底。
- **影响**：P1 畸形/异常输入缺省放行，与「异常输入默认拒绝」契约漂移。
- **证据**：`evidence/d4-security/stdout.log`（FAIL 断言：`malformed artifact fail-closed (deny)`）

## #6【P0】全局规则 huawei-agent-rules 未随安装注入（11 安装目标）

- **现象**：隔离 HOME 执行 `install --target dsh` 成功后全目录 `find` 无 `huawei-agent-rules.*` 任何产物（0 文件）；npm 包 `package.json` `files` 数组不含 `rules`。
- **断言**：install 后安装目标目录应包含全局 MUST 级规则文件 `huawei-agent-rules.md`。
- **根因**：`package.json` `files` 数组（`[cordis.patch.yml, bin, .agents, plugins/huaweicloud-core, integrations/...]`）未列 `rules`；`plugins/huaweicloud-core/src/setup-cli.mjs` 无任何规则注入逻辑（grep `agent-rules`/`.mdc` 零命中），`rules/huawei-agent-rules.mdc` 沦为孤岛。
- **影响**：全局安全约束（禁直连 CSMS/KMS 等）未交付到任何 agent，安全约束降级。
- **证据**：`evidence/dsh-install/stdout.log`（`found=0` + `package files includes rules/` 为 false）

## #7【P1】JSON-RPC 错误码契约漂移（未返回 -32601）

- **现象**：`dispatch('tools/bad', ...)` 直接抛普通 `Error('Unsupported method: tools/bad')`，无 JSON-RPC 结构化 `-32601` 错误码。
- **断言**：未知方法应返回结构化 JSON-RPC 错误码 `-32601`（Method not found）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:95` 对 unknown method 直接 `throw new Error(...)`，未封装为 `{code,message}` 结构；`plugins/huaweicloud-core/src/mcp-server.mjs:169` 与 `mcp-server-remote.mjs:63` 又统一硬编码 `code: -32603`。
- **影响**：MCP 客户端无法区分「方法不存在」与「内部错误」，协议互操作受影响。
- **证据**：`evidence/d9-protocol/stdout.log`（FAIL 断言：`unknown method yields structured -32601`）

## #8【P2】文档与能力漂移（AGENTS.md 39 vs 实现 40 工具）

- **现象**：`TOOL_DEFINITIONS.length` 实测 40（next.6 新增 `huaweicloud_obs_set_website_config`），但源码仓库 `AGENTS.md:27` 仍写「39 tools in tools.mjs」、`:45` 仍写「39 MCP tool definitions」。
- **断言**：源码仓库文档声明的工具数应与 `TOOL_DEFINITIONS.length`（40）一致。
- **根因**：`hdk/AGENTS.md:27,45` 未随 #347 工具新增同步；`plugins/huaweicloud-core/src/tools.mjs:180` 已 40 项。
- **影响**：文档与能力漂移，误导 agent/开发者对工具全集的认知。
- **证据**：`evidence/supplement/routing-stdout.log`（`N=40 doc39=true`）

## #9【P1】serviceCatalog 中文意图路由大量 miss（关键词英文-only）

- **现象**：中文意图「帮我查华北北京四的云主机」「云数据库MySQL」「创建 2C4G 的 Ubuntu 云服务器」「绑定弹性IP」「部署公网静态网站」「每日备份策略」等 6/8 条 miss，返回 `Run hcloud --help...`；仅 Redis→DCS、Kubernetes→CCE 命中。
- **断言**：中文意图「创建一台 2C4G 的 Ubuntu 云服务器」应路由到 `ECS`（recommendedServices 含 ECS）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776-1907` `serviceCatalog()` 的 `routeMap` 关键词均为英文（ecs/server/vm/instance/...），`String(intent).toLowerCase()` 未做中文意图映射。
- **影响**：中文用户（主要目标群体）意图路由大幅 miss，路由准确率不达标。
- **证据**：`evidence/supplement/routing-stdout.log`（`2/8 hit`）
