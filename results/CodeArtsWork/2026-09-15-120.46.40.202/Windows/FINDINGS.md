# FINDINGS — CodeArtsWork Windows 2026-09-15

> 本轮测试无 FAIL / SPEC-MISMATCH 缺陷。

## 缺陷清单

无。

## BLOCKED 用例（环境阻塞，非缺陷）

| 用例ID | 优先级 | blockedReason |
|---|---|---|
| D4-3 | P0 | 无 AK/SK，需真云账号调用返回明文/二进制secret的API |
| D2-11 | P0 | 无 AK/SK，需真云 AK/SK + securityToken 测 auth_switch STS token 拒绝落盘 |
| D2-1 | P1 | 无 AK/SK，需真云凭证测 auth init 三端同步 |
| D2-16 | P1 | 无 AK/SK，需真云凭证文件测 auth_switch import 读取后擦除 |

## 环境观察点（非缺陷，供维护者参考）

1. MCP server safety rules 路径不匹配（`.codeartsdoer` vs `.codeartswork`），已手动复制修复
2. MCP retrieve_skill/search_docs 技能目录路径不匹配，技能检索返回空；已改用直接读 SKILL.md 验证