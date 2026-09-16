# 迭代版本 v1.1.5

## 版本信息

- 稳定版本：`v1.1.5`（npm latest）
- 实际测试对象：`v1.1.5` @ commit `e7ed6f66`（main，latest 正式版）
- 工具全集：40 个 MCP 工具（tools/list 实测 40）
- Node / npm / Python：v22.23.2 / 10.9.8 / 3.11.15
- 测试类型：版本全量测试（母版全量，`init_day --full`）

## 测试结果（截至 2026-09-16）

- 执行归档：`results/Hermes/2026-09-16-192.168.0.102/Windows/`
- 测试报告：`results/Hermes/2026-09-16-192.168.0.102/Windows/Hermes-DeepSeek-V4-Pro-v1.1.5-测试报告.md`
- 缺陷清单：`results/Hermes/2026-09-16-192.168.0.102/Windows/FINDINGS.md`（5 项，**全部命中历史单，不重复提单**；HISTORY_LINKS.md 关联清单已落）
- 执行状态：设计级 179 条（PASS 175 / FAIL 3 / SPEC-MISMATCH 1）；展开级 57 条（PASS 45 / FAIL 11 / NOT_RUN 1）
- 通过率（分母=PASS+FAIL+SPEC，不含 NOT_RUN）：93.6%（220/235）

## 缺陷（均历史复现，v1.1.5 复核仍成立）

| 用例 | 级别 | 缺陷 | 状态 |
|---|---|---|---|
| D4-16 | P0 | sh -c 包裹凭证 env 打印未拦截（命令包裹穿透） | 历史单（见 HISTORY_LINKS.md） |
| D10-3 / EXP-E01~14 | P1 | serviceCatalog 路由命中率 21.4% | 历史单 |
| D9-2 | P1 | invalid params 未返回 -32602 | 历史单 |
| D8-4 | P1 | INSTALL.md 未随 npm 包发布 | 历史单 |
| D9-9 | P1 | notifications.cancellation 未声明（SPEC） | 历史单 |

## 其他客户端

- 待其余 9 客户端（OpenCode/Codex/CodeArtsAgent/…）补齐 v1.1.5 全量后由维护者汇总合并。