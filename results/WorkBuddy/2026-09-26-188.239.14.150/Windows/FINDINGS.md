# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2）

> **落盘路径**：`results/WorkBuddy/2026-09-26-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-26 05:20:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.7

## #1【P0】D2-4 凭证脱敏正确性

- **现象**: `redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234"}')` 返回的字符串中 SK 值完整保留，未被脱敏
- **断言**: `redactSecrets` 处理后的字符串不含原始 SK 值
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs:45` — `redactString` 的 regex `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 仅匹配大写 `AK`/`SK`，不匹配 JSON 中 lowercase `ak`/`sk`
- **影响**: 凭证泄露风险——JSON 格式凭证中的 ak/sk 键值未被脱敏，可能泄露到日志/findings
- **证据**: `evidence/D2-4/stdout.log`
- **状态**: 待提单

## #2【P0】D4-16 命令包裹穿透

- **现象**: `classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 返回 `decision: 'allow'`，命令未被拦截
- **断言**: `classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 返回 `decision: 'deny'`
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs:384-430` — `classifyTextCommand` 在 hcloud regex 不匹配时直接 fallthrough 到 allow，未调用 `stripExecutable` 解包 `sh -c` wrapper；`stripExecutable` 仅在 `classifyHcloudArgs` 路径（line 173）生效
- **影响**: 安全绕过——攻击者可用 `sh -c` 包裹敏感命令绕过安全分类
- **证据**: `evidence/D4-16/stdout.log`
- **状态**: 待提单

## #3【P0】D4-23 全局规则 huawei-agent-rules.md 注入生效性

- **现象**: `setup-cli.mjs` 安装流程未将 `rules/huawei-agent-rules.mdc` 注入到客户端配置目录；规则文件存在于仓库但安装时未复制
- **断言**: 安装时将 `rules/huawei-agent-rules.mdc` 注入到全部客户端配置目录，约束可执行，无孤儿文件
- **根因**: `plugins/huaweicloud-core/src/setup-cli.mjs` — 全文无 `huawei-agent-rules` / `agent-rules` / `rules` 引用；规则注入逻辑缺失（SPEC-MISMATCH）
- **影响**: 客户端安装后无全局安全规则约束，安全策略不完整
- **证据**: `evidence/D4-23/stdout.log`
- **状态**: 待提单

## #4【P2】D4-26 findings 证据脱敏

- **现象**: findings 输出中 `ak`/`sk` 键值未被脱敏，SK 值完整保留
- **断言**: findings 输出中 `ak`/`sk` 值被脱敏
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs:45` — 同 D2-4 根因，`redactString` regex 仅匹配大写 `AK`/`SK`
- **影响**: findings 报告中可能泄露凭证
- **证据**: `evidence/D4-26/stdout.log`
- **状态**: 待提单

## #5【P1】D4-27 双路径输出脱敏

- **现象**: MCP + 直调双路径均未脱敏 lowercase `ak`/`sk`
- **断言**: MCP + 直调双路径均脱敏 `ak`/`sk`
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs:45` — 同 D2-4 根因
- **影响**: 双路径输出均可能泄露凭证
- **证据**: `evidence/D4-27/stdout.log`
- **状态**: 待提单

## #6【P1】EXP-E01~E14 serviceCatalog 路由 MISS

- **现象**: `eval/harness/run-eval.mjs` 跑 serviceCatalog 路由层，15 条评测集中 10 条未命中（EXP-E01,E02,E03,E04,E05,E07,E10,E11,E12,E13,E14 MISS；E06,E08,E09,E15 HIT）
- **断言**: 15 条评测集意图全部路由命中（HIT）
- **根因**: `plugins/huaweicloud-core/src/hcloud-cli.mjs` serviceCatalog 路由层覆盖不全（基线 21.4% MISS，与历史一致，非本次回归）
- **影响**: 评测集意图路由不完整，部分中文意图无法正确路由到对应云服务
- **证据**: `evidence/c4-service-matrix/stdout.log`（EXP-E01~E14 逐条结果）
- **状态**: 待提单
