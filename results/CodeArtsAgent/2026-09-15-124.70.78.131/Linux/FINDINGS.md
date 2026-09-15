# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **落盘路径**：`results/CodeArtsAgent/2026-09-15-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-15 18:15:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。
> **被测对象**：huaweicloud-devkit npm latest v1.1.4（gitHead 9b67256）。本轮所有缺陷均已在上一轮提单/复核（#673/#685），此处为 2026-09-15 二次复测复核记录。

---

## #1【P0】D4-5 framework 集成安全策略版本漂移 — Apply* 写操作被误判为只读放行

- **现象**：`huaweicloud_plan_cli_command args=["EIP","ApplyEip","--eip_id","test"]` 返回 `{decision:allow, risk:unknown_read, safeToRun:true}`；对照 `ECS DeleteServers`/`OBS DeleteBucket` 均正确返回 `deny/write`。
- **断言**：`EIP ApplyEip` 属写操作，应返回 `decision=deny, risk=write`，而非 `allow/unknown_read`。
- **根因**：CodeArts 框架运行时加载的 `~/.codeartsdoer/huaweicloud-plugins/safety/policy.json` 的 `writeOperationPrefixes` 仅 32 项、缺 `Apply`；而源码 `plugins/huaweicloud-core/safety/policy.json:39` 与 npm 1.1.4 包已含 `Apply`（33 项，#644 已落地源码）。框架运行时策略版本滞后于源码修复，`ApplyEip` 等 Apply* 写命令命中不到写前缀 → `unknown_read` 放行。
- **影响**：Apply 系列云写操作（EIP ApplyEip 等）可绕过审批被误判只读放行，P0 写操作审批门失效。
- **证据**：`evidence/D4-5/stdout.log`
- **状态**：复现（历史 #685）

## #2【P0】D4-2 凭证 env 打印拦截不完整

