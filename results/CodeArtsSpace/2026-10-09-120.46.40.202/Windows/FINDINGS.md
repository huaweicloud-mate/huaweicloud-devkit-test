# FINDINGS — CodeArtsSpace 每日测试缺陷清单

> **执行日期**：2026-10-09
> **客户端**：CodeArtsSpace (GLM-5.2)
> **OS**：Windows
> **被测版本**：1.1.8-next.1
> **执行归档**：`results/CodeArtsSpace/2026-10-09-120.46.40.202/Windows/`

---

## FINDING-1: D2-11 (P0) STS get-token 未拦截

- **级别**：P0
- **用例ID**：D2-11
- **维度**：D2认证
- **描述**：R3 STS token 拒绝落盘——期望 STS get-token 返回 decision:deny，实际返回 decision=allow, risk=read_only
- **断言**：classifyTextCommand("hcloud sts get-token") 返回 {decision: "deny"}
- **根因**：safety/rules/cloud-risk-rules.json:94 正则未覆盖 sts get-token, severity 为 warn 而非 deny
- **证据**：evidence/D2-11/stdout.log

## FINDING-2: D2-16 (P1) configure import --file 未拦截

- **级别**：P1
- **用例ID**：D2-16
- **维度**：D2认证
- **描述**：import 文件读取后擦除——期望 configure import --file 返回 decision:deny，实际返回 decision=allow, risk=unknown_read
- **断言**：classifyTextCommand("hcloud configure import --file creds.json") 返回 {decision: "deny"}
- **根因**：safety/policy.json:25 blockedConfigureSubcommands 缺少 'import'
- **证据**：evidence/D2-16/stdout.log

## FINDING-3: D2-4 (P0) 凭证脱敏大小写未覆盖

- **级别**：P0
- **用例ID**：D2-4
- **维度**：D2认证
- **描述**：凭证脱敏正确性——期望 redactString 大小写均脱敏，实际小写 ak=/sk= 未被脱敏
- **断言**：redactString("ak=ABCDEFG\nsk=HIJKLMN") 返回脱敏后字符串（不含明文）
- **根因**：safety-policy.mjs:45 正则 /(AK|SK)\s*[:=]/g 缺少 i 标志, 小写 ak/sk 不匹配
- **证据**：evidence/D2-4/stdout.log

## FINDING-4: D4-2 (P0) 非华为云前缀凭证env打印未拦截

- **级别**：P0
- **用例ID**：D4-2
- **维度**：D4安全
- **描述**：凭证env打印拦截——期望 echo $HW_SECRET_KEY 被阻断(decision:deny)，实际返回 decision=allow, risk=not_huaweicloud
- **断言**：classifyTextCommand("echo $HW_SECRET_KEY") 返回 {decision: "deny"}
- **根因**：safety-policy.mjs 凭证env打印规则仅匹配 HUAWEICLOUD_/HW_ 前缀, 未覆盖非标准前缀
- **证据**：evidence/D4-2/stdout.log

## FINDING-5: D4-3 (P0) 密钥服务操作未拦截

- **级别**：P0
- **用例ID**：D4-3
- **维度**：D4安全
- **描述**：明文secret API拦截——期望 hcloud CSMS/KMS 密钥操作被阻断(decision:deny)，实际返回 decision=allow
- **断言**：classifyTextCommand("hcloud csms show-secret") 返回 {decision: "deny"}
- **根因**：safety/policy.json:26 blockedSecretOperations 仅覆盖 PascalCase, 未覆盖 CLI 小写 show-secret/decrypt-data
- **证据**：evidence/D4-3/stdout.log

## FINDING-6: D4-4 (P1) 通用凭证变量名未拦截

- **级别**：P1
- **用例ID**：D4-4
- **维度**：D4安全
- **描述**：写操作审批门——期望 echo $ACCESS_KEY 返回 decision:deny，实际返回 decision=allow, risk=not_huaweicloud
- **断言**：classifyTextCommand("echo $ACCESS_KEY") 返回 {decision: "deny"}
- **根因**：safety-policy.mjs 凭证打印拦截仅匹配华为云特定变量名, 未覆盖 ACCESS_KEY/SECRET_KEY
- **证据**：evidence/D4-4/stdout.log

## FINDING-7: D4-24 (P1) access_token 字段未脱敏

- **级别**：P1
- **用例ID**：D4-24
- **维度**：D4安全
- **描述**：确认令牌过期与重复确认边界——期望 redactSecrets({access_token}) 返回 {access_token:<redacted>}，实际 access_token 字段未被脱敏
- **断言**：redactSecrets({access_token: "xxx"}) 返回 {access_token: "<redacted>"}
- **根因**：safety-policy.mjs:25 isSecretKeyName 正则将 access_token 归一化为 accesstoken, 不匹配 access.*key; policy.json:11 模式 token 经锚定不匹配 access_token
- **证据**：evidence/D4-24/stdout.log

## FINDING-8: EXP-E01 (P1) serviceCatalog ECS 路由未命中

- **级别**：P1
- **用例ID**：EXP-E01
- **维度**：D10评测
- **描述**：serviceCatalog routes -> ECS matched——期望 serviceCatalog 路由命中 ECS，实际 MISS（路由至 'Run hcloud --help'）
- **断言**：serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机") 返回 {intent: "list_ecs", tool: "huaweicloud_ecs_*"}
- **根因**：eval/harness/run-eval.mjs: serviceCatalog 中文意图'帮我查一下我账号在华北北京四有哪些云主机'未命中 ECS, 返回通用 help 提示
- **证据**：evidence/EXP-E01/stdout.log
