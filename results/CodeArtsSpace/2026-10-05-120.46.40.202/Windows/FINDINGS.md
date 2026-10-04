# FINDINGS — 缺陷发现清单（CodeArtsSpace-GLM-5.2）

> **落盘路径**：`results/CodeArtsSpace/2026-10-05-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：2026-10-05 05:22:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段。

---

## #1【P0】D2-4 小写 ak=/sk= 凭证未被脱敏

- **现象**：输出 `ak=AKIDxxx sk=Secretxxx` 时小写 `ak=`/`sk=` 未被脱敏，明文凭证泄漏到日志/上下文。
- **断言**：`redactSecrets("ak=AKIDxxx sk=Secretxxx")` 应返回 `ak=<redacted> sk=<redacted>`（大小写均需脱敏）。
- **根因**：`safety-policy.mjs:45` — 正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 仅匹配大写 `AK`/`SK`，缺少 `i` 标志（大小写不敏感），小写 `ak`/`sk` 不被匹配。
- **影响**：小写格式的 AK/SK 明文泄漏到日志、MCP 响应、agent 上下文。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：历史缺陷 #772 #694

## #2【P0】D2-11 STS get-token 命令未被安全规则拦截

- **现象**：执行 `sts get-token` 时安全策略返回 `decision=allow, risk=read_only`，未拦截临时凭证获取命令。
- **断言**：`sts get-token` 应返回 `decision=deny`（STS 临时凭证获取属敏感操作，token 永不落盘）。
- **根因**：`safety/rules/cloud-risk-rules.json:94` — 正则 `hcloud\s+STS\s+(AssumeAgency|GetCallerIdentity|GetTemporaryCredential)\b` 仅匹配 `hcloud STS AssumeAgency` 等三种形式，未覆盖 `sts get-token`；且规则 `severity` 为 `warn` 而非 `deny`（第88行）。
- **影响**：攻击者可通过 `sts get-token` 获取临时 AK/SK/SecurityToken 并持久化，绕过凭证保护。
- **证据**：`evidence/D2-11/stdout.log`
- **状态**：历史缺陷 #689

## #3【P1】D2-16 configure import 导入凭证文件未被拦截

- **现象**：执行 `configure import --file creds.json` 时安全策略返回 `decision=allow, risk=unknown_read`，未拦截凭证文件导入操作。
- **断言**：`configure import --file <凭证文件>` 应返回 `decision=deny`（导入凭证文件属敏感操作）。
- **根因**：`safety/policy.json:25` — `blockedConfigureSubcommands` 为 `["show", "get", "list", "export", "init"]`，缺少 `"import"`，导致 `configure import` 未被阻断。
- **影响**：可通过 `configure import` 导入任意凭证文件，绕过凭证保护机制。
- **证据**：`evidence/D2-16/stdout.log`
- **状态**：历史缺陷 #694

## #4【P0】D4-2 非华为云前缀凭证环境变量打印未被拦截

- **现象**：执行含 `HW_` 前缀的环境变量打印命令时，第三条命令返回 `decision=allow, risk=not_huaweicloud`，未被凭证保护规则拦截。
- **断言**：所有打印凭证环境变量的命令应返回 `decision=deny`（不论环境变量前缀）。
- **根因**：`safety-policy.mjs` 凭证环境变量打印规则仅匹配华为云特定前缀（`HUAWEICLOUD_`/`HW_`），未覆盖非标准前缀的凭证环境变量打印。
- **影响**：可通过非标准前缀环境变量名绕过凭证打印拦截，泄漏凭证到输出。
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：历史缺陷 #677

## #5【P0】D4-3 密钥服务操作（CSMS/KMS）未被拦截

- **现象**：执行 `csms show-secret`、`kms decrypt-data` 等密钥服务操作时，全部返回 `decision=allow`，未拦截敏感密钥读取。
- **断言**：`csms show-secret`、`kms decrypt-data` 等密钥服务操作应返回 `decision=deny`（属敏感操作，需审批）。
- **根因**：`safety/policy.json:26` — `blockedSecretOperations` 为 `["ShowSecret", "ShowSecretVersion", "DownloadSecret", "GetSecretValue"]`，仅覆盖 PascalCase API 形式，未覆盖 CLI 小写形式 `show-secret`，且缺少 `decrypt-data`/`decrypt` 等密钥解密操作。
- **影响**：可通过 CLI 小写形式绕过密钥操作拦截，读取 CSMS 凭证、解密 KMS 数据。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：历史缺陷 #677

## #6【P1】D4-4 echo $ACCESS_KEY 通用凭证变量名未拦截

- **现象**：执行 `echo $ACCESS_KEY` 时安全策略返回 `decision=allow`，未拦截通用凭证环境变量名打印。
- **断言**：`echo $ACCESS_KEY`、`echo $SECRET_KEY` 等通用凭证变量名打印应返回 `decision=deny`。
- **根因**：`safety-policy.mjs` 凭证环境变量打印规则未覆盖 `ACCESS_KEY`/`SECRET_KEY` 通用变量名（仅匹配华为云特定前缀）。
- **影响**：可通过通用凭证变量名绕过凭证打印拦截，泄漏凭证到输出。
- **证据**：`evidence/D4-4/stdout.log`
- **状态**：历史缺陷 #757

## #7【P1】D4-24 access_token 字段未被脱敏

- **现象**：对象 `{ token: "<redacted>", access_token: "accxxx" }` 中 `access_token` 未被脱敏，明文 token 泄漏。
- **断言**：`redactSecrets({ access_token: "accxxx" })` 应返回 `{ access_token: "<redacted>" }`。
- **根因**：`safety-policy.mjs:25` — `isSecretKeyName` 正则 `/access.*key|secret.*key|.../` 将 `access_token` 归一化为 `accesstoken`，不匹配 `access.*key`（无 "key"）；`policy.json:11` 模式 `"token"` 经 `^(token)$` 锚定后不匹配 `access_token`。
- **影响**：`access_token` 字段明文泄漏到 MCP 响应、日志、agent 上下文。
- **证据**：`evidence/D4-24/stdout.log`
- **状态**：历史缺陷 #805

## #8【P1】EXP-E01 serviceCatalog 路由 MISS：查云主机意图未命中 ECS

- **现象**：评测集 EXP-E01 意图「查一下我的账号在华南有哪些云主机」经 serviceCatalog 路由后实际输出 `Run hcloud --help`，未命中 ECS 服务。
- **断言**：serviceCatalog 应将「查云主机」意图路由到 ECS 服务（期望=ECS）。
- **根因**：`eval/harness/run-eval.mjs` 评测集 EXP-E01 意图「查云主机」未命中 ECS 路由，实际路由到 `Run hcloud --help`（MISS）。整体路由准确率 92.9%（HIT=13, MISS=1, N/A=1）。
- **影响**：用户查询云主机时未自动路由到 ECS 服务，需手动指定服务名。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：历史缺陷 #705