- **现象**：`hook_check_command "printenv HW_ACCESS_KEY"` 返回 `{ok:true, decision:allow, findings:[]}`，未拦截。
- **断言**：`printenv HW_ACCESS_KEY` 应返回 `deny`（env-dump 规则拦截凭证环境变量打印）。
- **根因**：`~/.codeartsdoer/huaweicloud-plugins/safety/rules/cloud-risk-rules.json:39` 的 env-dump 规则第二条件正则 `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 未覆盖 `HW_` 前缀（真实凭证 env 为 `HW_ACCESS_KEY`/`HW_SECRET_KEY`/`HW_SECURITY_TOKEN`），导致 `printenv HW_*` 漏网。
- **影响**：凭证环境变量可被打印进入 agent 上下文，凭证泄漏风险。
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：复现（历史 #673）

## #3【P0】D4-15 hook 命令替换 + ANSI-C 编码绕过

- **现象**：`hook_check_command` 对 ANSI-C 编码 `$'E\x43S DeleteServers'`（`E\x43S`=ECS）返回 `{ok:true, decision:allow, findings:[]}`，绕过成功。
- **断言**：大小写/编码/拼接变体均不得绕过写操作风险规则（应 `deny`/`warn`）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 对命令文本做纯正则文本匹配，未解析 `/bin/sh` 的 ANSI-C 引号（`$'...'`）与命令替换，编码后的 `DeleteServers` 无法被破坏性操作前缀匹配识别。
- **影响**：恶意命令可经 ANSI-C 编码绕过安全 hook，破坏性写操作漏检。
- **证据**：`evidence/D4-15/stdout.log`
- **状态**：复现（历史 #673）

## #4【P0】D4-23 全局规则 huawei-agent-rules.mdc 未注入（孤儿文件）

- **现象**：`rules/huawei-agent-rules.mdc`（3840B）存在于源码，但 `grep -r "huawei-agent-rules"` 全仓（除 rules/ 自身）0 处代码引用，无任何 install 目标注入该规则。
- **断言**：11 个安装目标均应注入全局规则且约束可执行，无孤儿文件。
- **根因**：`rules/huawei-agent-rules.mdc` 无对应的安装/加载代码引用（安装脚本未在任一 agent 目标写入/引入该文件），规则文件成为孤儿，约束不生效。
- **影响**：全局安全约束（禁直连 csms/kms、最小权限、禁创建 IAM 用户等 MUST 规则）对 agent 不生效。
- **证据**：`evidence/D4-23/stdout.log`
- **状态**：复现（历史 #673）

## #5【P0】D8-7 meta 技能指引引用未暴露工具（断链）

- **现象**：`retrieve_skill "huaweicloud-core"` 返回的「会话启动」节指引调用 `huaweicloud_check_update` / `huaweicloud_upgrade`，但框架实际仅暴露 37 个工具（tool_search 确认无 check_update/upgrade）。
- **断言**：7 个 meta/通用技能指引均可机械执行，无断链、无引用未暴露工具的幻觉步骤。
- **根因**：`huaweicloud-core` SKILL.md「会话启动」节引用 `tools.mjs` 定义的 `huaweicloud_check_update`/`huaweicloud_upgrade`，但框架层未暴露这两工具（与 D1-26 同源），指引与实际能力断链。
- **影响**：agent 按技能指引调用不存在的工具，会话启动流程无法机械执行。
- **证据**：`evidence/D8-7/stdout.log`
- **状态**：复现（历史 #673）

## #6【P1】D1-26 升级提醒工具注册与协议暴露漂移（40 vs 37）

- **现象**：`tools.mjs` 定义 40 个 `huaweicloud_*` 工具（含 `huaweicloud_check_update`、`huaweicloud_upgrade`、`huaweicloud_obs_set_website_config`），但框架运行时（tool_search）仅暴露 37 个，缺上述 3 个。
- **断言**：`check_update`/`upgrade` 均注册且可从 MCP 客户端可达。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` 的 TOOL_DEFINITIONS（40 项）与框架运行时暴露集（37 项）不一致，3 个工具未在框架层注册暴露。
- **影响**：升级提醒/升级/静态网站配置 3 项能力在 MCP 层不可达。
- **证据**：`evidence/D1-26/stdout.log`
- **状态**：复现（历史 #673）

## #7【P1】D4-6 adminPass 明文回显无警告

- **现象**：`hook_check_command "hcloud ECS CreateServers --adminPass mypassword123"` 返回 `{ok:true, decision:allow, findings:[]}`，无任何明文密码告警。
- **断言**：含 `adminPass=xxx` 的命令应返回 `deny`/`warn`（明文密码回显警告，或脱敏为 `<redacted>`）。
- **根因**：`~/.codeartsdoer/huaweicloud-plugins/safety/rules/cloud-risk-rules.json` 无 adminPass/明文密码类风险规则（grep adminPass|password|明文 均无），明文密码参数不受管控。
- **影响**：云资源创建命令中的明文密码可进入 agent 上下文，存在凭据泄漏风险。
- **证据**：`evidence/D4-6/stdout.log`
- **状态**：复现（历史 #673）

## #8【P1】D4-17 hook 畸形输入 fail-open

- **现象**：`hook_check_command ""`（空串）返回 `{ok:true, decision:allow, findings:[]}`，畸形输入被放行（fail-open）。
- **断言**：畸形/空/异常输入应默认拒绝（fail-closed，返回 `deny`）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` 判定 `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，无 finding 即 `allow`，缺少无匹配时的 fail-closed 兜底。
- **影响**：畸形/噪声输入绕过审批门，fail-open 放行。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：复现（历史 #673）

## #9【P1】D5-3/D9-1/EXP-D5-3-3 工具全量枚举漂移（SPEC-MISMATCH，与 D1-26 同源）

