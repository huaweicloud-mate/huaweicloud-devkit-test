# FINDINGS — 缺陷发现清单（CodeArtsSpace-GLM-5.2）

> **落盘路径**：`results/CodeArtsSpace/2026-10-07-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：2026-10-07 05:11:30（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.8-next.1
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】D2-4 凭证脱敏正则未覆盖小写 ak/sk

- **现象**：redactString 输入 `ak=AKIDTEST1234567890 sk=SKTEST1234567890abcdef`，小写 ak/sk 未被脱敏，明文凭证残留输出。
- **断言**：redactString 对 `ak=`/`sk=`（小写）输入应脱敏为 `ak=***`/`sk=***`，输出不含明文 AK/SK。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` 正则 `/(AK|SK)\s*[:=]/g` 缺少 `i` 标志，仅匹配大写 AK/SK，小写 ak/sk 不匹配。
- **影响**：小写凭证变量名场景下明文凭证泄漏到日志/输出，违反脱敏红线。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D2-11 STS get-token 未拦截临时凭证获取

- **现象**：`hcloud STS GetSecurityToken` 返回 decision=allow, risk=read_only，未拦截临时凭证获取操作。
- **断言**：STS get-token 应返回 decision:deny（临时凭证获取属高危操作，应拦截）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:94` 正则未覆盖 `sts get-token`，severity 为 warn 而非 deny。
- **影响**：攻击者可获取临时凭证绕过静态凭证管控。
- **证据**：`evidence/D2-11/stdout.log`
- **状态**：待提单

## #3【P0】D4-2 凭证env打印拦截未覆盖非华为云前缀

- **现象**：echo $HW_SECRET_KEY 被拦截(decision:deny)，但非华为云前缀凭证变量（如 $SECRET_KEY）打印返回 decision=allow, risk=not_huaweicloud。
- **断言**：所有凭证 env 打印应返回 decision:deny，不论前缀。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` 凭证 env 打印规则仅匹配 HUAWEICLOUD_/HW_ 前缀，未覆盖非标准前缀。
- **影响**：非标准前缀凭证变量明文打印泄漏。
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：待提单

## #4【P0】D4-3 密钥服务操作未拦截 CLI 小写命令

- **现象**：`hcloud CSMS ShowSecret` 被拦截，但 `hcloud csms show-secret`/`kms decrypt-data`（CLI 小写）返回 decision=allow，密钥服务操作未拦截。
- **断言**：csms show-secret/kms decrypt-data 应返回 decision:deny（密钥服务操作属高危，应拦截）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26` blockedSecretOperations 仅覆盖 PascalCase，未覆盖 CLI 小写 show-secret/decrypt-data。
- **影响**：CLI 小写密钥操作绕过拦截，密钥明文可读。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #5【P1】D2-16 configure import --file 未拦截凭证文件导入

- **现象**：`hcloud configure import --file creds.json` 返回 decision=allow, risk=unknown_read，未拦截凭证文件导入操作。
- **断言**：configure import --file 应返回 decision:deny（凭证文件导入属高危操作，应拦截）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:25` blockedConfigureSubcommands 缺少 'import'。
- **影响**：凭证文件可被导入到非受控位置。
- **证据**：`evidence/D2-16/stdout.log`
- **状态**：待提单

## #6【P1】D4-4 通用凭证变量名 ACCESS_KEY/SECRET_KEY 未拦截

- **现象**：echo $ACCESS_KEY 返回 decision=allow, risk=not_huaweicloud，通用凭证变量名未拦截。
- **断言**：echo $ACCESS_KEY 应返回 decision:deny（通用凭证变量名应拦截）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` 凭证打印拦截仅匹配华为云特定变量名（HW_ACCESS_KEY/HW_SECRET_KEY），未覆盖 ACCESS_KEY/SECRET_KEY。
- **影响**：通用凭证变量名明文打印泄漏。
- **证据**：`evidence/D4-4/stdout.log`
- **状态**：待提单

## #7【P1】D4-24 access_token 字段未被 redactSecrets 脱敏

- **现象**：redactSecrets({access_token: 'xxx'}) 返回 {access_token: 'xxx'}，access_token 字段未被脱敏，明文 token 泄漏。
- **断言**：redactSecrets({access_token}) 应返回 {access_token: '<redacted>'}。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:25` isSecretKeyName 正则将 access_token 归一化为 accesstoken，不匹配 access.*key；`policy.json:11` 模式 token 经锚定不匹配 access_token。
- **影响**：access_token 字段明文泄漏到日志/输出。
- **证据**：`evidence/D4-24/stdout.log`
- **状态**：待提单

## #8【P1】EXP-E01 serviceCatalog 中文意图"查云主机"未命中 ECS

- **现象**：eval harness 输入"帮我查一下我账号在华北北京四有哪些云主机"，serviceCatalog 路由至 'Run hcloud --help to list available services.'，未命中 ECS。
- **断言**：serviceCatalog 应路由至 ECS 工具集（HIT）。
- **根因**：`eval/harness/run-eval.mjs` serviceCatalog 中文意图路由未命中 ECS，返回通用 help 提示。路由关键词未覆盖"查云主机/查ECS"等中文表述。
- **影响**：用户查 ECS 实例时无法自动路由到正确工具，需手动指定。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单
