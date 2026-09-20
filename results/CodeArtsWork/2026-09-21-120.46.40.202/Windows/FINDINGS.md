# FINDINGS — CodeArtsWork Windows 每日测试 2026-09-21

## F-001 | D4-2 | P0 | FAIL

- **级别**: P0
- **描述**: `echo $HUAWEICLOUD_SECRET_ACCESS_KEY` 未被安全策略拦截，凭证 env 打印存在缺口
- **断言**: `classifyTextCommand('echo $HUAWEICLOUD_SECRET_ACCESS_KEY').decision === 'deny'`
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs:418` — 正则 `(?:ACCESS_KEY|SECRET_KEY|SECURITY_TOKEN)` 缺少 `SECRET_ACCESS_KEY` 变体，AWS 风格环境变量名 `HUAWEICLOUD_SECRET_ACCESS_KEY` 未覆盖
- **证据**: `evidence/D4-2/stdout.log`
- **修复建议**: 在 safety-policy.mjs:418 正则中增加 `SECRET_ACCESS_KEY` 作为备选匹配项

## F-002 | D4-3 | P0 | FAIL

- **级别**: P0
- **描述**: `hcloud KMS ShowSecret` 未被安全策略拦截，明文 secret API 拦截存在缺口
- **断言**: `classifyTextCommand('hcloud KMS ShowSecret').decision === 'deny'`
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs:432` — 正则 `ShowSecretVersion|GetSecretValue|secret_string|secret_binary` 未覆盖 `KMS ShowSecret`（KMS 密钥查询 API）
- **证据**: `evidence/cred-group/stdout.log`
- **修复建议**: 在 safety-policy.mjs:432 正则中增加 `ShowSecret` 或 `KMS.*Secret` 匹配模式

## F-003 | D4-23 | P0 | FAIL

- **级别**: P0
- **描述**: 全局规则文件 `huawei-agent-rules.mdc` 未包含在 npm 包中，11 个安装目标无法注入规则
- **断言**: `existsSync(pkgBase + '/rules/huawei-agent-rules.mdc') === true`
- **根因**: `package.json:files` 字段未包含 `"rules/"` 目录，npm publish 不打包规则文件
- **证据**: `evidence/D4-23/stdout.log`
- **修复建议**: 在 package.json `files` 数组中添加 `"rules"` 或 `"rules/huawei-agent-rules.mdc"`

## F-004 | D10-3 / EXP-E01~E15 | P1 | FAIL

- **级别**: P1
- **描述**: serviceCatalog 中文意图路由准确率仅 21.4%（3 HIT / 14 可判定），11 条 MISS + 1 条 N/A
- **断言**: `evalHarness accuracy >= 80%`（当前 21.4%）
- **根因**: `plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 路由层对中文意图识别覆盖不足，多数服务意图未命中正确路由
- **证据**: `evidence/D10-3-eval/stdout.log`
- **MISS 用例**: EXP-E01(ECS查询), EXP-E02(ECS创建), EXP-E03(OBS部署), EXP-E04(EIP), EXP-E05(RDS查询), EXP-E07(CBR), EXP-E10(FunctionGraph), EXP-E11(BSS费用), EXP-E12(CES), EXP-E13(ELB证书), EXP-E14(IAM审计)
- **N/A 用例**: EXP-E08(ECS排障 — 诊断路由未支持)
- **修复建议**: 扩展 serviceCatalog 中文意图匹配规则，增加服务关键词同义词映射