- **现象**：`tools/list` / 工具枚举实际返回 37 个工具，`tools.mjs` TOOL_DEFINITIONS 注册源为 40（缺 `check_update`/`upgrade`/`obs_set_website_config`）。
- **断言**：40 个工具全量可达（=tools.mjs 注册源数量），schema 完整。
- **根因**：与 #6（D1-26）同源，`plugins/huaweicloud-core/src/tools.mjs` 工具定义与框架运行时暴露集 40 vs 37 漂移。
- **影响**：工具枚举契约漂移，集成客户端无法发现全量能力。
- **证据**：`evidence/D5-3/stdout.log`、`evidence/D9-1/stdout.log`、`evidence/EXP-D5-3-3/stdout.log`
- **状态**：复现（历史 #673，与 D1-26 同源不单独开单）

## #10【P1】D9-2 JSON-RPC 错误码不规范（-32603 而非标准 -32601/-32602）

- **现象**：spawn 源码 mcp-server 后，`__no_such_method__` 与未知 tool（`tools/call __no_such_tool__`）均返回 `{"code":-32603,"message":...}`，未区分 -32601（Method not found）与 -32602（Invalid params/Unknown tool）。
- **断言**：未知 method 应返回 `-32601`；未知 tool 应返回 `-32602`；错误码与结构符合 JSON-RPC 2.0 规范，客户端可区分处理。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:156-174` `handleMessage` 的 `dispatch` 抛错被 catch 后硬编码返回 `code:-32603`；`mcp-protocol.mjs:95` 对 unsupported method 抛 `Unsupported method` 同样被上层包装为 -32603，未按规范区分 -32601/-32602。
- **影响**：标准 MCP 客户端无法通过错误码区分「方法不存在」与「工具不存在」，异常处理/重试语义失真。
- **证据**：`evidence/D9-2/stdout.log`
- **状态**：新发现（本轮源码 spawn 补充测试）

## #11【P1】D10-3 serviceCatalog 中文意图路由大面积 MISS（准确率 21.4%）

- **现象**：`node eval/harness/run-eval.mjs` 跑 15 条中文评测集（EXP-E01~15），HIT=3 MISS=11 N/A=1，路由准确率 21.4%（<90%）。中文意图（创建云服务器/对象存储桶/MySQL 实例状态/绑定 EIP/备份策略/函数/费用/告警/证书/IAM 审计）均返回 `Run hcloud --help`，未命中对应服务。
- **断言**：serviceCatalog 中文意图命中对应服务（ECS/OBS/RDS/EIP/CBR/FunctionGraph/BSS/CES/ELB/IAM），路由准确率 ≥90%。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1784` routeMap 仅 sandbox（含「网站/网页/静态」）与 voucher（含「领券/代金券」）两条含 CJK 关键词，其余 20 个服务仅英文关键词；`tools.mjs:1884` 的 token 分词 `it.split(/[\s,./-]+/)` 对中文（中英混杂不切分）无法切出有效关键词 → 中文意图全部落空。
- **影响**：真实中文 Agent 会话的云任务路由失效，仅英文关键词或 sandbox/voucher 兜底命中，核心云服务中文意图不可达。
- **证据**：`evidence/D10-3/stdout.log`、`eval/results/eval-run-20260915134337.csv`、`evidence/EXP-E01~15/eval-run-result.csv`
- **状态**：新发现

## #12【P2】D9-9 capabilities.cancellation 未暴露（SPEC-MISMATCH）

- **现象**：initialize 返回 `capabilities={"tools":{}}`，无 `cancellation` 能力；tools/call 无超时/取消语义实现。
- **断言**：协议应声明取消/超时能力（或明确不支持），超时应返回 `{code:-32000, message 含 timeout}`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:62-65` initialize 返回 capabilities 仅 `{tools:{}}`，未声明 cancellation/futures 等能力；无超时 -32000 语义实现（与用例预期「超时返回 -32000」契约漂移）。
- **影响**：标准客户端无法感知取消能力，长耗时工具无法被客户端取消/超时。
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：SPEC-MISMATCH（实现与设计契约漂移）
