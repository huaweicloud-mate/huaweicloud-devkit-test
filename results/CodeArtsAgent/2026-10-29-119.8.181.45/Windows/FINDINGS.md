# FINDINGS 每日测试缺陷清单

## D4-19 确认流下预检仍生效

| 项 | 值 |
|---|---|
| 级别 | P0 |
| 用例ID | D4-19 |
| 缺陷类型 | FAIL |
| 描述 | approvedByUser=true 但 token 无效时未被正确拦截 |
| 断言 | approvedByUser=true 但 token 无效应返回 Invalid or expired approval token 错误 |
| 实际 | threw=false, errMsg='' 未抛出预期错误 |
| 根因 | hcloud-cli.mjs consumeApprovalToken 函数未正确处理无效 token |
| 证据 | evidence/D4-19/stdout.txt |

### 复现步骤
1. 调用 planHcloudCommand 生成有效 token
2. 使用无效 token 'invalid-token-12345678' 调用 run_approved_command
3. 预期: 抛出 'Invalid or expired approval token' 错误
4. 实际: 未抛出错误，命令执行成功
