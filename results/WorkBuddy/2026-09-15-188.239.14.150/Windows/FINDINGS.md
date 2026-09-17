# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2）

> **落盘路径**：`results/WorkBuddy/2026-09-15-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-15 21:50:00（北京时间）— 补测更新
> **被测版本**：huaweicloud-devkit@1.1.5（gitHead e7ed6f6）
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

## #5【P1】EXP-E01~E14 serviceCatalog 中文意图路由命中率仅 21.4%（11/14 MISS）

- **现象**：D10 评测集 `eval/harness/run-eval.mjs` 对 15 条中文意图逐条调 `huaweicloud_service_catalog`，仅 3 条命中期望路由（EXP-E06 DCS、EXP-E09 CCE、EXP-E15 Incentive Voucher），11 条 MISS 返回 `"Run hcloud --help to list available services."` 后备响应。准确率 21.4%（3/14，分母=HIT+MISS）。
- **断言**：中文意图（如"帮我查一下我账号在华北北京四有哪些云主机"→ECS、"创建一台 2C4G 的 Ubuntu 云服务器"→ECS、"看一下我的云数据库MySQL实例的状态"→RDS）应被 `serviceCatalog` 正确路由到对应服务。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1886-1908` — `serviceCatalog` 的 `routeMap` 关键词以英文为主（`ecs`/`obs`/`rds`/`eip`/`cbr`/`ces`/`elb`/`iam`/`bss`/`functiongraph`），缺少中文关键词（如"云主机"/"云服务器"/"弹性公网IP"/"云数据库"/"备份"/"监控"/"证书"/"权限审计"/"费用"）。匹配逻辑 `route.keywords.some(kw => it.includes(kw))` 无法匹配不含英文关键词的纯中文意图。
- **影响**：中文用户使用 `huaweicloud_service_catalog` 工具时，78.6% 的意图无法被正确路由，降低中文场景的 Agent 路由准确率。
- **证据**：`evidence/EXP-E01/stdout.log`（含 15 条评测集完整结果），`eval/results/eval-run-20260915134457.csv`
- **状态**：待提单

## #6【SPEC-MISMATCH】D9-9 initialize 未声明 notifications/cancellation 能力

- **现象**：`mcp-protocol.mjs` 的 `dispatch('initialize')` 返回 `capabilities: { tools: {} }`，不包含 `notifications/cancellation` 能力声明。MCP 协议规范建议服务端在 initialize 响应中声明取消能力，使客户端知道可以发送 `notifications/cancelled` 请求。
- **断言**：`initialize.result.capabilities` 应包含 `notifications/cancellation` 字段（或明确声明不支持）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:62-68` — `dispatch` 的 initialize 分支返回 `capabilities: { tools: {} }`，未包含 `notifications` 或 `cancellation` 字段。
- **影响**：MCP 客户端无法确定服务端是否支持取消通知，可能导致超时后客户端行为不确定。
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：SPEC-MISMATCH（已记录漂移点，超时/取消行为测试需 MCP Inspector + 延迟注入，保留 BLOCKED 部分）
