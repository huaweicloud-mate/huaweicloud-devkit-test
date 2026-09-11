# huaweicloud-devkit-test 全量测试设计评审

> 评审时间：2026-09-11 00:00:00
> 评审对象：仓库内 Hermes 生成的测试设计及其关联母版/专项计划
> 测试归档：`C:\Users\Administrator\devkit-test\huaweicloud-devkit-test`
> 被测项目：`C:\Users\Administrator\devkit-test\hdk`
> 评审结论：`REVIEW_CHANGES_REQUESTED`

## 一、评审范围

本轮不是只评审 NR3 版本升级提醒，而是检查以下全部测试设计资产：

- `docs/01-测试规划.md`：D1-D10 测试规划母版；
- `test-cases/design/用例矩阵-设计级.csv`：153 条设计级用例；
- `test-cases/expanded/用例矩阵-展开级.csv`：132 条展开级用例；
- `docs/03-执行准备清单.md`、`docs/06-Hermes-Codex测试设计评审闭环.md`：执行前置与评审门禁；
- `results/ITER-002-2026-09-08/aksk-scheme-v4/NR2-设计与执行.md`；
- `results/ITER-002-2026-09-08/manual/` 下的客户端/协议/安全专项手测设计；
- `results/ITER-005-20260910160332/测试用例与验证计划-1.1.3-next.2.md`；
- `reviews/ITER-004-20260910155945/hermes/`：Hermes 当前交接版；
- `reviews/ITER-004-20260910155945/terminal-matrix.csv` 与对应执行/证据索引。

## 二、总体结论

全局测试规划的维度和安全门禁已经比较完整，设计级母版也具备 153 条记录；但目前还不能认为“所有测试设计已完成评审并可直接执行”。主要问题在于：

1. 全局母版、专项设计、Hermes 交接包和展开级真源之间没有统一的追踪审计；
2. 设计级用例的大量展开策略为空，无法判断是有意不展开还是遗漏；
3. 展开级真源仍存在旧轮次状态和环境描述，可能覆盖最新专项结果；
4. 专项设计中出现的新增/补测用例是否回填到 153 条母版没有可验证结论；
5. `docs/03-执行准备清单.md` 仍有未建载体和未满足环境，但未被统一纳入设计放行判定；
6. NR3 当前仍有 `BLOCKED`、`FAIL` 和 `SPEC-MISMATCH`，不能签署 `TEST_DESIGN_READY`。

## 三、必须整改项

### [P1] 建立全仓库需求到证据的追踪审计

请在 Hermes 交接目录增加全量追踪表，至少包含：

`sourceAsset / requirementOrRisk / designCaseId / expandedCaseId / testLayer / clientOrOSScope / requiredEvidence / status / owner / gap`

追踪对象必须覆盖 D1-D10、NR2/NR3/NR5/ITER-005 专项设计及历史手测设计。对每个专项用例明确：

- 已纳入 `test-cases/design/用例矩阵-设计级.csv`；
- 仅为执行记录，不属于正式设计；
- 已废弃但保留历史结果；
- 或者是尚未回填的孤立设计。

缺少对应设计级用例、展开级用例或证据要求的条目必须列为缺口，不能仅在报告正文中口头说明。

### [P1] 补齐 153 条设计级用例的展开策略

当前 `用例矩阵-设计级.csv` 的 `展开规则` 有 115 条为空。请逐条补齐：

- `COMMON`：说明函数/代表客户端即可，不做终端展开的理由；
- `CLIENT_MATRIX`：列明客户端集合或代表客户端选择理由；
- `OS_MATRIX`：列明 Windows/Linux/macOS、架构和运行时要求；
- `AGENT_E2E`：列明真实 Agent、模型、会话交互和判定方式；
- `CROSS_PROCESS`：列明进程/会话/配置目录/并发边界。

如果某条确实不需要展开，必须写出“不展开原因”和覆盖假设。不得让空值承担隐含语义。

### [P1] 修复展开级真源与最新结果的版本漂移

`test-cases/expanded/用例矩阵-展开级.csv` 仍有 NR3 行使用 `2026-09-10 19:35` 的“无 Linux 测试机”旧阻塞描述，而最新 ITER-004 证据已经接入 Ubuntu testbot3，并将部分 Linux 行转为已执行结果。

请选择一种可审计方案：

