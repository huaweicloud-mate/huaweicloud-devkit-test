# FINDINGS — 缺陷发现清单（Hermes-GLM-5.2）

> **落盘路径**：`results/Hermes/2026-10-08-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：2026-10-08 05:57:00（北京时间）
> **被测版本**：1.1.8-next.1

---

## #1【P0】D4-2 凭证env打印拦截不完整

- **现象**：`classifyTextCommand('env | grep HW_SECRET')` 返回 `{ decision: 'allow' }`（应 deny）；`classifyTextCommand('echo %HW_ACCESS_KEY%')` 返回 `{ decision: 'allow' }`（应 deny）
- **断言**：`classifyTextCommand('env | grep HW_SECRET')` 应返回 `{ decision: 'deny', risk: 'credential' }`；`classifyTextCommand('echo %HW_ACCESS_KEY%')` 应返回 `{ decision: 'deny', risk: 'credential' }`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:399` + `:417-418`
  - Line 399: env-dump 检测正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未包含 `HW_` 前缀模式。`HW_SECRET`、`HW_ACCESS_KEY` 等使用 `HW_` 前缀（华为云插件文档化的凭证前缀），但不匹配 `HWC_`（需要 C）。
  - Line 417-418: 凭证变量引用正则 `/(?<!['\\])\$\{?(?:HUAWEICLOUD|HWC|HW|OS)_(?:ACCESS_KEY|SECRET_KEY|SECURITY_TOKEN)/i` 只匹配 Unix 风格 `$HW_ACCESS_KEY`，不匹配 Windows cmd.exe `%HW_ACCESS_KEY%` 语法。
- **影响**：攻击者可通过 `env | grep HW_SECRET` 或 Windows `echo %HW_ACCESS_KEY%` 绕过凭证环境变量打印拦截，泄露凭证
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：待提单

## #2【P1】D4-26 findings证据脱敏大小写缺陷

- **现象**：`redactString('sk=1234567890abcdef')` 返回 `sk=1234567890abcdef`（明文未脱敏）；`redactString('ak=test')` 返回 `ak=test`（明文未脱敏）
- **断言**：`redactString('sk=1234567890abcdef')` 应返回 `sk=<redacted>`；`redactString('ak=test')` 应返回 `ak=<redacted>`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` `redactString` 函数正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 缺少 `i` flag（case-insensitive）。大写 `AK=`/`SK=` 正确脱敏，小写 `ak=`/`sk=` 不匹配。
- **影响**：如果错误日志、findings 或工具返回值中包含小写 `ak=`/`sk=` 格式的凭证，不会被自动脱敏，存在凭证泄露风险
- **证据**：`evidence/D4-26/stdout.log`
- **状态**：待提单
