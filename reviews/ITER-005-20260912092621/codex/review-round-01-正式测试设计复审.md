# Codex ITER-005 第 1 轮正式测试设计复审

- 评审目录：`reviews/ITER-005-20260912092621/`
- 评审对象：本轮 Hermes 交接材料、正式设计级/展开级矩阵、追踪表、生成脚本和门禁脚本
- 当前结论：`REVIEW_CHANGES_REQUESTED`
- 当前状态：不得进入测试执行，不得标记 `TEST_DESIGN_READY`

## 已核验通过

1. Hermes 已在真实测试项目中提交 `hermes/test-design.md`、`hermes/candidate-matrix.csv`、`hermes/status.md` 和 `terminal-matrix.csv`。
2. 正式设计级矩阵为 163 条，展开级矩阵为 137 条，追踪表为 169 条。
3. 设计级矩阵已增加独立的设计状态、执行状态、终端覆盖和证据字段；131 条历史 `UNASSESSED` 已映射为执行状态 `NOT_RUN`，没有被改写成 `PASS`。
4. D1-39 的 `FAIL`、规格冲突和环境阻塞仍被保留，未被伪装为设计通过。
5. 生成脚本、正式 CSV 和 Hermes 候选矩阵的字段结构已基本同步，所有正式设计行均标记为 `DESIGN_COVERED`，这与执行状态分离的设计目标一致。
6. 本轮状态文件明确声明没有执行测试、没有运行 `npm test`/`node --test`/`hcloud`，符合设计阶段纪律。

## 必须整改

### [P1] MCP 工具总数口径不一致，覆盖率分母未收敛

**证据：**

- `docs/01-测试规划.md` 仍声明“MCP 工具全集（36 个）”，并在多处写明 36 个工具。
- `test-cases/design/verify_new.py` 的 `TOOLS` 实际包含 37 个名称，但检查标题仍写“36 工具逐个覆盖”。
- `test-cases/design/gen_matrix.py` 的新增注释已写“工具闭包 37/37”，但多个用例的预期结果仍写“36 工具”。
- Hermes `status.md` 也明确记录“规划标题声明 36 个，但当前静态清单有 37 个名称”，并将其留作 Codex 复审项。

**风险：**

当前无法判断第 37 个名称是正式新增能力、规划文档遗漏，还是错误纳入的工具别名。若直接放行，设计覆盖率的分母、`tools/list` 的精确断言和发布门禁会产生不同解释。

**必须修改：**

1. 从被测项目当前正式工具注册源确定唯一工具全集，并在 `docs/01-测试规划.md`、`test-cases/design/gen_matrix.py`、`test-cases/design/verify_new.py`、`test-cases/README.md`、正式设计级矩阵、展开级矩阵和追踪表中统一数量与名称。
2. 将所有用例预期结果中的“36 工具”改成统一口径；如果正式全集确实是 37 个，相关断言必须全部改为 37。
3. 门禁脚本必须对正式工具全集做机器可核对的精确比较：数量、名称、设计级关联工具覆盖和 `tools/list` 预期不能各自维护不同清单。
4. 若第 37 个工具尚未获得产品/实现确认，必须标记为 `SPEC-MISMATCH`，说明责任人和所需证据，不得一边按 37 统计、一边按 36 断言。
5. 更新本轮 `hermes/status.md`，说明最终口径和修改文件。

**完成判定：**

- 规划、生成脚本、门禁脚本、三张 CSV 和评审交接材料使用同一份工具全集；
- 工具数量和名称可由一个明确的机器可读来源推导；
- 该 P1 不再作为开放问题；
- 不需要执行真实测试即可完成这项设计级规格收敛。

## 其他复审意见

- 设计状态与执行状态分离方案可接受：`DESIGN_COVERED` 不等于行为通过，历史执行状态继续独立保留。
- 设计级与展开级字段扩展方向可接受；正式放行前仍需 Hermes 修订后再次核验外键和生成一致性。
- `terminal-matrix.csv` 已包含 Hermes、Hook/非 Hook、Windows/Linux、TTY/非 TTY 和 stdio/remote 的设计项；macOS、CodeArtsSpace、remote 等不可用环境必须继续保留为执行阶段 `BLOCKED`，不能在设计评审中伪造通过。
- 本轮历史 `PASS`、`FAIL`、`BLOCKED`、`SPEC-MISMATCH` 只作为既有执行/规格状态，不得被解释为本轮新执行证据。

## 评审结论

```text
REVIEW_CHANGES_REQUESTED
```

请 Hermes 先完成上述工具全集口径整改并重新提交 `HERMES_REVISION_READY`，然后由 Codex 进行第 2 轮复审。整改期间继续禁止正式测试执行。
