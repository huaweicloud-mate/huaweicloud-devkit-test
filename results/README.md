# 执行结果归档说明

本目录保存每轮测试执行的**结果归档**。测试设计评审不放在这里，统一归档到 `../reviews/`。

## 归档命名规则

| 对象 | 规则 | 示例 |
|---|---|---|
| 迭代目录 | `ITER-<NNN>-<YYYYMMDDHHmmss>` | `ITER-001-20260905000000` |
| 每晚报告 | `nightly-<YYYYMMDDHHmmss>.md` | `nightly-20260905000000.md` |
| 客户端矩阵 | `matrix-<被测插件版本>.md` | `matrix-v1.2.0.md` |
| 缺口表 | `gaps-<ITER>-<YYYYMMDDHHmmss>.md` | `gaps-ITER-001-20260905000000.md` |

## 迭代目录结构（每轮自动/手动生成）

```
ITER-NNN-YYYYMMDDHHmmss/
├── baseline.md           # T0：目标 commit / 环境快照 / 能力清单核对
├── change-impact.md      # T0.5：变更影响分析（本次改了哪些工具/skill/策略）
├── nightly/              # 每晚回归报告
├── client-matrix/        # 客户端适配矩阵结果
├── security/             # 安全审计结果
├── gaps.md               # 缺口表（P0/P1/P2 + P/G 分类 + 处置）
├── issues/               # issue 拆分稿 + 插件修复提示词
├── evidence/             # 脱敏证据（日志/截图；禁止未脱敏内容）
└── cleanup-report.md     # T5 资源释放清单
```

## 与设计评审的边界

- 设计评审、Hermes/Codex 往返记录、终端矩阵和 `TEST_DESIGN_READY` 结论：`../reviews/ITER-NNN-YYYYMMDDHHmmss/`
- 测试基线、执行记录、日志、证据、缺陷验证和清理报告：本目录的 `ITER-NNN-YYYYMMDDHHmmss/`
- 只有评审状态为 `TEST_DESIGN_READY` 后，才允许创建对应的执行结果归档。

## 约定

- `LATEST.md` 指向最新一次迭代 + 一行摘要
- **凭证红线**：evidence/ 只存脱敏后内容；任何 AK/SK/密钥格式文件一律拒绝入库（.gitignore 已锁定）
- 归档用脚本 `scripts/archive-result.ps1`（自动生成 ITER 骨架）
