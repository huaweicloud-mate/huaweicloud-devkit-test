# FINDINGS — 缺陷发现清单（CodeArtsSpace-GLM-5.2）

> **落盘路径**：`results/CodeArtsSpace/2026-10-02-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：2026-10-02 05:12:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段。

---

## #1【P0】D2-11 STS get-token 命令未被安全规则拦截

- **现象**：执行 `sts get-token` 时安全策略返回 `decision=allow, risk=read_only`，未拦截临时凭证获取命令。
- **断言**：`sts get-token` 应返回 `decision=deny`（STS 临时凭证获取属敏感操作，token 永不落盘）。
- **根因**：`safety/rules/cloud-risk-rules.json:94` — 正则 `hcloud\s+STS\s+(AssumeAgency|GetCallerIdentity|GetTemporaryCredential)\b` 仅匹配 `hcloud STS AssumeAgency` 等三种形式，未覆盖 `sts get-token`；且规则 `severity` 为 `warn` 而非 `deny`（第88行）。
- **影响**：攻击者可通过 `sts get-token` 获取临时 AK/SK/SecurityToken 并持久化，绕过凭证保护。
- **证据**：`evidence/D2-11/stdout.log`
- **状态**：待提单

## #2【P1】D2-16 configure import 导入凭证文件未被拦截

- **现象**：执行 `configure import --file creds.json` 时安全策略返回 `decision=allow, risk=unknown_read`，未拦截凭证文件导入操作。
- **断言**：`configure import --file <凭证文件>` 应返回 `decision=deny`（导入凭证文件属敏感操作）。
- **根因**：`safety/policy.json:25` — `blockedConfigureSubcommands` 为 `["show", "get", "list", "export", "init"]`，缺少 `"import"`，导致 `configure import` 未被阻断。
- **影响**：可通过 `configure import` 导入任意凭证文件，绕过凭证保护机制。
- **证据**：`evidence/D2-16/stdout.log`
- **状态**：待提单

## #3【P0】D2-4 小写 ak=/sk= 凭证未被脱敏

- **现象**：输出 `ak=AKIDxxx sk=Secretxxx` 时小写 `ak=`/`sk=` 未被脱敏，明文凭证泄漏到日志/上下文。
- **断言**：`redactString("ak=AKIDxxx sk=Secretxxx")` 应返回 `ak=<redacted> sk=<redacted>`（大小写均需脱敏）。
- **根因**：`safety-policy.mjs:45` — 正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 仅匹配大写 `AK`/`SK`，缺少 `i` 标志（大小写不敏感），小写 `ak`/`sk` 不被匹配。
- **影响**：小写格式的 AK/SK 明文泄漏到日志、MCP 响应、agent 上下文。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #4【P0】D4-2 非华为云前缀凭证环境变量打印未被拦截

- **现象**：执行含 `HW_` 前缀的环境变量打印命令时，第三条命令返回 `decision=allow, risk=not_huaweicloud`，未被凭证保护规则拦截。
- **断言**：所有打印凭证环境变量的命令应返回 `decision=deny`（不论环境变量前缀）。
- **根因**：`safety-policy.mjs` 凭证环境变量打印规则仅匹配华为云特定前缀（`HUAWEICLOUD_`/`HW_`），未覆盖非标准前缀的凭证环境变量打印。
- **影响**：可通过非标准前缀环境变量名绕过凭证打印拦截，泄漏凭证到输出。
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：待提单

## #5【P1】D4-24 access_token 字段未被脱敏

- **现象**：对象 `{ token: "<redacted>", access_token: "accxxx" }` 中 `access_token` 未被脱敏，明文 token 泄漏。
- **断言**：`redactSecrets({ access_token: "accxxx" })` 应返回 `{ access_token: "<redacted>" }`。
- **根因**：`safety-policy.mjs:25` — `isSecretKeyName` 正则 `/access.*key|secret.*key|.../` 将 `access_token` 归一化为 `accesstoken`，不匹配 `access.*key`（无 "key"）；`policy.json:11` 模式 `"token"` 经 `^(token)$` 锚定后不匹配 `access_token`。
- **影响**：`access_token` 字段明文泄漏到 MCP 响应、日志、agent 上下文。
- **证据**：`evidence/D4-24/stdout.log`
- **状态**：待提单

## #6【P0】D4-3 密钥服务操作（CSMS/KMS）未被拦截

- **现象**：执行 `csms show-secret`、`kms decrypt-data` 等密钥服务操作时，全部返回 `decision=allow`，未拦截敏感密钥读取。
- **断言**：`csms show-secret`、`kms decrypt-data` 等密钥服务操作应返回 `decision=deny`（属敏感操作，需审批）。
- **根因**：`safety/policy.json:26` — `blockedSecretOperations` 为 `["ShowSecret", "ShowSecretVersion", "DownloadSecret", "GetSecretValue"]`，仅覆盖 PascalCase API 形式，未覆盖 CLI 小写形式 `show-secret`，且缺少 `decrypt-data`/`decrypt` 等密钥解密操作。
- **影响**：可通过 CLI 小写形式绕过密钥操作拦截，读取 CSMS 凭证、解密 KMS 数据。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #7【P1】D4-4 非华为云前缀 echo 凭证未被拦截

- **现象**：执行 `echo $ACCESS_KEY` 等非华为云前缀凭证打印命令时，返回 `decision=allow, risk=not_huaweicloud`，未拦截。
- **断言**：打印凭证环境变量的 echo 命令应返回 `decision=deny`（不论变量名前缀）。
- **根因**：`safety-policy.mjs` 凭证打印拦截规则仅匹配华为云特定环境变量名（`HUAWEICLOUD_ACCESS_KEY`/`HW_ACCESS_KEY` 等），未覆盖通用凭证变量名 `ACCESS_KEY`/`SECRET_KEY`。
- **影响**：可通过通用环境变量名绕过凭证打印拦截，泄漏凭证到命令输出。
- **证据**：`evidence/D4-4/stdout.log`
- **状态**：待提单

## #8【P1】EXP-E01 serviceCatalog 中文意图"云主机"路由未命中

- **现象**：调用 `serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 返回 `MISS`，未路由到 ECS 服务，输出 "Run hcloud --help to list available services."。
- **断言**：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 应命中 ECS 服务（`services: ["ECS"]`），"云主机"是华为云 ECS 的常用中文术语。
- **根因**：`tools.mjs:1970-1983` — ECS 路由关键词列表为 `['ecs','server','vm','instance','compute','flavor','image','弹性云服务器','云服务器','服务器','虚拟机','镜像']`，缺少 `"云主机"`（华为云控制台常用术语）。
- **影响**：用户使用"云主机"描述 ECS 查询意图时，serviceCatalog 无法正确路由，导致 MCP 工具调用失败/降级。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单
