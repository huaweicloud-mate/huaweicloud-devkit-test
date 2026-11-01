# FINDINGS - huaweicloud-devkit 每日测试缺陷清单

> **生成时间**: 2026-11-02
> **客户端**: CodeArtsAgent (testbot4-codearts1)
> **OS**: Windows
> **被测版本**: v1.1.13-next.0

## 缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因 | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D1-39 | Windows 升级检测链 spawnSync EINVAL | Windows 下 npm.cmd 检测链无 shell:true 时应正确工作，不得 EINVAL 静默失败 | 无 shell:true 时 spawnSync 返回 EINVAL 错误 | Node.js Windows spawnSync 行为差异 | 待提单 |
| 2 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `env` / `printenv` 命令应被风险规则引擎拦截 | 返回 `allow`，未拦截凭证环境变量打印 | risk-rule-engine.mjs 未覆盖 env 命令 | 待提单 |
| 3 | P0 | D4-16 | 命令包裹穿透防护不足 | `bash -c "hcloud ECS DeleteServer"` 应被拒绝 | 返回 `warn`，未拒绝 | 命令包裹检测规则不完整 | 待提单 |
| 4 | P0 | D4-21 | CreateServer 写操作未拦截 | `hcloud ECS CreateServer` 应被风险规则引擎拒绝 | 返回 `allow`，未拒绝 | 写操作分类规则缺失 | 待提单 |
| 5 | P0 | D4-22 | CreateVpc 写操作未拦截 | `hcloud VPC CreateVpc` 应被风险规则引擎拒绝 | 返回 `allow`，未拒绝 | 写操作分类规则缺失 | 待提单 |
| 6 | P1 | D3-A1 | skill 检索完整性不足 | 应有 >=20 个 skill 定义含 SKILL.md | 仅找到 7 个 skill (hdk:1, testRepo:6) | skill 目录结构变更 | 待提单 |

## 根因详情

### #1 [P0] D1-39 Windows 升级检测链 spawnSync EINVAL

- **期望**: Windows 下 npm.cmd 检测链无 shell:true 时应正确工作
- **实际**: 无 shell:true 时 spawnSync 返回 EINVAL 错误
- **根因**: Node.js Windows spawnSync 对 .cmd 文件需要 shell:true 选项
- **证据**: `evidence/D1-39/stdout.log`

### #2 [P0] D4-2 凭证 env 打印拦截不完整

- **期望**: `env` / `printenv` 命令应被风险规则引擎拦截
- **实际**: 返回 `allow`，未拦截凭证环境变量打印
- **根因**: risk-rule-engine.mjs 中 env 命令检测规则未覆盖 HW_ACCESS_KEY/SECRET_KEY 前缀
- **证据**: `evidence/D4-2/stdout.log`

### #3 [P0] D4-16 命令包裹穿透防护不足

- **期望**: `bash -c "hcloud ECS DeleteServer"` 应被拒绝
- **实际**: 返回 `warn`，未拒绝
- **根因**: 命令包裹检测规则未正确识别嵌套的 hcloud 命令
- **证据**: `evidence/D4-16/stdout.log`

### #4 [P0] D4-21 CreateServer 写操作未拦截

- **期望**: `hcloud ECS CreateServer` 应被风险规则引擎拒绝
- **实际**: 返回 `allow`，未拒绝
- **根因**: 写操作分类规则缺失 CreateServer 等 ECS 写操作
- **证据**: `evidence/D4-21/stdout.log`

### #5 [P0] D4-22 CreateVpc 写操作未拦截

- **期望**: `hcloud VPC CreateVpc` 应被风险规则引擎拒绝
- **实际**: 返回 `allow`，未拒绝
- **根因**: 写操作分类规则缺失 VPC 写操作
- **证据**: `evidence/D4-22/stdout.log`

### #6 [P1] D3-A1 skill 检索完整性不足

- **期望**: 应有 >=20 个 skill 定义含 SKILL.md
- **实际**: 仅找到 7 个 skill
- **根因**: skill 目录结构可能变更，部分 skill 未包含 SKILL.md
- **证据**: `evidence/D3-A1/stdout.log`