- 同步展开级真源到最新状态，并保留历史状态/更新时间字段；或
- 明确该 CSV 是设计基线而非执行状态，移除易被误读为当前结果的状态描述，并在专项矩阵中引用执行状态。

不能同时让设计真源和专项矩阵对同一条用例给出不同当前状态而没有版本字段。

### [P1] 对所有新增需求执行 NR1-NR6 追踪

对 NR2、NR3、ITER-005 和后续专项逐项补充：

- 需求类型和变更影响；
- Happy Path、Error Path、安全影响、防退化用例；
- 设计级 ID，且 ID 永不复用；
- 展开策略和代表终端；
- 执行/阻塞/规格冲突状态；
- 是否纳入固定回归基线。

发现专项文件中有用例但母版无对应 ID 时，新增正式 ID 或标记为明确的执行脚本步骤；不能保持“散落在 results 下但不在正式矩阵”的孤立状态。

### [P1] 覆盖承诺能力与安全门禁的可计算核对

请生成一次机器可读的覆盖审计，至少核对：

- 规划声明的 36 个 MCP 工具是否逐个有设计级用例；
- 约 30 个 skill 是否有检索/路由/真实激活覆盖；
- 10+ 客户端是否有安装/加载/重启/Hook 或降级路径；
- D4 全量 P0/P1 是否有负向断言和证据要求；
- D9 协议和 D10 Agent 评测是否有执行集与通过标准；
- D7 OS/Node 矩阵是否区分 x64、ARM64、Windows、Linux、macOS；
- `voucher_claim` 等有副作用工具是否有审批/安全路径，而不只是状态查询。

审计输出应列出“已覆盖、仅静态覆盖、仅执行覆盖、缺失、被 BLOCKED”的清单和计数。

### [P1] 统一未执行、部分执行和规格冲突的状态口径

所有设计/执行资产必须区分：

`UNASSESSED / BLOCKED / NOT_RUN / PARTIAL / PASS / FAIL / SPEC-MISMATCH`

特别是：

- Linux ARM64 证据不能自动代表 Linux x64；
- 探针退出码非零时，不能把部分断言结果包装为整体 PASS；
- mock/FIX(sim) 只能证明测试或修复方向，不能替代正式产品版本；
- D1-39、D1-29、D1-43c、D1-46g、D1-55b 和 D1-55-session 的现有未闭合状态必须保留；
- `docs/03-执行准备清单.md` 的未完成项必须出现在统一阻塞/前置条件表中。

### [P2] 补齐设计资产元数据和复现入口

每个专项设计包增加：

- 设计文档绝对路径和版本/commit；
- 生成时间、更新时间和状态；
- 来源设计级 ID；
- 生成脚本和命令；
- 证据目录；
- 依赖的客户端、OS、Node/npm、TTY、MCP transport；
- 当前结果与历史结果的分界。

对历史 `results/ITER-*` 文件不强行改写，但在追踪表中标明其性质，避免被误当成当前正式设计。

## 四、当前已确认的保留项

- `test-cases/design/用例矩阵-设计级.csv` 当前 153 条，字段基本齐全，但展开规则缺失率高；
- `test-cases/expanded/用例矩阵-展开级.csv` 当前 132 条，主要展开 D5、D3-C4、D10 和 NR3；
- NR3 当前设计包仍为 `HERMES_REVISION_READY`，不是 `TEST_DESIGN_READY`；
- ITER-004 当前仍存在终端 `BLOCKED`、产品 `FAIL` 和 `SPEC-MISMATCH`，必须由后续环境接入、开发修复或产品裁决闭合；
- 不得修改 Codex 历史评审结论来掩盖上述问题。

## 五、Hermes 回传要求

完成后请回传：

1. 修改文件清单；
2. 全量设计资产数量及分类；
3. 追踪表行数和缺口计数；
4. 153 条设计级用例中各展开类型数量；
5. 展开级总数及每个来源维度数量；
6. 工具、skill、客户端、OS/Node、安全 P0/P1 的覆盖审计；
7. 仍为 `BLOCKED`、`FAIL`、`SPEC-MISMATCH`、`UNASSESSED` 的清单；
8. 本轮无法补齐的项目及解除条件。

在上述整改完成并经 Codex 复评前，保持 `REVIEW_CHANGES_REQUESTED`，不得设置 `TEST_DESIGN_READY`，不得开始正式全量 `devkit-test` 执行。
