# 迭代版本 v2.0.0

## 版本信息

- 稳定版本：`v2.0.0`（npm latest）
- 实际测试对象：`v2.0.0` @ commit `fcfe047f`（v2，latest 正式版）
- 工具全集：56 个 MCP 工具
- Node / npm / Python：node v26.8.1 / npm / python3
- 测试类型：版本全量测试（母版全量 `init_day --full`），双 OS/单 OS 对照

## 执行归档（实质文件）

| OS | 归档目录 | 测试报告 | 执行结果 CSV | 缺陷清单 |
|---|---|---|---|---|
| Linux | `results/version/v2.0.0/Linux/` | `Hermes-deepseek-v4-pro-0813-v2.0.0-测试报告.md` | 设计级/展开级/追踪表 3 CSV | `FINDINGS.md` + `HISTORY_LINKS.md` |

## 执行状态

- 设计级：PASS 62 / FAIL 18 / SPEC-MISMATCH 1 / BLOCKED 4 / NOT_RUN 127
- 展开级：PASS 8 / FAIL 15 / NOT_RUN 34
- 通过率（分母=PASS+FAIL+SPEC，不含 NOT_RUN）：67.3%

## 缺陷（均经 file_issue.py 查重，见 HISTORY_LINKS.md）

| 用例 | 级别 | 缺陷 |
|---|---|---|
| D10-3,EXP-E01 | P0 | D10-3 / EXP-E01~E15  serviceCatalog 新增 vendor gate 导致路由全部 MI |
| D9-12 | P0 | D9-12  mcp-protocol 导出 `dispatch` API 已删除 |
| D4-5 | P1 | D4-5  huaweicloud_plan_cli_command 被 vendor gate 拦截 |
| D9-10,D9-11 | P1 | D9-10/D9-11  mcp-server-remote 探针入口失配 |
| D1-65 | P1 | D1-65  update-check DEBUG 开关迁移（契约迁移） |
| D1-66 | P1 | D1-66  telemetry 端点环境变量改名 |
| D10-4 | P2 | D10-4  安全规则集 16→19 条（纯新增，无降级，测试侧契约未更新） |
| D3-C1,D3-C6 | 测试侧 | 真云 E2E：D3-C1 自动归零时序缺陷 + D3-C6/C3 沙箱 BLOCKED |

## 历史关联单

- #1036, #978, #976, #896, #881, #876, #866, #864, #858, #852, #845, #844, #841, #828, #826

## 其他客户端

- 待其余客户端补齐该版本全量后由维护者汇总合并。
