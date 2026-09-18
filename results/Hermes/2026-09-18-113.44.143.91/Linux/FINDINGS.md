# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-09-18-113.44.143.91/Linux/FINDINGS.md`
> **生成时间**：2026-09-18 05:14（北京时间）
> **被测版本**：`v1.1.5`（npm latest 正式版，gitHead `e7ed6f66`，release PR `#696`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格遵循。
> **结论**：设计级 11 项产品缺陷（5 P0 + 5 P1 + 1 P2）+ 2 项 SPEC-MISMATCH；展开级 11 条 FAIL 全部为同一根因（D10-3 中文意图路由）叠加。缺陷经 `file_issue.py` 历史查重后统一处置（历史问题不重复开单）。

---

## #1【P0】D2-11 STS 临时凭证冲突态绕过 R3 拒绝落盘

- **现象**：`huaweicloud_auth_switch action=persist` 携带 `securityToken`（STS 临时凭证），且 S1 已存不同账号时，实测返回 `status=needs_confirmation, scope=undefined`（而非 R3 的 `status=error, scope=rejected`）。
- **断言**：带 `securityToken` 的 STS 临时凭证 `persist` 应返回 `{status:error, scope:rejected}`（token 永不落盘），无论 S1 是否冲突。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1214-1231` —— persist 流程先判 S1 冲突（`prev.ak && prev.ak !== ak`）命中即返回 `needs_confirmation`；R3 的 STS 拒绝逻辑只在无冲突分支的 `persistCredentials` 可达，冲突态绕过 R3。
- **影响**：STS 短期凭证在账号切换冲突场景可进入落盘确认流程，经确认后落盘，违背「临时凭证永不落盘」红线。
- **证据**：`evidence/D2-11/stdout.log`

## #2【P0】D2-4 redactSecrets 漏小写 ak=/sk=（obsutilconfig 格式）

- **现象**：`redactSecrets('ak=AKIDTEST... sk=SKTEST...')` 与 JSON `{ak,sk}` 小写键形态均未脱敏，仅大写 `AK`/`SK` 与 `adminPass=`/`password=` 正确 `<redacted>`。
- **断言**：`ak=`/`sk=`（小写，obsutilconfig 格式）的明文凭证应同样脱敏为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-45` —— `redactString` 密钥正则仅覆盖大写 `(AK|SK)`，密钥名列表未含裸 `ak`/`sk`。
- **影响**：obsutil 配置格式的明文凭证不经脱敏进入 agent 上下文。
- **证据**：`evidence/D2-4/stdout.log`

## #3【P0】D4-2 凭证 env 打印拦截未覆盖 HW_ 前缀

