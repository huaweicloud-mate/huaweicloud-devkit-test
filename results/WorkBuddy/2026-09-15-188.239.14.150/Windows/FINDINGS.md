# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2）

> **落盘路径**：`results/WorkBuddy/2026-09-15-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-15 20:45:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.4（gitHead 9b67256e）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

---

## #1【P0】D1-39 Windows 升级检测链不可用（npm.cmd spawnSync 缺 shell:true）

- **现象**：在 Windows 上直调 `queryDistTagsSync()` 返回 `null`；`spawnSync('npm.cmd', ['view', ...])` 无 `shell: true` 时 `status=null`（进程未启动）；加 `shell: true` 后正常返回 `{"latest":"1.1.4","next":"1.1.4-next.6"}`。MCP 工具 `huaweicloud_check_update` 返回 `result: "check_failed"`。
- **断言**：Windows 下 `queryDistTagsSync()` 应返回有效 dist-tags 对象（`{latest, next}`），不得返回 `null` 静默失败。
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs:238` — `spawnSync(NPM_BIN, [...], { encoding, timeout, windowsHide, cwd })` 未传 `shell: true`；Windows 上 `.cmd` 批处理文件必须 `shell: true` 才能被 `spawnSync` 执行。
- **影响**：Windows 用户无法检测到新版本，升级提醒链完全失效；`check_update` MCP 工具返回 `check_failed`。
- **证据**：`evidence/D1-39/stdout.log`
- **状态**：待提单

## #2【P0】D4-2 HW_ACCESS_KEY/HW_SECRET_KEY 环境变量打印未被拦截

- **现象**：`printenv HW_ACCESS_KEY`、`printenv HW_SECRET_KEY`、`echo $HW_ACCESS_KEY`、`echo %HW_ACCESS_KEY%`、`set HW_SECRET_KEY` 均返回 `allow`（未被拦截）；而 `printenv HUAWEICLOUD_AK`、`env | grep HUAWEICLOUD` 正确返回 `deny`。
- **断言**：`classifyTextCommand('printenv HW_ACCESS_KEY')` 应返回 `decision: 'deny'`（`HW_ACCESS_KEY`/`HW_SECRET_KEY` 是 hcloud/KooCLI 实际使用的凭证环境变量名）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:336` — 环境变量拦截正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未包含 `HW_` 前缀（`HW_ACCESS_KEY`、`HW_SECRET_KEY`、`HW_SECURITY_TOKEN` 均漏匹配）。
- **影响**：攻击者可通过 `printenv HW_ACCESS_KEY` 等命令泄露 hcloud 凭证，绕过安全策略。
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：待提单

## #3【P0】D4-16 命令包裹穿透（sh -c/bash -c/eval 包裹 hcloud 写命令不被检测）

- **现象**：`sh -c "hcloud ECS DeleteServer"`、`bash -c "hcloud ECS DeleteServer"`、`eval "hcloud ECS DeleteServer"`、`$(hcloud ECS DeleteServer)`、`powershell -c "hcloud ECS DeleteServer"`、`cmd /c "hcloud ECS DeleteServer"` 全部返回 `allow`（0/6 被拦截）。
- **断言**：`classifyTextCommand('sh -c "hcloud ECS DeleteServer"')` 应返回 `decision: 'deny'`（应检测到 shell 包裹内层的 hcloud 写命令）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:345` — hcloud 命令识别正则 `/(^|\s)hcloud(\.exe)?\s+/i` 仅匹配以 `hcloud` 开头或空格后紧跟 `hcloud` 的命令；不检测 `sh -c`/`bash -c`/`eval`/`$()`/`cmd /c`/`powershell -c` 等 shell 包裹内层的 hcloud 命令。
- **影响**：攻击者可通过 shell 包裹绕过安全策略执行高危 hcloud 写命令（删除资源等）。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #4【P1】D4-6 adminPass 空格分隔 CLI 参数未被脱敏

- **现象**：`redactSecrets('--adminPass MyPassword123!')` 返回原文未脱敏；而 `redactSecrets('adminPass=MyPassword123!')` 和 `redactSecrets('--adminPass=MyPassword123!')` 正确返回 `<redacted>`。
- **断言**：`redactSecrets('--adminPass MyPassword123!')` 应将 `MyPassword123!` 脱敏为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` — `redactString()` 的正则 `/((?:...|adminPass|...)\s*[:=]\s*)(value)/gi` 要求键名后跟 `:` 或 `=`；不匹配 `--adminPass value`（空格分隔的 CLI 参数格式）。
- **影响**：ECS 创建命令中 `--adminPass` 以空格分隔传值时，密码会以明文出现在日志/输出中。
- **证据**：`evidence/D4-6/stdout.log`
- **状态**：待提单
