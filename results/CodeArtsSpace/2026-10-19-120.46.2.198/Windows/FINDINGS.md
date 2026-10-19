# FINDINGS — 缺陷发现清单（CodeArtsSpace-GLM-5.2）

> **落盘路径**：`results/CodeArtsSpace/2026-10-19-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-10-19 18:35:00（北京时间）
> **本清单是统一提单脚本的解析输入**

---

## #1【P0】D4-16 命令包裹穿透未拦截

- **现象**：`powershell -Command "Get-Content credentials.json"` 经 MCP 工具分类返回 `allow`（`decision=allow, risk=not_huaweicloud`）
- **断言**：`classifyTextCommand('powershell -Command "Get-Content ~/.config/huaweicloud/credentials.json"').decision === 'deny'`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` `classifyTextCommand()` 对 `powershell -Command` 包裹的凭证文件路径未识别为敏感操作，`stripExecutable` 虽处理包裹但 `classifyTextCommand` 文本路径未递归剥离
- **影响**：攻击者可通过 `powershell -Command`/`cmd /c` 包裹绕过凭证文件读取拦截
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #2【P1】D4-27 双路径输出脱敏不完整

- **现象**：`redactSecrets({ak:'AKID123',sk:'SK1234567890abcdef',token:'STSTOKEN123'})` 原样返回 `{"ak":"AKID123","sk":"SK1234567890abcdef","token":"STSTOKEN123"}`
- **断言**：`redactSecrets({ak,sk,token})` 返回对象所有敏感字段值 === `'<redacted>'`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:57` `isSecretKeyName(key)` 未匹配 `ak`/`sk`/`token` 等短键名
- **影响**：含 ak/sk/token 的对象输出时凭证明文泄露
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #3【P1】D8-4 引导文档 INSTALL.md 未随 npm 包发布

- **现象**：npm 包 `huaweicloud-devkit@1.1.9` 内仅有 `README.md`、`README.zh-CN.md`，无 `INSTALL.md`
- **断言**：`existsSync(join(pkgRoot, 'INSTALL.md')) === true`
- **根因**：`package.json` `files` 字段未包含 `INSTALL.md`
- **影响**：用户安装后无引导文档可循
- **证据**：`evidence/D8-4/stdout.log`
- **状态**：待提单

## #4【P1】D8-9 安装 ID 与遥测值未脱敏

- **现象**：遥测值含凭证时 `AKIDTEST12345678` 原样输出
- **断言**：遥测上报值含 AK/SK 时应经 `redactSecrets` 脱敏为 `<redacted>`
- **根因**：遥测上报路径未调用 `redactSecrets`
- **影响**：遥测可能泄露凭证
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #5【P1】EXP-E01~E14 serviceCatalog 路由未命中（11 条 MISS）

- **现象**：15 条中文意图经 `huaweicloud_service_catalog` 路由，11 条返回 `MISS`（EXP-E01/E02/E03/E04/E05/E07/E10/E11/E12/E13/E14）
- **断言**：每条意图 `serviceCatalog(intent).matched === true`
- **根因**：`serviceCatalog` 路由表中文意图覆盖不全（基线 21.4% MISS）
- **影响**：用户中文意图无法路由到对应华为云工具
- **证据**：`evidence/EXP-E01/stdout.log` 等 11 份
- **状态**：待提单
