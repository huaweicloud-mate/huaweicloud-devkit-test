# ITER-005 最终状态

- 状态：`TEST_DESIGN_READY`
- 评审轮次：4
- 评审目录：`reviews/ITER-005-20260912092621/`
- 评审记录：`reviews/ITER-005-20260912092621/codex/review-round-04-正式测试设计复审.md`
- 设计阶段是否执行测试：否

## 设计资产

- 设计级矩阵：`test-cases/design/用例矩阵-设计级.csv`，163 条
- 展开级矩阵：`test-cases/expanded/用例矩阵-展开级.csv`，137 条
- 需求追踪表：`test-cases/tracing/需求-设计-证据追踪表.csv`，169 条
- Hermes 交接：`reviews/ITER-005-20260912092621/hermes/`
- 多终端矩阵：`reviews/ITER-005-20260912092621/terminal-matrix.csv`

## 设计门禁证据

- `test-cases/design/verify_new.py`：全部设计检查通过；
- 工具全集由被测项目 `tools.mjs` 注册源推导，当前为 39 个；
- 正式矩阵与 Hermes 候选矩阵一致；
- 生成复现检查使用临时目录，不覆盖正式真源；
- 历史 `FAIL`、`BLOCKED`、`SPEC-MISMATCH` 和 `NOT_RUN` 已与设计状态分离。

## 保留的执行前事项

- D1-39 历史 P0 `FAIL` 需要执行阶段复核；
- 规格冲突需产品/开发裁决；
- macOS/ARM、CodeArtsSpace、真实 PTY、remote session 等环境缺口需准备；
- 131 条设计级 `NOT_RUN` 和展开级未执行项需要在结果轮次回填证据；
- 正式执行结果必须写入新的 `results/ITER-006-<YYYYMMDDHHmmss>/`。

`TEST_DESIGN_READY` 表示设计已达到执行门槛，不表示历史执行状态全部为 PASS，也不自动授权真实云操作。
