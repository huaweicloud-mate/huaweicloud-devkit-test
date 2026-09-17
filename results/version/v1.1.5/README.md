# 迭代版本 v1.1.5

## 版本信息

- 稳定版本：`v1.1.5`（npm latest）
- 实际测试对象：`v1.1.5` @ commit `e7ed6f66`（main，latest 正式版）
- 工具全集：40 个 MCP 工具（tools/list 实测 40）
- Node / npm / Python：Windows v22.23.2 / 10.9.8 / 3.11.15；Linux v22.13.0 / 10.9.2 / 3.12.3
- 测试类型：版本全量测试（母版全量 `init_day --full`），双 OS 对照（Windows + Linux）

## 执行归档（实质文件）

| OS | 归档目录 | 测试报告 | 执行结果 CSV | 缺陷清单 |
|---|---|---|---|---|
| Windows | `results/version/v1.1.5/Windows/` | `Hermes-DeepSeek-V4-Pro-v1.1.5-测试报告.md` | 设计级/展开级/追踪表 3 CSV | `FINDINGS.md` + `HISTORY_LINKS.md` |
| Linux | `results/version/v1.1.5/Linux/` | `Hermes-DeepSeek-V4-Pro-v1.1.5-测试报告.md` | 设计级/展开级/追踪表 3 CSV | `FINDINGS.md` + `HISTORY_LINKS.md` |

> 逐用例证据（probe + stdout.log）在原执行目录：`results/Hermes/2026-09-16-192.168.0.102/Windows/evidence/` 与 `results/Hermes/2026-09-16-1.94.218.129/Linux/evidence/`。

## 执行状态（双 OS 一致）

- 设计级 179：PASS 175 / FAIL 3 / SPEC-MISMATCH 1
- 展开级 57（Hermes+OS 预筛）：PASS 45 / FAIL 11 / NOT_RUN 1
- 通过率（分母=PASS+FAIL+SPEC，不含 NOT_RUN）：93.6%（220/235）
- 唯一 OS 差异：D1-39（Windows 升级检测链 EINVAL 专属）在 Linux 侧 OS 专属豁免。

## 缺陷（均历史复现，双 OS v1.1.5 复核一致）

| 用例 | 级别 | 缺陷 | 历史单 |
|---|---|---|---|
| D4-16 | P0 | sh -c 包裹凭证 env 打印未拦截 | #677 #682 #694 |
| D10-3 / EXP-E01~14 | P1 | serviceCatalog 路由命中率 21.4% | #689 |
| D9-2 | P1 | invalid params 未返回 -32602 | #704 #672 |
| D8-4 | P1 | INSTALL.md 未随 npm 包发布 | #694 |
| D9-9 | P1 | notifications.cancellation 未声明（SPEC） | #698 |

## 其他客户端

- 待其余 9 客户端（OpenCode/Codex/CodeArtsAgent/…）补齐 v1.1.5 全量后由维护者汇总合并。