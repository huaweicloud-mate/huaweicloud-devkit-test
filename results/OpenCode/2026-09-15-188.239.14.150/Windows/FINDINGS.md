# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）1.1.4 正式版

> **落盘路径**：`results/OpenCode/2026-09-15-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-15 00:42:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.4（npm latest，gitHead `9b67256`）
> **本清单是统一提单脚本的解析输入**。

---

## #1【P0】凭证 env 打印拦截不完整 — echo $HW_ACCESS_KEY 未被拦截

- **现象**：`classifyTextCommand('echo $HW_ACCESS_KEY')` 返回 `decision='allow'`，凭证环境变量可通过 echo 命令打印输出
- **断言**：`classifyTextCommand('echo $HW_ACCESS_KEY').decision === 'deny'`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335` — env-dump 检测正则 `(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)` 未包含 `echo` 命令；且第 336 行凭证前缀检测 `HUAWEICLOUD|HWC_|HCLOUD|OS_` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀
- **影响**：攻击者可通过 `echo $HW_ACCESS_KEY` 或 `echo $HW_SECRET_KEY` 绕过安全策略泄露凭证
- **证据**：`evidence/d4-security/stdout.log`（D4-2 echo-hw 测试项，actual=allow）
- **状态**：待提单

## #2【P0】命令包裹穿透 — sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID" 未被拦截

- **现象**：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 返回 `decision='allow'`
- **断言**：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"').decision === 'deny'`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335` — env-dump 正则 `(^|\s)(env|printenv|...)` 中 `(^|\s)` 仅匹配行首或空白字符，当 `printenv` 出现在引号内时前导字符为 `"` 不匹配
- **影响**：通过 `sh -c`、`bash -c` 等包装可绕过凭证 env 打印拦截
- **证据**：`evidence/d4-security/stdout.log`（D4-16 wrap-sh 测试项，actual=allow）
- **状态**：待提单

## #3【P0】redactSecrets 不脱敏 JSON 中小写 ak/sk 字段

- **现象**：`redactSecrets('{"ak": "AKIDTEST", "sk": "SKTEST"}')` 返回原始字符串，`sk` 明文未被替换
- **断言**：`String(redactSecrets('{"ak":"...","sk":"..."}')).includes('SK...') === false`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` — `redactString()` 正则 `/(AK|SK)\s*[:=]\s*.../g` 无 `i` 标志，不匹配小写 `ak`/`sk`；`isSecretKeyName()` (line 20-32) 模式不匹配短键名
- **影响**：工具输出中 JSON 格式凭证的 `sk` 明文不会被脱敏
- **证据**：`evidence/d2-auth/stdout.log`（D2-4 redact-json 测试项）
- **状态**：待提单

## #4【P1】INSTALL.md 未包含在 npm 发布包中

- **现象**：`huaweicloud-devkit@1.1.4` npm 包中不存在 `INSTALL.md` 文件
- **断言**：`existsSync('huaweicloud-devkit/INSTALL.md') === true`
- **根因**：`package.json` 的 `files` 字段未列出 `INSTALL.md`，npm publish 时排除
- **影响**：npm 安装用户无法访问安装引导文档
- **证据**：`evidence/d2-auth/stdout.log`（D8-4 install-doc 测试项，actual=false）
- **状态**：待提单
