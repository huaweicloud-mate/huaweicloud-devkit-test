# FINDINGS — OfficeAce Windows 每日测试 2026-10-13

> 被测版本：huaweicloud-devkit@1.1.8-next.2
> 客户端：OfficeAce | OS：Windows | 执行时间：2026-10-13

---

## FINDING-1: D2-4 凭证脱敏正确性 (P0)

- **级别**：P0
- **描述**：redactSecrets 对 JSON 对象中 AK/SK 字段未完全脱敏
- **断言**：redactSecrets(`{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234"}`) 应返回 `{"ak":"<redacted>","sk":"<redacted>"}`
- **根因**：safety-policy.mjs redactSecrets 函数对嵌套 JSON 对象字段覆盖不全
- **证据**：evidence/D2-4/stdout.log

## FINDING-2: D3-C14 沙箱 HDKit 服务参数与 hwlink 凭证 (P2)

- **级别**：P2
- **描述**：clearRuntimeCredentials 后 resolveCredentials 回退到文件凭证而非抛 HDKIT_CRED_MISSING
- **断言**：clearRuntimeCredentials() → resolveCredentials() 应抛 HDKIT_CRED_MISSING
- **根因**：credentials.mjs resolveCredentialsWithRuntime 在 runtime 清空后回退到文件凭证
- **证据**：evidence/D3-C14/stdout.log

## FINDING-3: D4-27 双路径输出脱敏 (P1)

- **级别**：P1
- **描述**：redactSecrets 双路径（stdout+stderr）输出中 AK/SK/token 未脱敏
- **断言**：redactSecrets 应对 stdout 和 stderr 双路径输出中的 AK/SK/token 均替换为 `<redacted>`
- **根因**：safety-policy.mjs redactSecrets 仅覆盖单路径，双路径输出未处理
- **证据**：evidence/D4-27/stdout.log

## FINDING-4: D8-9 安装 ID 与遥测值脱敏 (P2)

- **级别**：P2
- **描述**：sanitizeValue 对 AK 格式字符串未脱敏
- **断言**：sanitizeValue("AKIDTEST12345678") 应返回 `<redacted>`
- **根因**：telemetry.mjs sanitizeValue 函数未匹配 AKID 前缀模式
- **证据**：evidence/D8-9/stdout.log

## FINDING-5: EXP-E01~E14 serviceCatalog 路由 MISS (P1×11)

- **级别**：P1
- **描述**：serviceCatalog 对评测集 15 条中文意图中 11 条路由未命中对应华为云服务
- **断言**：serviceCatalog 应对 eval/prompts/eval-set-v1.csv 中每条中文意图返回对应华为云服务路由
- **根因**：tools.mjs serviceCatalog routeMap 对部分中文意图匹配规则覆盖不足
- **证据**：evidence/EXP-E01~E14/stdout.log
- **MISS 用例**：EXP-E01, EXP-E02, EXP-E03, EXP-E04, EXP-E05, EXP-E07, EXP-E10, EXP-E11, EXP-E12, EXP-E13, EXP-E14
