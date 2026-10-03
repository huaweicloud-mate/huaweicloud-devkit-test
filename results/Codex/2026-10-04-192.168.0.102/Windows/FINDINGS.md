# FINDINGS — 缺陷发现清单（Codex-GPT-5）

> **落盘路径**：`results/Codex/2026-10-04-192.168.0.102/Windows/FINDINGS.md`
> **生成时间**：2026-10-04 05:10:00（北京时间）
> **被测版本**：`huaweicloud-devkit@1.1.8-next.1` / `ffd7b47`

## #1【P0】D4-16 命令包裹穿透未被 MCP hook 拦截

- **现象**：`huaweicloud_hook_check_command` 对包装命令场景返回 `{"ok":true,"decision":"allow","findings":[]}`，测试项 `wrap-mcp` 实际为 allow。
- **断言**：`D4-16` 对 `sh/bash/powershell -c` 等包装内层高风险命令必须返回 deny 或至少非 allow。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:411` 的包装命令提取、`:493` 的候选命令分类、`:555` 的 hcloud 子命令识别未覆盖本次 MCP hook 输入中的包装形态，导致内层命令未进入 deny 路径。
- **影响**：P0 安全门缺口，包装后的危险 Huawei Cloud 命令可能绕过 hook 检查。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #2【P1】D4-27 双路径输出脱敏不完整

- **现象**：`redact-dual` 断言失败，实际输出仍包含 `{"ak":"AKID123","sk":"SK1234567890abcdef","token":"STSTOKEN1`。
- **断言**：`D4-27` 中 AK/SK/token 在对象路径与字符串路径输出里都必须替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:49` 的 `redactSecrets` 仅按对象 key 或普通字符串规则递归；`:57` 处理对象字段名，`:61` 才处理字符串内容，未先解析或覆盖 JSON 字符串内的短字段名 `ak/sk/token` 组合，导致嵌入 JSON 字符串泄漏。
- **影响**：日志、MCP tool 结果或错误消息中可能残留敏感凭证片段。
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #3【P1】EXP-E01/02/03/04/05/07/10/11/12/13/14 service catalog 路由 MISS

- **现象**：11 条评测集路由用例返回 `actual=MISS`，包括 `EXP-E01`、`EXP-E02`、`EXP-E03`、`EXP-E04`、`EXP-E05`、`EXP-E07`、`EXP-E10`、`EXP-E11`、`EXP-E12`、`EXP-E13`、`EXP-E14`。
- **断言**：上述评测集意图必须命中对应 Huawei Cloud 能力路由，返回 HIT。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1966` 的 `serviceCatalog` 使用静态 `routeMap`；`:2195` 只做 token 精确命中或 CJK 子串匹配；`:2214` 未命中时退回泛化提示，缺少评测集中复合中文场景/同义词/跨服务意图的覆盖。
- **影响**：用户以场景化中文描述任务时，能力发现可能无法推荐正确 skill/service，影响后续自动化执行链路。
- **证据**：`evidence/EXP-E01/stdout.log`、`evidence/EXP-E02/stdout.log`、`evidence/EXP-E03/stdout.log`、`evidence/EXP-E04/stdout.log`、`evidence/EXP-E05/stdout.log`、`evidence/EXP-E07/stdout.log`、`evidence/EXP-E10/stdout.log`、`evidence/EXP-E11/stdout.log`、`evidence/EXP-E12/stdout.log`、`evidence/EXP-E13/stdout.log`、`evidence/EXP-E14/stdout.log`
- **状态**：待提单