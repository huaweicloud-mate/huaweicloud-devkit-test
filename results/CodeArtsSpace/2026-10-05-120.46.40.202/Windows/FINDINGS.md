# FINDINGS — CodeArtsSpace 每日测试缺陷清单
> 日期: 2026-10-05
> 客户端: CodeArtsSpace / GLM-5.2 / Windows
> 被测版本: huaweicloud-devkit@1.1.8-next.1 (gitHead ffd7b47)
> 执行归档: results/CodeArtsSpace/2026-10-05-120.46.40.202/Windows/

---

## FINDING-1: D2-4 小写 ak=/sk= 凭证未被脱敏

- **级别**: P0
- **用例**: D2-4 (凭证脱敏正确性)
- **描述**: redactString 正则仅匹配大写 AK/SK，小写 ak=/sk= 凭证未被脱敏
- **断言**: redactString('ak=AKIDTEST sk=SKTEST') 应返回脱敏后字符串，不含原始 AK/SK
- **实际**: 小写 ak=/sk= 未被脱敏
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs` redactString 正则仅匹配大写 AK/SK 模式
- **证据**: evidence/D2-4/stdout.log
- **历史单号**: #772 #694

---

## FINDING-2: D2-11 STS get-token 未被安全规则拦截

- **级别**: P0
- **用例**: D2-11 (R3 STS token拒绝落盘)
- **描述**: `hcloud iam sts get-token` 命令经 classifyTextCommand 判定为 allow，未被安全规则拦截
- **断言**: classifyTextCommand('hcloud iam sts get-token') 应返回 decision=deny/blocked
- **实际**: 返回 `{"decision":"allow","risk":"unknown_read"}`
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs` classifyTextCommand 未将 STS get-token 列入 blockedSecretOperations
- **证据**: evidence/D2-11/stdout.log
- **历史单号**: #689

---

## FINDING-3: D2-16 configure import --file 未被拦截

- **级别**: P1
- **用例**: D2-16 (import文件读取后擦除)
- **描述**: `hcloud iam configure import --file credentials.json` 命令经 classifyTextCommand 判定为 allow
- **断言**: classifyTextCommand 应对 configure import --file 返回 decision=deny/blocked
- **实际**: 返回 decision=allow
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs` classifyTextCommand 未覆盖 configure import --file 场景
- **证据**: evidence/D2-16/stdout.log
- **历史单号**: #694

---

## FINDING-4: D4-2 非华为云前缀凭证 env 打印未拦截

- **级别**: P0
- **用例**: D4-2 (凭证env打印拦截)
- **描述**: `echo $ACCESS_KEY` 命令经 classifyTextCommand 判定为 allow，通用凭证变量名未拦截
- **断言**: classifyTextCommand('echo $ACCESS_KEY') 应返回 decision=deny/blocked
- **实际**: 返回 `{"decision":"allow","risk":"not_huaweicloud"}`
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs` classifyTextCommand 仅匹配 HW_ 前缀，未覆盖通用 ACCESS_KEY 变量名
- **证据**: evidence/D4-2/stdout.log
- **历史单号**: #677

---

## FINDING-5: D4-3 CSMS/KMS 密钥操作未拦截

- **级别**: P0
- **用例**: D4-3 (明文secret API拦截)
- **描述**: `hcloud csms secret-show` 和 `hcloud kms decrypt` 命令经 classifyTextCommand 判定为 allow
- **断言**: classifyTextCommand 应对 csms secret-show / kms decrypt 返回 decision=deny/blocked
- **实际**: 返回 decision=allow
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs` classifyTextCommand 未将 csms/kms 密钥操作列入 blockedSecretOperations
- **证据**: evidence/D4-3/stdout.log
- **历史单号**: #677

---

## FINDING-6: D4-4 echo $ACCESS_KEY 通用凭证变量名未拦截

- **级别**: P1
- **用例**: D4-4 (写操作误判检测)
- **描述**: `echo $ACCESS_KEY` 通用凭证变量名未被安全规则拦截
- **断言**: classifyTextCommand 应拦截通用凭证变量名打印
- **实际**: 返回 `{"decision":"allow","risk":"not_huaweicloud"}`
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs` classifyTextCommand 通用凭证变量名匹配缺失
- **证据**: evidence/D4-4/stdout.log
- **历史单号**: #757

---

## FINDING-7: D4-24 access_token 字段未被脱敏

- **级别**: P1
- **用例**: D4-24 (确认令牌过期与重复确认边界)
- **描述**: access_token 字段未被 redactString 脱敏
- **断言**: redactSecrets({access_token}) 应返回 <redacted>
- **实际**: access_token 字段未被脱敏
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs` redactString 未覆盖 access_token 字段
- **证据**: evidence/D4-24/stdout.log
- **历史单号**: #805

---

## FINDING-8: EXP-E01 "云主机"→ECS serviceCatalog 路由 MISS

- **级别**: P1
- **用例**: EXP-E01 (serviceCatalog 路由)
- **描述**: 中文意图"查一下我的账号在华南有哪些云主机"经 serviceCatalog 路由未命中 ECS
- **断言**: serviceCatalog 应将"云主机"映射到 ECS 服务
- **实际**: 返回 "Run hcloud --help to list available services."（未命中）
- **根因**: `plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 中文关键词词典未包含"云主机"→ECS 映射
- **证据**: evidence/EXP-E01/stdout.log
- **历史单号**: #705
