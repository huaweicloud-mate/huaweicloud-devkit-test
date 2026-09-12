# CodeArtsAgent 客户端测试执行目录

本目录保存 **CodeArtsAgent** 客户端的测试执行结果。

## 每日执行流程

1. **复制测试用例**：从 `test-cases/design/用例矩阵-设计级.csv`、`test-cases/expanded/用例矩阵-展开级.csv`、`test-cases/tracing/需求-设计-证据追踪表.csv` 各复制一份到本目录，按日期命名（如 `2026-09-12/`）。
2. **执行**：按复制进来的测试用例逐条执行。
3. **回填执行状态**：执行结果直接回填到本目录 CSV 副本的「执行状态」列（`PASS`/`FAIL`/`BLOCKED`/`SPEC-MISMATCH`/`NOT_RUN`），证据落盘到 `evidence/`。
4. **输出测试报告**：按标准输出测试报告（标题含 Agent+模型名，如 `Hermes-Agent-DeepSeek-V4-Pro-测试报告.md`），**直接保存到本日期目录下**，并同步回填正式真源。

## 状态口径

- `PASS`：执行通过，有证据。
- `FAIL`：执行不符合预期（缺陷，记录根因 + 证据）。
- `BLOCKED`：环境/权限阻塞（记录 blockedReason）。
- `SPEC-MISMATCH`：实现与设计契约漂移（待裁决）。
- `NOT_RUN`：尚未执行。
