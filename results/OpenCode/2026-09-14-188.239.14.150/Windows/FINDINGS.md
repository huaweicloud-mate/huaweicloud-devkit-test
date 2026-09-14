# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-09-14-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-14 22:45:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**，否则自动提单解析失败/漏缺陷。

---

## #1【P0】凭证 env 打印拦截不完整 — echo $HW_ACCESS_KEY 未被拦截

- **现象**：`classifyTextCommand('echo $HW_ACCESS_KEY')` 返回 `decision='allow'`，凭证环境变量可通过 echo 命令打印输出
- **断言**：`classifyTextCommand('echo $HW_ACCESS_KEY').decision === 'deny'`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335` — env-dump 检测正则 `(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)` 未包含 `echo` 命令；且第 336 行凭证前缀检测 `HUAWEICLOUD|HWC_|HCLOUD|OS_` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀（华为云标准 env 变量名）
- **影响**：攻击者可通过 `echo $HW_ACCESS_KEY` 或 `echo $HW_SECRET_KEY` 绕过安全策略泄露凭证
- **证据**：`evidence/d4-security/stdout.log`（D4-2 hw-access-key-block 测试项，actual=allow）
- **状态**：待提单

## #2【P0】命令包裹穿透 — sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID" 未被拦截

- **现象**：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 返回 `decision='allow'`，通过 sh/bash 包装可绕过 env-dump 检测
- **断言**：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"').decision === 'deny'`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335` — env-dump 正则 `(^|\s)(env|printenv|...)` 中 `(^|\s)` 仅匹配行首或空白字符，当 `printenv` 出现在引号内（如 `sh -c "printenv ..."`）时，前导字符为 `"` 而非空白，导致正则不匹配
- **影响**：通过 `sh -c`、`bash -c`、`powershell -Command` 等包装可绕过凭证 env 打印拦截
- **证据**：`evidence/d4-security/stdout.log`（D4-16 wrap-sh 测试项，actual=allow）
- **状态**：待提单

## #3【P0】redactSecrets 不脱敏 JSON 中小写 ak/sk 字段

- **现象**：`redactSecrets('{"ak": "AKIDTEST12345678", "sk": "SKTEST1234567890abcdef1234"}')` 返回原始字符串，`sk` 明文未被替换为 `<redacted>`
- **断言**：`String(redactSecrets('{"ak": "AKID...", "sk": "SK..."}')).includes('SK...') === false`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` — `redactString()` 中凭证匹配正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 未加 `i` 标志（大小写敏感），不匹配 JSON 中小写 `ak`/`sk` 键名；同时 `isSecretKeyName()` (line 20-32) 的检测模式 `access.*key|secret.*key|...` 也不匹配短键名 `ak`/`sk`（华为云 credentials.json 实际使用的字段名）
- **影响**：工具输出中包含 JSON 格式凭证（如 `{"ak":"...","sk":"..."}`）时，`sk` 明文不会被脱敏，可能导致凭证泄露到日志/报告中
- **证据**：`evidence/d2-auth/stdout.log`（D2-4 redact-json 测试项，actual 含明文 sk）
- **状态**：待提单

## #4【P1】INSTALL.md 未包含在 npm 发布包中

- **现象**：`huaweicloud-devkit@next` npm 包中不存在 `INSTALL.md` 文件，`existsSync(pkgRoot/INSTALL.md)` 返回 `false`
- **断言**：`existsSync(require.resolve('huaweicloud-devkit/INSTALL.md')) === true`
- **根因**：`package.json` 的 `files` 字段未列出 `INSTALL.md`，npm publish 时该文件被排除
- **影响**：通过 npm 安装的用户无法访问安装引导文档，影响首次安装体验
- **证据**：`evidence/d8-d10-harness/stdout.log`（D8-4 install-doc-exists 测试项，actual=False）
- **状态**：待提单
