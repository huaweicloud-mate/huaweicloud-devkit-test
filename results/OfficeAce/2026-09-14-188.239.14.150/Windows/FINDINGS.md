# FINDINGS.md - 测试缺陷记录

## 缺陷 #1 [P0] D4-2: 凭证 env 打印拦截不完整

- **用例 ID**: D4-2
- **优先级**: P0
- **维度**: D4 安全
- **状态**: 待提单
- **发现时间**: 2026-09-14
- **客户端**: OfficeAce
- **OS**: Windows

### 描述
`hook_check_command` 对 `echo %HW_ACCESS_KEY% %HW_SECRET_ACCESS_KEY%` 命令返回 `allow`，
未拦截通过 echo 打印 HW_ 前缀环境变量的凭证泄露行为。

### 期望结果
`hook_check_command` 应返回 `deny`，阻止通过 echo/printenv 打印 `HW_ACCESS_KEY`、`HW_SECRET_ACCESS_KEY` 等凭证环境变量。

### 实际结果
返回 `decision: allow`，命令被允许执行。

### 根因分析
`safety-policy.mjs` 中 `classifyTextCommand()` 的 env-dump 检测正则可能仅覆盖 `HUAWEICLOUD`/`HWC_`/`HCLOUD`/`OS_` 前缀，
未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_ACCESS_KEY` 前缀。

### 复现步骤
1. 通过 MCP 调用 `huaweicloud_hook_check_command`
2. 传入命令: `echo %HW_ACCESS_KEY% %HW_SECRET_ACCESS_KEY%`
3. 观察返回值: `decision: allow`（应为 `deny`）

### 证据
- `evidence/D4-2/stdout.log`
