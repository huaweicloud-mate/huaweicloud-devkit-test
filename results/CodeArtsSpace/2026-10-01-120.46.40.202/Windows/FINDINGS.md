# FINDINGS — CodeArtsSpace Windows 2026-10-01 每日测试

> 客户端: CodeArtsSpace | OS: Windows | 模型: GLM-5.2 | 被测版本: 1.1.8-next.1
> 执行时间: 2026-10-01 05:15 BJT | 通过率: 133/141 = 94.3%

---

## #1【P0】D2-4 凭证脱敏大小写缺陷

- **现象**: redactString 的 secret regex 仅匹配大写 AK/SK 前缀，lowercase ak=/sk= 未被脱敏，明文泄漏
- **断言**: redactString('ak=AKIDxxx sk=Secretxxx') 应返回 'ak=<redacted> sk=<redacted>'，实际返回 'ak=AKIDxxx sk=Secretxxx'
- **根因**: safety-policy.mjs redactString 函数，secret regex (AK|SK)\s*[:=] 仅匹配大写，未用 case-insensitive flag
- **证据**: evidence/D2-4/stdout.log (lowerRedacted=false, lowerLeaksAk=true, lowerLeaksSk=true)

## #2【P0】D2-11 STS token 获取未拦截

- **现象**: classifyTextCommand 将 sts get-token 判为 read_only allow，但 STS token 是临时凭证获取操作
- **断言**: classifyTextCommand('sts get-token').decision 应为 'deny'，实际为 'allow'
- **根因**: safety-policy.mjs classifyTextCommand，sts get-token 未列入 blockedSecretOp / blockedWriteOp
- **证据**: evidence/D2-11/stdout.log (decision=allow, risk=read_only)

## #3【P0】D4-2 HW_ env-dump 未完全拦截

- **现象**: env|grep HW_ 模式未完全匹配安全规则，r3=allow not_huaweicloud
- **断言**: env|grep HW_ 应全部 deny，实际 r3=allow（HW_ 前缀 env var grep 未覆盖）
- **根因**: safety-policy.mjs，env|grep 模式未纳入 blockedSecretOperation 的 credential env dump 规则
- **证据**: evidence/D4-2/stdout.log (r3 decision=allow, risk=not_huaweicloud)

## #4【P0】D4-3 明文 secret API 读取未拦截

- **现象**: csms show-secret / kms decrypt-data / kms DecryptData / kms decrypt / csms show-secret-version 均判 allow
- **断言**: 以上 5 条命令应全部 deny（secret/明文读取），实际全部 allow
- **根因**: safety-policy.mjs classifyTextCommand，csms show-secret 判 read_only、kms decrypt 判 unknown_read，均未列入 blockedSecretOp
- **证据**: evidence/D4-3/stdout.log (5 条全 allow)

## #5【P1】D2-16 configure import --file 未拦截

- **现象**: classifyTextCommand 将 configure import --file creds.json 判为 unknown_read allow
- **断言**: configure import --file 应 deny 或 require approval（凭证文件导入可能明文落盘），实际 allow
- **根因**: safety-policy.mjs classifyTextCommand，'import' 未列入 blockedConfigurSubcommands
- **证据**: evidence/D2-16/stdout.log (decision=allow, risk=unknown_read)

## #6【P1】D4-4 echo creds 未拦截

- **现象**: echo $AK / echo $SK 判 not_huaweicloud allow，凭证回显未拦截
- **断言**: echo $AK / echo $SK 应 deny（凭证回显），实际 allow
- **根因**: safety-policy.mjs，echo 命令未检测 $AK/$SK 环境变量引用
- **证据**: evidence/D4-4/stdout.log (r1/r2 decision=allow, risk=not_huaweicloud)

## #7【P1】D4-24 access_token 未脱敏

- **现象**: redactString 未将 access_token 纳入 secret regex，输出 access_token=accxxx 明文
- **断言**: redactString 应脱敏 access_token，实际 access_token=accxxx 明文输出
- **根因**: safety-policy.mjs redactString，secret regex 未包含 access_token 模式
- **证据**: evidence/D4-24/stdout.log (access_token=accxxx 未脱敏)

## #8【P1】EXP-E01 serviceCatalog 中文意图路由 MISS

- **现象**: serviceCatalog 对中文意图"帮我查一下我账号在华北北京四有哪些云主机"路由 MISS
- **断言**: serviceCatalog 应路由到 ECS 服务，实际返回 "Run hcloud --help to list available services."
- **根因**: tools.mjs serviceCatalog，中文意图"云主机"未映射到 ECS 服务别名
- **证据**: evidence/EXP-E01/stdout.log (verdict=MISS, expect=ECS, got=hcloud --help)
