# FINDINGS — CodeArtsWork Windows 每日测试 2026-09-21

## #1【P0】D4-2 凭证env打印拦截缺口 (HUAWEICLOUD_SECRET_ACCESS_KEY)

- **级别**: P0
- **现象**: `echo $HUAWEICLOUD_SECRET_ACCESS_KEY` 未被安全策略拦截，返回 allow 而非 deny
- **断言**: `classifyTextCommand('echo $HUAWEICLOUD_SECRET_ACCESS_KEY').decision === 'deny'`
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs:418` — 正则 `(?:ACCESS_KEY|SECRET_KEY|SECURITY_TOKEN)` 缺少 `SECRET_ACCESS_KEY` 变体，AWS 风格环境变量名 `HUAWEICLOUD_SECRET_ACCESS_KEY` 未覆盖
- **影响**: 攻击者可通过 `echo $HUAWEICLOUD_SECRET_ACCESS_KEY` 绕过凭证 env 打印拦截，泄露 STS token
- **证据**: `evidence/D4-2/stdout.log`

## #2【P0】D4-3 明文secret API拦截缺口 (KMS ShowSecret)

- **级别**: P0
- **现象**: `hcloud KMS ShowSecret` 未被安全策略拦截，返回 allow 而非 deny
- **断言**: `classifyTextCommand('hcloud KMS ShowSecret').decision === 'deny'`
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs:432` — 正则 `ShowSecretVersion|GetSecretValue|secret_string|secret_binary` 未覆盖 `KMS ShowSecret`（KMS 密钥查询 API）
- **影响**: 攻击者可通过 `hcloud KMS ShowSecret` 直接读取 KMS 密钥明文
- **证据**: `evidence/cred-group/stdout.log`

## #3【P0】D4-23 全局规则文件未打包进 npm

- **级别**: P0
- **现象**: `huawei-agent-rules.mdc` 存在于源码 `rules/` 目录但未包含在 npm 包中，11 个安装目标无法注入规则
- **断言**: `existsSync(pkgBase + '/rules/huawei-agent-rules.mdc') === true`
- **根因**: `package.json:files` 字段未包含 `"rules/"` 目录，npm publish 不打包规则文件
- **影响**: 所有已安装客户端无法加载全局安全规则，MUST 约束（禁直连 csms/kms）不生效
- **证据**: `evidence/D4-23/stdout.log`

## #4【P1】D10-3 serviceCatalog 中文意图路由准确率仅 21.4%

- **级别**: P1
- **现象**: serviceCatalog 中文意图路由 15 条评测集中仅 3 条 HIT（21.4%），11 条 MISS + 1 条 N/A
- **断言**: `evalHarness accuracy >= 80%`（当前 21.4%）
- **根因**: `plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 路由层对中文意图识别覆盖不足，多数服务意图未命中正确路由
- **影响**: Agent 无法正确路由中文云服务请求，导致错误工具调用或无法响应
- **证据**: `evidence/D10-3-eval/stdout.log`
- **MISS 用例**: EXP-E01(ECS查询), EXP-E02(ECS创建), EXP-E03(OBS部署), EXP-E04(EIP), EXP-E05(RDS查询), EXP-E07(CBR), EXP-E10(FunctionGraph), EXP-E11(BSS费用), EXP-E12(CES), EXP-E13(ELB证书), EXP-E14(IAM审计)
- **N/A 用例**: EXP-E08(ECS排障 — 诊断路由未支持)
