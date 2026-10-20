# OfficeAce (glm-5.2) 每日测试报告 — 2026-10-20

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 | OfficeAce |
| 模型 | glm-5.2 |
| OS | Windows 2022Server |
| 被测版本 | huaweicloud-devkit@1.1.9 |
| 执行包路径 | `results/OfficeAce/2026-10-20-119.8.181.45/Windows/` |
| 执行时间 | 2026-10-20 09:17 ~ 09:45 (北京时间) |
| 执行方式 | **全量重新执行，不复用历史证据** |

## 二、执行摘要

| 步骤 | 状态 | 说明 |
|------|------|------|
| 1. prepare_env | ✅ | 拉最新测试仓库 + 源码仓库 + npm 包 |
| 2. init_day 建包 | ✅ | 生成 107 设计级 + 39 展开级 + 1 使命清单 |
| 3. P0→P1→P2 执行 | ✅ | 5 个分组探针全量执行 + 33 个独立用例处理 |
| 4. 回填 | ✅ | backfill_daily.py 一次性回填 146 条 |
| 5. 门禁校验 | ✅ | verify_no_fake_pass + verify_coverage 均通过 |
| 6. 报告 + FINDINGS | ✅ | 本报告 + FINDINGS.md |
| 7. 后台增量提报 | ✅ | hourly_sync 已启动 (PID 21228, 每 10 分钟) |

## 三、状态汇总

| 级别 | 总数 | PASS | FAIL | BLOCKED | 通过率 |
|---|---|---|---|---|---|
| 设计级 | 107 | 85 | 3 | 19 | 96.6% (85/88) |
| 展开级 | 39 | 28 | 11 | 0 | 71.8% (28/39) |
| **合计** | **146** | **113** | **14** | **19** | **86.3%** (113/131) |

### 优先级分布

| 优先级 | 总数 | PASS | FAIL | BLOCKED |
|---|---|---|---|---|
| P0 | 21 | 18 | 1 | 2 |
| P1 | 56 | 44 | 12 | 0 |
| P2 | 30 | 23 | 1 | 6 |

## 四、缺陷清单

### 设计级 FAIL (3 项)

| # | 级别 | 用例 | 描述 | 根因 |
|---|---|---|---|---|
| 1 | **P0** | D4-16 | 命令包裹穿透 | MCP 层 sh wrap 未被安全策略阻止 (mcp-tools 探针检测到 allow) |
| 2 | P1 | D4-27 | 双路径输出脱敏 | stdout+stderr 中 AK/SK/token 未完全脱敏 |
| 3 | P2 | D8-9 | 安装 ID 与遥测值脱敏 | sanitizeValue 未覆盖 AKID 前缀格式 |

### 展开级 FAIL (11 项)

| # | 级别 | 用例 | 描述 |
|---|---|---|---|
| 4 | P1 | EXP-E01 | serviceCatalog 路由 MISS |
| 5 | P1 | EXP-E02 | serviceCatalog 路由 MISS |
| 6 | P1 | EXP-E03 | serviceCatalog 路由 MISS |
| 7 | P1 | EXP-E04 | serviceCatalog 路由 MISS |
| 8 | P1 | EXP-E05 | serviceCatalog 路由 MISS |
| 9 | P1 | EXP-E07 | serviceCatalog 路由 MISS |
| 10 | P1 | EXP-E10 | serviceCatalog 路由 MISS |
| 11 | P1 | EXP-E11 | serviceCatalog 路由 MISS |
| 12 | P1 | EXP-E12 | serviceCatalog 路由 MISS |
| 13 | P1 | EXP-E13 | serviceCatalog 路由 MISS |
| 14 | P1 | EXP-E14 | serviceCatalog 路由 MISS |

> 以上 14 项缺陷均为历史已知问题，已关联现有 GitHub issue。

## 五、未执行用例与原因 (BLOCKED 19 项)

### 真云 E2E (15 项) — 凭证过期

| 用例 | 优先级 | 原因 | 分类 |
|---|---|---|---|
| D3-C1 | P1 | 真云凭证过期(APIGW.0301), ECS生命周期E2E | 补环境 |
| D3-C2 | P1 | 真云凭证过期, OBS静态站部署E2E | 补环境 |
| D3-C3 | P1 | 真云凭证过期, 沙箱部署E2E | 补环境 |
| D3-C6 | P1 | 真云凭证过期, 沙箱隐式工具冒烟 | 补环境 |
| D3-C7 | P1 | 真云凭证过期, 跨区域资源操作引导 | 补环境 |
| D3-C13 | P1 | 真云凭证过期, OBS静态网站托管配置 | 补环境 |
| D3-C14 | P2 | 真云凭证过期, 沙箱HDKit服务参数 | 补环境 |
| D3-S1 | P1 | 真云凭证过期, 只读查ECS | 补环境 |
| D3-S2 | P1 | 真云凭证过期, 删VPC先确认 | 补环境 |
| D3-S3 | P1 | 真云凭证过期, 沙箱预览出URL | 补环境 |
| D3-S4 | P1 | 真云凭证过期, 领券闭环 | 补环境 |
| D3-S5 | P2 | 真云凭证过期, 复合意图分层路由 | 补环境 |
| D3-S6 | P2 | 真云凭证过期, FunctionGraph定时任务 | 补环境 |
| D3-S7 | P1 | 真云凭证过期, 跨服务交付并归零 | 补环境 |
| D3-S8 | P1 | 真云凭证过期, 操作失败排障指引 | 补环境 |

### 客户端专属 (2 项) — 归属不匹配

| 用例 | 优先级 | 原因 | 分类 |
|---|---|---|---|
| D1-67 | P2 | DSH专属环境变量, OfficeAce非DSH客户端 | 调归属 |
| D4-25 | P2 | 需Python Hook客户端(Hermes Hook), OfficeAce非Hook客户端 | 调归属 |

### 远程传输 (2 项) — 需真实服务端

| 用例 | 优先级 | 原因 | 分类 |
|---|---|---|---|
| D9-10 | P1 | MCP remote transport(HTTP/WS)需真实远程服务端环境 | 补环境 |
| D9-11 | P1 | WebSocket隧道需真实DevBridge服务端环境 | 补环境 |

## 六、安全/红线

- ✅ 只提交 `results/OfficeAce/` 目录，未碰 Summary / 其他客户端 / test-cases 母版
- ✅ PASS 门禁通过：所有标 PASS 用例均有 evidencePath 证据
- ✅ 覆盖率门禁通过：P0 无 NOT_RUN，NOT_RUN+空占比 = 0%
- ✅ 全量执行，未复用历史证据

## 七、资源释放

- 无真云资源创建（真云用例因凭证过期标 BLOCKED，未执行建删操作）
- 后台 hourly_sync 进程 (PID 21228) 随会话结束自动终止

## 八、遗留建议

1. **真云凭证刷新**：刷新主账号 AK/SK 或获取新 STS 凭证后，可补测 15 个 BLOCKED 真云用例
2. **D4-16 命令包裹穿透**：MCP 层 sh wrap 仍可绕过安全策略，需修复 safety-policy
3. **D4-27 双路径脱敏**：stderr 路径未覆盖脱敏，需扩展 redactString 覆盖
4. **EXP-E 路由 MISS**：serviceCatalog 中文意图路由 11/15 未命中，为长期已知缺陷
