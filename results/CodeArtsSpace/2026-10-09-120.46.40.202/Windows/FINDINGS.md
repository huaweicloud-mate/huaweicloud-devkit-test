# FINDINGS — CodeArtsSpace Windows 每日测试 2026-10-09

> 被测版本：huaweicloud-devkit@1.1.8-next.1
> 客户端：CodeArtsSpace | OS：Windows | IP：120.46.40.202
> 执行时间：2026-10-09 05:08（北京时间）
> 测试报告：results/CodeArtsSpace/2026-10-09-120.46.40.202/Windows/CodeArtsSpace-GLM-5.2-测试报告.md

---

## #1【P0】D2-4 凭证脱敏大小写未覆盖

- **用例ID**：D2-4
- **维度**：D2认证
- **现象**：`redactSecrets('ak=AKIDxxx sk=Secretxxx')` 未将小写 `ak=`/`sk=` 脱敏，仅大写 `AK=`/`SK=` 脱敏正常
- **断言**：`redactSecrets` 应对大小写 `ak=`/`sk=`/`AK=`/`SK=` 均脱敏为 `<redacted>`
- **根因**：safety-policy.mjs:45 正则 `/(AK|SK)\s*[:=]/g` 缺少 i 标志，小写 ak/sk 不匹配
- **证据**：evidence/D2-4/stdout.log

## #2【P0】D2-11 STS get-token 未拦截

- **用例ID**：D2-11
- **维度**：D2认证
- **现象**：`sts get-token` 返回 decision=allow, risk=read_only，未拦截临时凭证获取
- **断言**：`sts get-token` 应返回 decision=deny
- **根因**：safety/rules/cloud-risk-rules.json:94 正则未覆盖 sts get-token; severity 为 warn 而非 deny
- **证据**：evidence/D2-11/stdout.log

## #3【P0】D4-2 非华为云前缀凭证env打印未拦截

- **用例ID**：D4-2
- **维度**：D4安全
- **现象**：非华为云前缀 env 打印返回 decision=allow, risk=not_huaweicloud
- **断言**：所有打印凭证环境变量的命令应返回 decision=deny
- **根因**：safety-policy.mjs 凭证 env 打印规则仅匹配 HUAWEICLOUD_/HW_ 前缀，未覆盖非标准前缀
- **证据**：evidence/D4-2/stdout.log

## #4【P0】D4-3 明文secret API CLI小写形式未拦截

- **用例ID**：D4-3
- **维度**：D4安全
- **现象**：`csms show-secret`/`kms decrypt-data` 返回 decision=allow
- **断言**：`csms show-secret`/`kms decrypt-data` 应返回 decision=deny
- **根因**：safety/policy.json:26 blockedSecretOperations 仅覆盖 PascalCase，未覆盖 CLI 小写形式
- **证据**：evidence/D4-3/stdout.log

## #5【P1】D2-16 configure import 未拦截

- **用例ID**：D2-16
- **维度**：D2认证
- **现象**：`configure import --file` 返回 decision=allow，未拦截凭证文件导入
- **断言**：`configure import --file` 应返回 decision=deny
- **根因**：safety/policy.json:25 blockedConfigureSubcommands 缺少 "import"
- **证据**：evidence/D2-16/stdout.log

## #6【P1】D4-4 通用凭证变量名 ACCESS_KEY 未拦截

- **用例ID**：D4-4
- **维度**：D4安全
- **现象**：`echo $ACCESS_KEY` 通用凭证变量名未被拦截
- **断言**：`echo $ACCESS_KEY` 应被拦截（decision=deny）
- **根因**：safety-policy.mjs 凭证 env 打印规则未覆盖 ACCESS_KEY/SECRET_KEY 通用变量名
- **证据**：evidence/D4-4/stdout.log

## #7【P1】D4-24 access_token 字段未脱敏

- **用例ID**：D4-24
- **维度**：D4安全
- **现象**：`redactSecrets({access_token: 'xxx'})` 未将 access_token 字段脱敏
- **断言**：`redactSecrets({access_token})` 应返回 `<redacted>`
- **根因**：safety-policy.mjs:25 isSecretKeyName 正则不匹配 access_token; policy.json:11 模式 "token" 经锚定后不匹配
- **证据**：evidence/D4-24/stdout.log

## #8【P1】EXP-E01 云主机→ECS serviceCatalog 路由未命中

- **用例ID**：EXP-E01
- **维度**：D10评测
- **现象**：serviceCatalog 对「帮我查一下我账号在华北北京四有哪些云主机」返回通用帮助，未命中 ECS
- **断言**：serviceCatalog 应将「云主机」路由到 ECS
- **根因**：mcp-server.mjs serviceCatalog 中文关键词「云主机」未映射到 ECS
- **证据**：evidence/EXP-E01/stdout.log