- **现象**：`env | grep HW_ACCESS_KEY` / `env | grep HW_SECRET_KEY` 实测 `allow`（应 `deny`）；对照组 `printenv HW_ACCESS_KEY`、`env | grep HUAWEICLOUD_ACCESS_KEY` 正确 `deny`。
- **断言**：`env | grep HW_ACCESS_KEY` 应返回 `deny`（发现华为云凭证 env 并拦截）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:399` —— env-dump 关键字正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 缺 `HW_` 前缀；`env | grep HW_*` 管道打印形态无法命中（418-419 行的 printenv 直接形态已覆盖 HW_）。
- **影响**：攻击者可借 `env | grep HW_ACCESS_KEY` 提取华为云凭证明文 AK/SK，凭证红线（I 类）仍存缺口。
- **证据**：`evidence/D4-2/stdout.log`

## #4【P0】D4-16 env-dump 规则被 shell 包裹穿透

- **现象**：`sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"`、`bash -c "env | grep ..."` 实测 `allow`（应 `deny`）；对照组裸命令正确 `deny`。
- **断言**：shell 包裹内层命令应被解开并识别 env-dump，返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398` —— env-dump 检测 `(^|\s)(env|printenv...)` 依赖词边界，`sh -c "..."` 使内层 `env` 前为引号而非词边界；`stripExecutable` 解包未回溯到 env-dump 文本规则。
- **影响**：shell 包裹仍可绕过 env-dump 预检，凭证提取可穿透。
- **证据**：`evidence/D4-16/stdout.log`

## #5【P0】D4-23 全局规则 huawei-agent-rules.md 未注入

- **现象**：源码仓 `plugins/` `bin/` `integrations/` `scripts/` 全量 grep `agent-rules`/`huawei-agent-rules` 零命中（仅 `docs/audit-report-2026-08-20.md` 与 `.git/index` 出现，非安装产出）。
- **断言**：`install` 应产出并注入 `huawei-agent-rules.md`（11 个安装目标均可执行其约束，无孤儿文件）。
- **根因**：setup/install 流程未包含 `huawei-agent-rules.md` 的写盘/注入步骤（源码仓安装流程路径零命中）。
- **影响**：设计承诺的「全局规则约束」对 agent 客户端不生效，安全约束整层缺失。
- **证据**：`evidence/D4-23/stdout.log`

## #6【P1】D4-8 Node/Python 钩子策略不一致

- **现象**：同一输入 `hcloud configure show`、`hcloud ECS DeleteServers --id i`，Node hook 返回 `deny`，Python hook 返回空（放行）；只读 `ListServers` 两侧一致（均 allow）。
- **断言**：Node 与 Python 两个 hook 对同一高危命令应判定一致（均 `deny`）。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:170-188` —— Python `evaluate()` 仅做 5 类窄检查，其写操作与 `configure show` 检测未覆盖 Node 侧 `classifyTextCommand` 能拦的 `hcloud configure show` / `hcloud ECS DeleteServers`。
- **影响**：使用 Python hook 的客户端在写命令与配置查看场景无对等拦截，安全策略按客户端漂移。
- **证据**：`evidence/D4-8/stdout.log`

## #7【P1】D4-17 hook 模糊 fail-open——异常/畸形输入默认放行

- **现象**：`hook_check_command` 对空命令、纯空白、畸形 JSON payload 均返回 `allow`（未拒绝、未崩溃）。
- **断言**：异常/无法解析的输入应默认 `deny`（fail-closed），而非 `allow`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:105-107` —— `evaluate()` 汇总 `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，无规则命中时默认 `allow`。
- **影响**：无法解析/规则未命中的制品与命令在预检阶段被放行（fail-open）。
- **证据**：`evidence/D4-17/stdout.log`

## #8【P1】D4-27 redactSecrets/redactOutput 双路径漏小写 ak=/sk=（新用例）

- **现象**：混合文本 `ak=AKID... sk=SKsecret... password=xxx adminPass=xxx`，`redactSecrets` 与 `redactOutput` 两条路径均仅脱敏 `password=`/`adminPass=`，`ak=`/`sk=` 明文残留（两路径均泄露）。
- **断言**：两路径输出中 AK/SK/token/password/adminPass 均被替换为 `<redacted>`，无明文残留。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-45`（`redactString` 未覆盖小写 `ak`/`sk`）+ `plugins/huaweicloud-core/src/hcloud-cli.mjs:587-596`（`redactOutput` 直接转发 `redactSecrets`，未补充小写键）。
- **影响**：obsutil 配置格式明文凭证在 run_readonly/hook 两条输出路径均不经脱敏进入 agent 上下文（根因同 D2-4，本用例新增验证双输出路径一致性）。
- **证据**：`evidence/D4-27/stdout.log`

## #9【P1】D10-3 serviceCatalog 中文意图路由缺失（评测集 21.4% 准确率）

- **现象**：`eval/harness/run-eval.mjs` 对 15 条评测集跑出确定性路由结论：HIT=3 MISS=11 N/A=1，准确率 21.4%；EXP-E06(DCS)/E09(CCE)/E15(代金券) 命中，其余中文意图全部 `Run hcloud --help to list available services.` 回退。
- **断言**：`serviceCatalog` 中/英文意图均命中对应服务；评测级路由准确率 ≥90%。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1778-1886` —— `routeMap` 23 条路由仅 sandbox、voucher 含 CJK 关键字，其余仅英文；中文意图无法命中 → 回退。展开级 11 条 EXP-E* FAIL 均为同一根因叠加。
- **影响**：中文用户意图在服务发现/路由环节大面积未命中，路由准确率 21.4% << 90%。
- **证据**：`evidence/D10-3/stdout.log` + `eval/results/eval-run-20260917210755.csv`

