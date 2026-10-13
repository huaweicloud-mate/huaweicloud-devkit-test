# FINDINGS — OfficeAce-glm-5.2 缺陷发现清单

> **落盘路径**：`results/OfficeAce/2026-10-13-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-13 10:10:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.8-next.2

---

## #1【P0】D2-4 凭证脱敏正确性

- **现象**：redactSecrets 对 JSON 对象 `{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234"}` 未完全脱敏，AK/SK 原样输出
- **断言**：redactSecrets 应将 JSON 对象中所有 AK/SK 字段值替换为 `<redacted>`
- **根因**：`safety-policy.mjs` redactSecrets 函数对嵌套 JSON 对象字段覆盖不全
- **影响**：凭证可能在日志/输出中泄漏
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P2】D3-C14 沙箱 HDKit 服务参数与 hwlink 凭证

- **现象**：clearRuntimeCredentials 后 resolveCredentials 返回文件凭证 ak=HSTAD5M13VETCS4E6SB3 而非抛错
- **断言**：clearRuntimeCredentials() → resolveCredentials() 应抛 HDKIT_CRED_MISSING
- **根因**：`credentials.mjs` resolveCredentialsWithRuntime 在 runtime 清空后回退到文件凭证而非抛错
- **影响**：凭证泄漏风险，runtime 清空后仍可访问文件凭证
- **证据**：`evidence/D3-C14/stdout.log`
- **状态**：待提单

## #3【P1】D4-27 双路径输出脱敏

- **现象**：redactSecrets 对 stdout+stderr 双路径输出中 AK/SK/token 未脱敏，`{"ak":"AKID123","sk":"SK1234567890abcdef","token":"STSTOKEN1..."}` 原样输出
- **断言**：redactSecrets 应对 stdout 和 stderr 双路径输出中的 AK/SK/token 均替换为 `<redacted>`
- **根因**：`safety-policy.mjs` redactSecrets 仅覆盖单路径，双路径输出未处理
- **影响**：凭证可能在 stderr 输出中泄漏
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #4【P2】D8-9 安装 ID 与遥测值脱敏

- **现象**：sanitizeValue 对 AK 格式字符串 "AKIDTEST12345678" 返回原值，sanitize=false
- **断言**：sanitizeValue("AKIDTEST12345678") 应返回 `<redacted>`
- **根因**：`telemetry.mjs` sanitizeValue 函数未匹配 AKID 前缀模式
- **影响**：AK 可能在遥测数据中泄漏
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #5【P1】EXP-E01~E14 serviceCatalog 路由 MISS

- **现象**：serviceCatalog 对评测集 15 条中文意图中 11 条路由未命中（EXP-E01,E02,E03,E04,E05,E07,E10,E11,E12,E13,E14）
- **断言**：serviceCatalog 应对 eval/prompts/eval-set-v1.csv 中每条中文意图返回对应华为云服务路由
- **根因**：`tools.mjs` serviceCatalog routeMap 对部分中文意图匹配规则覆盖不足
- **影响**：用户中文意图无法正确路由到对应华为云服务
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单
