# FINDINGS - CodeArtsAgent Windows 每日测试

> 发现时间：2026-10-10
> 客户端：CodeArtsAgent
> OS：Windows

## 缺陷清单

## #1【P0】D2-11 R3 STS token拒绝落盘逻辑缺失

- **现象**：mcp-server.mjs 中未找到 STS token 拒绝落盘的相关逻辑
- **断言**：auth_switch persist + securityToken 应返回 {status:error, scope:rejected}，token 永不落盘
- **根因**：`mcp-server.mjs` 中未找到相关代码，需检查 auth_switch 实现
- **证据**：`evidence/D2-11/stdout.log`

## #2【P0】D4-18 confirm-not-deny审批语义缺失

- **现象**：safety-policy.mjs 中未找到 confirm/deny 审批语义相关逻辑
- **断言**：写操作需显式确认，不被直接拒绝也不被直接放行
- **根因**：`safety-policy.mjs` 中未找到 permissionDecision 相关代码
- **证据**：`evidence/D4-18/stdout.log`

## #3【P0】D4-19 确认流下预检仍生效逻辑缺失

- **现象**：safety-policy.mjs 中未找到预检(preflight)相关逻辑
- **断言**：确认流程中风险预检仍生效拦截
- **根因**：`safety-policy.mjs` 中未找到 preCheck/preflight 相关代码
- **证据**：`evidence/D4-19/stdout.log`

## #4【P0】D9-13 tools/call 凭证不泄露与权限校验缺失

- **现象**：mcp-server.mjs 中凭证脱敏和权限校验逻辑不完整
- **断言**：tools/call 返回不含 AK/SK/token 明文；权限校验 deny/warn/allow 三态正确
- **根因**：`mcp-server.mjs` 中 redact/permission 相关代码缺失
- **证据**：`evidence/D9-13/stdout.log`

## #5【P1】D1-3 doctor健康自检命令缺失

- **现象**：hcloud-cli.mjs 中未找到 doctor 命令实现
- **断言**：doctor 命令应能检测组件状态并给出修复指引
- **根因**：`hcloud-cli.mjs` 中未找到 doctor 相关代码
- **证据**：`evidence/D1-3/stdout.log`

## #6【P1】D1-26 升级提醒工具注册与协议暴露缺失

- **现象**：mcp-server.mjs 中未找到 check_update/upgrade 工具注册
- **断言**：tools/list 应返回 huaweicloud_check_update / huaweicloud_upgrade 两工具
- **根因**：`mcp-server.mjs` 中未找到相关工具注册代码
- **证据**：`evidence/D1-26/stdout.log`

## #7【P1】D2-1 auth init三端同步逻辑缺失

- **现象**：mcp-server.mjs 中未找到 auth init 三端同步相关逻辑
- **断言**：auth init 应同步 AK/SK 到 KooCLI、OBS、沙箱三端
- **根因**：`mcp-server.mjs` 中未找到相关代码
- **证据**：`evidence/D2-1/stdout.log`

## 统计

| 级别 | 数量 |
|---|---|
| P0 | 4 |
| P1 | 3 |
| P2 | 0 |
| **合计** | **7** |

## 建议

1. 优先修复 P0 缺陷，特别是安全相关功能（D2-11, D4-18, D4-19, D9-13）
2. 检查 mcp-server.mjs 中工具注册逻辑，确保 check_update/upgrade 工具正确暴露
3. 补充 safety-policy.mjs 中的审批流和预检逻辑
