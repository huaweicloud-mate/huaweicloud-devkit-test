# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2）

> **落盘路径**：`results/WorkBuddy/2026-10-22-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-22 05:10:00（北京时间）
> **本清单是统一提单脚本的解析输入**

---

## #1【P0】D2-4 凭证脱敏遗漏小写 ak=/sk= （红线用例）

- **现象**：输入 `ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=abc.def.ghi`，调用 `redactSecrets(input)`，返回 `ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=<redacted>` —— AK、SK 明文完整泄露。
- **断言**：`redactSecrets` 对小写 `ak=`/`sk=` 形式的凭证必须替换为 `<redacted>`，输出不得包含原始 AK/SK 字符串。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` —— 正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 仅匹配大写 `AK`/`SK`，缺少 `i` 标志（case-insensitive）；而第 42 行的通用 `authorization|token|...` 正则虽有 `i` 标志但不含 `ak`/`sk` 单独形式，导致小写 `ak=`/`sk=` 无人脱敏。
- **影响**：日志/错误消息中若以小写 `ak=...`/`sk=...` 形式出现凭证，将完整泄露到 agent 上下文，违反「凭证永不落盘/不进对话」红线。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D4-3 KMS DecryptData 明文 secret API 未拦截

- **现象**：输入 `hcloud KMS DecryptData --cli-region=cn-north-4 --cipher_text=xxx`，调用 `classifyTextCommand(input)`，返回 `{decision: "allow", risk: "unknown_read", reason: "Command does not match a known write or secret operation"}` —— 解密数据 API 未被拦截。
- **断言**：`hcloud KMS DecryptData` 必须返回 `decision: "deny"`（与 CSMS ShowSecret/GetSecretValue 同列），因 DecryptData 返回明文密钥，与直接读 secret 等价。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26` —— `blockedSecretOperations` 列表为 `["ShowSecret", "ShowSecretVersion", "DownloadSecret", "GetSecretValue"]`，缺少 `DecryptData`；`plugins/huaweicloud-core/src/safety-policy.mjs:257` 的次级正则 `secret[_-]?string|secret[_-]?binary|showsecret|showsecretversion|getsecretvalue` 也不含 `decryptdata`/`decrypt` 模式，故 KMS DecryptData 双重漏网。
- **影响**：agent 可直接调用 KMS DecryptData 获取明文密钥，绕过「secret 不进 agent 上下文」安全门禁。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #3【P0】D4-16 命令包裹穿透 — $() 残留尾括号致 operation 名失配

- **现象**：输入 `$(hcloud KMS DecryptData)`，调用 `classifyTextCommand(input)`，返回 `{decision: "allow", operation: "DecryptData)"}` —— `operation` 多了一个 `)`，导致与 `blockedSecretOperations` 精确匹配失败。同时 `KMS DecryptData` 本身未在 blocked 列表（见 #2），双重缺陷叠加。
- **断言**：`$(hcloud KMS DecryptData)` 必须返回 `decision: "deny"`；`extractHcloudSubcommand` 不得让 `)`/`;`/`&` 等 shell 元字符残留到 operation 名。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:500` —— `extractHcloudSubcommand` 中 `return t.slice(hcloudIndex)` 从 hcloud 关键字切到字符串末尾，未剥离 `$(...)` 的尾 `)`；`splitSimpleCommand` 仅分词不剥括号，导致 `operation = "DecryptData)"`。
- **影响**：任何 `$(hcloud <op>)` 形式都可能在 `blockedSecretOperations` 精确匹配环节漏判（write op 因 `writeOperationPrefixes` 用 `startsWith` 仍能命中；secret op 仅靠次级正则补救，DecryptData 无任何补救 → 完全穿透）。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单（与 #2 合并提单，同一安全门禁根因）

## #4【P2】D4-25 Authorization Bearer token 仅替换首词，token 值残留

- **现象**：输入 `Authorization: Bearer abc123 token=xyz.ak.sk`，调用 `redactSecrets(input)`，返回 `Authorization: <redacted> abc123 token=<redacted>` —— `abc123`（Bearer token 值）明文残留。
- **断言**：`redactSecrets` 对 `Authorization: <scheme> <token>` 形式必须整体替换为 `<redacted>`，不得残留 token 值。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` —— 正则 `((?:...|authorization|...)\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;]+)` 中值捕获组 `[^\s,;]+` 只取到第一个非空白 token（`Bearer`），之后的 `abc123` 不在匹配范围内；应改为捕获到行尾或下一个 `key=` 边界。
- **影响**：HTTP `Authorization: Bearer <token>` 头在错误消息/日志中将泄露真实 token 值。
- **证据**：`evidence/D4-25/stdout.log`
- **状态**：待提单

## #5【P1】EXP-E01 serviceCatalog 未识别「云主机」中文同义词

- **现象**：调用 `huaweicloud_service_catalog({intent: '帮我查一下我账号在华北北京四有哪些云主机'})`，返回 `recommendedServices: ["Run hcloud --help to list available services."]`（未命中 ECS）；而 `intent: '云服务器'` 正确命中 `ECS`。eval harness 判 MISS。
- **断言**：serviceCatalog 对中文同义词「云主机」（ECS 的常见中文叫法）必须命中 ECS 路由。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2027-2043` —— ECS 路由的 keywords 数组含 `'云服务器'`、`'服务器'`、`'虚拟机'`，但缺少 `'云主机'`；导致常用中文意图「查一下我的云主机」路由失败。
- **影响**：用户用「云主机」描述 ECS 时，serviceCatalog 返回兜底响应，无法推荐 huawei-ecs 技能/hcloud ECS 命令，影响路由准确率（基线 92.9%，该用例为唯一 MISS）。
- **证据**：`evidence/EXP-E01/stdout.log`；`evidence/eval-run-latest.csv`
- **状态**：待提单
