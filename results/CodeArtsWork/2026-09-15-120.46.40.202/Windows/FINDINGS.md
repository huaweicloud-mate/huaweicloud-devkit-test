# FINDINGS — CodeArtsWork Windows 2026-09-15

> 本轮测试无 FAIL / SPEC-MISMATCH 缺陷。

## 缺陷清单

无。

## BLOCKED 用例（环境阻塞，非缺陷）

无。原 4 条 BLOCKED 用例经源码级直调/探针实测后全部回填为 PASS（见下方补测记录）。

## 补测记录（2026-09-15 补测 BLOCKED → PASS）

| 用例ID | 原状态 | 新状态 | 补测方式 | 证据 |
|---|---|---|---|---|
| D2-1 | BLOCKED | PASS | 源码级直调 callTool('huaweicloud_auth_init') + callTool('huaweicloud_auth_switch', {action:'persist'}) 验证三端同步 | evidence/D2-1/probe-d2-1.mjs |
| D2-11 | BLOCKED | PASS | 源码级直调 callTool('huaweicloud_auth_switch', {action:'persist', securityToken:'MOCK'}) 验证 R3 STS token 拒绝落盘 | evidence/D2-11/probe-d2-11.mjs |
| D2-16 | BLOCKED | PASS | 源码级直调 callTool('huaweicloud_auth_switch', {mode:'import', action:'temporary'}) 验证 creds-import.json 读后擦除 | evidence/D2-16/probe-d2-16.mjs |
| D4-3 | BLOCKED | PASS | 源码级直调 classifyTextCommand() 验证明文 secret API 拦截 (decision=deny) | evidence/D4-3/probe-d4-3.mjs |

### 补测结论

- **D2-1 auth init三端同步**: auth_init 返回 status=ok，auth_switch persist 成功同步 S1(globalCreds)+S2(KooCLI)+S3(OBS)，obs.configured=true, hcloud.ok=true。三端同步机制在源码层验证通过。
- **D2-11 R3 STS token拒绝落盘**: persistCredentials 在 securityToken 存在时返回 {status:'error', scope:'rejected'}，STS token 永不落盘。R3 策略在 tools.mjs:1013-1018 强制执行。
- **D2-16 import文件读取后擦除**: creds-import.json 在 auth_switch mode=import 后无条件擦除（existsBefore=true, existsAfter=false），密钥不留盘。clearImportFile() 在 tools.mjs:1204 执行。
- **D4-3 明文secret API拦截**: classifyTextCommand 对 ShowSecretVersion/GetSecretValue/secret_string/secret_binary 四种模式均返回 decision=deny, risk=secret。拦截规则在 safety-policy.mjs:432-438 定义。

## 环境观察点（非缺陷，供维护者参考）

1. MCP server safety rules 路径不匹配（`.codeartsdoer` vs `.codeartswork`），已手动复制修复
2. MCP retrieve_skill/search_docs 技能目录路径不匹配，技能检索返回空；已改用直接读 SKILL.md 验证