## #10【P1】D9-2 JSON-RPC 错误码：invalid params 返回无 error 对象

- **现象**：`tools/list` 带 string 参数（应 object）实测返回无 error 对象（应 `-32602`）；unknown method 正确返回 `-32601`。
- **断言**：非法参数（invalid params）应返回 `{code:-32602}` 标准 JSON-RPC error 对象。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:46-77` —— `dispatch()` 直接访问 `params.clientInfo` 未校验 `params` 类型，非法参数抛错未赋标准 `-32602`。
- **影响**：客户端无法依标准错误码区分「参数错误」与「工具不存在」，协议互操作性受损。
- **证据**：`evidence/D9-2/stdout.log` + `eval/results/protocol-probe-20260917210809.json`

## #11【P2】D8-1 文档与实现工具数漂移（39→40）

- **现象**：实现 `tools.mjs` TOOL_DEFINITIONS 实测 40 个 MCP 工具（含 `huaweicloud_obs_set_website_config`），但 AGENTS.md 仍写「39 tools」。
- **断言**：文档宣称工具数与实现一致（应为 40）。
- **根因**：源仓 `AGENTS.md:27,45` 两处「39 tools / 39 MCP tool definitions」未随 v1.1.5 同步更新。
- **影响**：文档与能力漂移，误导用户对工具集的认知（低危）。
- **证据**：`evidence/D8-1/stdout.log`

## #12【SPEC-MISMATCH】D9-9 capabilities.cancellation 未声明（取消能力契约漂移）

- **现象**：`initialize.result.capabilities.notifications` 缺失，未声明 `cancellation`；实测超时返回 `-32000`/重建连接正常，但取消能力未在 capabilities 协商。
- **断言**：`initialize.result.capabilities.notifications.cancellation` 应声明存在（或明确不支持）；当前缺失 → 契约漂移标注。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:63` —— initialize 返回的 `capabilities` 仅含 `{tools:{}}`，未声明 `notifications.cancellation`。
- **影响**：支持取消的客户端无法通过 capabilities 探测启用取消，`tools/call` 超时取消语义不可协商。
- **证据**：`evidence/D9-9/stdout.log` + `eval/results/protocol-probe-20260917210809.json`

## #13【SPEC-MISMATCH】D4-24 确认令牌过期/重复的精确 JSON 契约未实现（新发现）

- **现象**：①过期提交期望 `{status:'rejected', code:'CONFIRM_TOKEN_EXPIRED'}`，实测 `consumeApprovalToken` 过期仅返回 null，`runApprovedCommand` 抛通用 Error 串「Invalid or expired approval token」；②同 token 重复期望 `{status:'ok', outcome:'already_processed'}`，实测第二次消费返回 null，无 `already_processed` 字段。源码 `grep CONFIRM_TOKEN_EXPIRED/already_processed` 零命中。
- **断言**：过期提交应返回精确 `{status:'rejected', code:'CONFIRM_TOKEN_EXPIRED'}`；同 token 重复第二次应返回 `{status:'ok', outcome:'already_processed'}`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1748-1750`（`runApprovedCommand` 过期/重复均抛通用 Error 串）+ `tools.mjs:1247`（`auth_confirm` 抛「confirmToken not found or expired」）+ `hcloud-cli.mjs:14`（`APPROVAL_TTL_MS=5*60_000`，设计称 60s），均未实现 D4-24 精确 JSON 字段契约。
- **影响**：客户端无法机器断言 CONFIRM_TOKEN_EXPIRED / already_processed 两态，审批流健壮性契约漂移。
- **证据**：`evidence/D4-24/stdout.log`