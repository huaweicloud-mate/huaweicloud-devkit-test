# FINDINGS — 缺陷发现清单（OpenClaw-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenClaw/2026-11-14-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：2026-11-14（北京时间）
> **本清单是统一提单脚本的解析输入**：格式严格遵循，标题带用例 ID + 根因含文件:行号。

## #1【P0】D4-3 明文 secret API 拦截（KMS DecryptData / csms download-secret 未拦截）

- **现象**：`classifyTextCommand('hcloud KMS DecryptData --ciphertext xxx')` 返回 `decision=allow (unknown_read)`；`classifyTextCommand('hcloud csms download-secret --secret-name x')` 返回 `allow`。仅 `ShowSecretVersion`/`ShowSecret`/`GetSecretValue` 命中 `blockedSecretOperations`，`DecryptData`/`DecryptDatakey`/`download-secret`（红线明确禁止直连 csms download-secret / kms decrypt）未被拦截。
- **断言**：明文 secret/密钥解密的 API 调用（`hcloud KMS DecryptData/DecryptDatakey`、`hcloud csms download-secret`）应被 `classifyTextCommand` 判 `deny`（与红线「MUST NOT call hcloud csms download-secret / hcloud kms decrypt」一致）。
- **根因**：`plugins/huaweicloud-core/src/safety/policy.json` 的 `blockedSecretOperations` 仅含 `ShowSecret/ShowSecretVersion/DownloadSecret/GetSecretValue`，缺 `DecryptData`/`DecryptDatakey`（KMS）与 `download-secret`（小写）等；`plugins/huaweicloud-core/src/safety-policy.mjs:230` `blockedSecretOperations` 判定无法覆盖这些动词。
- **影响**：P0 凭证红线——直接解密密钥/下载 secret 的命令可绕过安全 hook，明文 secret 进入 agent 上下文。
- **证据**：`evidence/D4-3/stdout.log`

## #2【P1】D4-27 双路径输出脱敏缺口（空格分隔形态泄露 AK/SK）

- **现象**：`redactSecrets('--access-key AKIA1234567890 --secret-key sksecret123 --security-token tok123')` 返回原文未脱敏；`=` 分隔形态（`--access-key=...`）正常脱敏。hcloud-cli 的 obsutil 独立凭证 flag（`-i/-k/-t` 空格形态）同路径泄露。
- **断言**：`redactSecrets`/`redactOutput` 双路径均应将空格分隔形态（`--access-key <val>`）与 `=` 形态一致替换为 `<redacted>`，不泄露明文。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` `redactString` 正则仅匹配 `key[:=]\s*value`（`key` 后紧跟 `[:=]`），不匹配 `key <空格> value` 分隔形态。
- **影响**：P1——凭证经空格分隔 CLI 参数形态（obsutil standalone flag）泄露到日志/对话。
- **证据**：`evidence/D4-27/stdout.log`

## #3【P2】D1-65 调试模式环境变量契约漂移（telemetry 域 '1' 不生效）

- **现象**：`update-check.mjs:241` 的 `debugLog` 判 `DEBUG === '1' || DEBUG === 'true'`；但 `telemetry/telemetry.mjs:82` 的 `DEBUG` 仅 `=== 'true'`，`DEBUG=1` 不开启 telemetry 调试日志。
- **断言**：契约「DEBUG=1/true 均开启调试日志」应在 update-check 与 telemetry 两域一致生效。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:82` `const DEBUG = process.env.HUAWEICLOUD_DEVKIT_DEBUG === 'true'`（缺 `|| === '1'` 分支）。
- **影响**：P2——telemetry 域调试开关判定与 update 域漂移，`DEBUG=1` 静默失效。
- **证据**：`evidence/D1-65/stdout.log`

## #4【P2】D8-9 安装 ID 与遥测值脱敏缺口（sanitizeValue 不脱敏敏感值）

- **现象**：`sanitizeValue('AK=AKID1234567890 token=abc123')` 原样返回 `AK=AKID1234567890 token=abc123`（仅 trim + 截断），敏感值未被移除。
- **断言**：`sanitizeValue` 应移除 AK/SK/token 等敏感值（替换为 `<redacted>` 或删除），仅保留合法遥测值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190-197` `sanitizeValue` 仅 `replace([\r\n\t]+) + trim + 截断 255`，无敏感值脱敏。
- **影响**：P2——含凭证的遥测值（如 tool/cli value）未经脱敏上报，存在秘密泄露风险。
- **证据**：`evidence/D8-9/stdout.log`

## #5【P2】D4-25 Python hook 事件遥测分类（写动词落 cli:invoke 而非 cli:write）

- **现象**：`record_cli_event('hcloud ECS DeleteServer --force')` 分类为 `cli:invoke`；`record_cli_event('hcloud VPC CreateVpc ...')` 分类为 `cli:invoke`，均非 `cli:write`。只读 `ListServersDetails` 正确落 `cli:read`。
- **断言**：写动词（Delete*/Create* 等）应落 `cli:write`，只读落 `cli:read`，其他落 `cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE = re.compile(r"(^|[A-Za-z0-9])(" + "|".join(write_prefixes) + r")\w*", re.I)` 的 `(^|[A-Za-z0-9])` 前置不匹配「service<空格>operation」分割（`ECS DeleteServer` 中 `Delete` 前是空格，非字符类边界），仅匹配紧邻字母/数字/行首的写动词；`record_cli_event` 中 `is_write` 因此判 False。
- **影响**：P2——Python hook 遥测将写操作误分到 `cli:invoke`，破坏 cli:read/write/invoke 三键分类契约。
- **证据**：`evidence/D4-25/stdout.log`

## #6【P1】EXP-E01 中文「云主机」意图路由 MISS

- **现象**：`service_catalog({intent:'帮我查一下我账号在华北北京四有哪些云主机'})` 返回 `recommendedServices=['Run hcloud --help to list available services.']`，未命中 ECS。D10-3 评测集 HIT=13 MISS=1 acc=92.9%。
- **断言**：中文意图「云主机」应命中 ECS（ECS keywords 含「云主机」同义词）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2358-2370` ECS route keywords 缺「云主机」（仅「弹性云服务器/云服务器/服务器/虚拟机/镜像」）。
- **影响**：P1——中文「云主机」高频意图路由 MISS，需 clarification 兜底。
- **证据**：`evidence/EXP-E01/stdout.log`