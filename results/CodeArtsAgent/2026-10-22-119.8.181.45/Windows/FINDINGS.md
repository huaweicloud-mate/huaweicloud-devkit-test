# FINDINGS - CodeArtsAgent Windows 每日测试

> 发现时间: 2026-10-22  
> 客户端: CodeArtsAgent  
> OS: Windows

## #1【P1】dismiss 冷却期

- **现象**：调用 `judgeUpdate('1.1.1', { latest: '1.1.2', next: null }, true)` 时，dismiss 参数未生效，返回值仍为 `update_available` 而非预期的 `dismissed`。
- **断言**：`judgeUpdate(current, distTags, dismiss=true)` 应返回 `result='dismissed'` 且 `dismissed=true`。
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs` - judgeUpdate 函数未正确处理 dismiss 参数。
- **证据**：`evidence/D1-31/stdout.log`

## #2【P0】Windows 升级检测链可用性

- **现象**：Windows 下 `spawnSync('npm.cmd', ...)` 不带 `shell:true` 时产生 `EINVAL` 错误，导致升级检测链不可用。
- **断言**：Windows 下 spawnSync 调用 npm.cmd 检测链应真实可用，不得 EINVAL 静默失败。
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs` - queryDistTagsSync 函数在 Windows 上需要 `shell:true` 选项（关联 #554）。
- **证据**：`evidence/D1-39/stdout.log`

## #3【P2】调试模式环境变量

- **现象**：设置 `HUAWEICLOUD_DEVKIT_DEBUG=1` 后，源码中未找到 DEBUG 相关变量判断逻辑。
- **断言**：`DEBUG===1/true` 时应开启调试日志。
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs:211` / `telemetry.mjs:81` - DEBUG 判断逻辑未在预期位置找到。
- **证据**：`evidence/stdout_p2.log`

## #4【P2】遥测开关与端点环境变量

- **现象**：设置 `HUAWEICLOUD_DEVKIT_TELEMETRY=off` 后，源码中未找到遥测相关变量判断逻辑。
- **断言**：`TELEMETRY!=off` 时开遥测、`=off` 关闭。
- **根因**：`plugins/huaweicloud-core/src/telemetry.mjs` - isTelemetryEnabled 函数未在预期位置找到。
- **证据**：`evidence/stdout_p2.log`

---

## BLOCKED 用例

| 用例ID | 原因 |
|--------|------|
| D1-4 | huaweicloud-devkit 命令模块路径错误 |
| D1-41 | 无法导入 mcp-protocol/tools.mjs |
| D1-45 | 无法导入 mcp-protocol/tools.mjs |

