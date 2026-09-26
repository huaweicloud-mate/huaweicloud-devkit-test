# FINDINGS — 缺陷发现清单（Codex-GPT-5-Codex）

> **落盘路径**：`results/Codex/2026-09-27-192.168.0.102/Windows/FINDINGS.md`
> **生成时间**：`2026-09-27 05:20:00`（北京时间）
> **被测版本**：`huaweicloud-devkit@1.1.7` / hdk `7456d05`

## #1【P0】D2-4 凭证 JSON 字符串脱敏不完整

- **现象**：`d2-auth` 新鲜探针中 `redact-json` 断言失败，实际输出仍含 `{"ak":"AKIDTEST...","sk":"SKTEST..."` 片段。
- **断言**：包含 `ak`/`sk` 键的 JSON 字符串经过脱敏后不得保留原始 AK/SK 明文。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:49` 的 `redactSecrets()` 对字符串只调用 `redactString()`，未先识别/解析 JSON 字符串并按键名脱敏。
- **影响**：P0 凭证脱敏红线；工具返回或日志若传入 JSON 字符串会泄露 AK/SK。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D4-16 sh 包裹命令未被安全策略阻断

- **现象**：`d4-security` 中 `wrap-sh` 实测 `actual=allow expected=deny`；`mcp-tools` 中 `wrap-mcp` 同样返回 allow。
- **断言**：`sh -c`/shell wrapper 包裹的高危 Huawei Cloud 命令必须被展开并继承原命令的 deny 判定。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:70` 虽有 shell wrapper 展开逻辑，但当前实测 `sh` 包裹路径仍未进入 deny；说明 `classifyTextCommand()` 的文本拆分/参数归一化未覆盖该输入形态。
- **影响**：P0 安全绕过，攻击者可通过 shell wrapper 绕过写操作或敏感读取拦截。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #3【P1】D4-27 双路径输出脱敏不完整

- **现象**：`d2-auth` 中 `redact-dual` 断言失败，JSON 字符串中的 `ak`/`sk`/`token` 仍有明文片段。
- **断言**：同时含 AK/SK/token 的对象或 JSON 字符串，输出必须全部替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:49` 的递归脱敏仅对对象键名有效；当同等内容已序列化为字符串时，`redactString()` 不能按 JSON key 语义处理多字段凭证。
- **影响**：P1 脱敏一致性缺陷，双路径日志/工具返回存在泄露风险。
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #4【P1】EXP-E01/E02/E03/E04/E05/E07/E10/E11/E12/E13/E14 D10 服务路由评测 MISS

- **现象**：D10 评测集中 11 条 `eval-route` 返回 `actual=MISS expected=HIT`。
- **断言**：评测集中每条明确意图应命中目标服务路由，`actual` 必须为 `HIT`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1815` 的 `serviceCatalog()` 主要依赖固定关键词表和简单 token/include 匹配；`tools.mjs:1923` 到 `1947` 未覆盖评测集中的多种中文场景/同义表达，未命中时退回泛化 fallback。
- **影响**：P1 能力发现/服务推荐准确性不足，真实中文意图可能无法路由到正确 Huawei Cloud skill/service。
- **证据**：`evidence/EXP-E01/stdout.log`、`evidence/EXP-E02/stdout.log`、`evidence/EXP-E03/stdout.log`、`evidence/EXP-E04/stdout.log`、`evidence/EXP-E05/stdout.log`、`evidence/EXP-E07/stdout.log`、`evidence/EXP-E10/stdout.log`、`evidence/EXP-E11/stdout.log`、`evidence/EXP-E12/stdout.log`、`evidence/EXP-E13/stdout.log`、`evidence/EXP-E14/stdout.log`
- **状态**：待提单
