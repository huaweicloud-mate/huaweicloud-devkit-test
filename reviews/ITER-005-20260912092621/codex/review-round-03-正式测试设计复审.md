# Codex ITER-005 第 3 轮正式测试设计复审

- 评审目录：`reviews/ITER-005-20260912092621/`
- 评审对象：Hermes Round-02 修订后的正式设计真源、生成脚本、门禁脚本、规划文档和评审交接材料
- 当前结论：`REVIEW_CHANGES_REQUESTED`
- 当前状态：不得进入测试执行，不得标记 `TEST_DESIGN_READY`

## 本轮已核验通过

1. Hermes 状态为 `HERMES_REVISION_READY`，并明确本轮未执行测试、真实 MCP、真实升级或真实云操作。
2. 正式矩阵数量仍为设计级 163、展开级 137、追踪表 169；Hermes 候选矩阵与正式设计级 CSV 内容一致。
3. 设计状态与执行状态继续分离：163 条设计状态为 `DESIGN_COVERED`，历史 `UNASSESSED` 对应执行状态为 `NOT_RUN`，既有 `PASS/FAIL/BLOCKED/SPEC-MISMATCH` 未被抹除。
4. 工具注册源当前可静态核对为 39 个，39 个名称均在设计级 `关联工具` 中出现；规划文档和主要用例断言已同步到 39。
5. `verify_new.py` 已移除原先写死的被测项目绝对路径，支持 `HUAWEICLOUD_DEVKIT_HOME` 和测试仓相邻 `../hdk`，缺失时有明确 `ENV_MISSING` 阻塞信息。
6. 终端矩阵继续覆盖 Hook/非 Hook、Windows/Linux、TTY/非 TTY、stdio/remote，并对未提供的 macOS、CodeArtsSpace、PTY、remote 环境保留阻塞说明。

## 必须整改

### [P1] 门禁校验脚本通过重跑生成器改写正式真源，存在审计副作用

**证据：**

`test-cases/design/verify_new.py` 新增的复现检查使用：

```python
subprocess.run([sys.executable, ".../gen_matrix.py"], cwd=REPO_ROOT, ...)
subprocess.run([sys.executable, ".../gen_tracing.py"], cwd=REPO_ROOT, ...)
```

生成脚本会直接写入：

- `test-cases/design/用例矩阵-设计级.csv`
- `test-cases/expanded/用例矩阵-展开级.csv`
- `test-cases/tracing/需求-设计-证据追踪表.csv`

也就是说，`verify_new.py` 不是只读审计，而是先修改正式设计真源，再比较修改前后的 SHA-256。

**风险：**

- 门禁脚本可能覆盖人工修订、Hermes 未提交的候选设计或外部同步内容；
- 生成脚本失败或中途中断时，正式 CSV 可能只写入一部分；
- 审计动作的副作用与“只检查、不改变测试资产”的预期不一致；
- 在 CI、评审和用户本地运行门禁时，结果依赖写权限和当前工作树状态。

**必须修改：**

1. 将生成器增加只读校验模式，或把输出目录参数化到临时目录；
2. `verify_new.py` 应在临时目录中生成候选 CSV，再比较临时输出与正式 CSV；不得直接覆盖正式真源；
3. 若生成器失败，正式 CSV 必须保持原样，并明确报告 `GENERATION_CHECK_FAILED`；
4. 在 `status.md` 和闭环文档中说明该门禁为只读校验，不产生设计文件变更。

**完成判定：**

- 在执行复现检查前后，三张正式 CSV 的内容和修改时间均不发生变化；
- 生成失败时正式真源不被破坏；
- 临时生成结果仍能与正式 CSV 做字节级或规范化等价比较。

### [P2] 门禁脚本的矩阵路径仍依赖当前工作目录

**证据：**

`verify_new.py` 中 `P_DES`、`P_EXP`、`P_TRACE` 仍是相对路径，只有从测试仓根目录启动时才稳定；从脚本目录、CI 任务目录或其他调用目录启动会找不到正式矩阵。

**必须修改：**

将所有测试资产路径基于 `REPO_ROOT` 解析，或在启动时明确切换到仓库根目录；错误时输出明确路径和 `ENV_MISSING`，不要产生 Python 的裸 `FileNotFoundError`。

### [P2] 工具源解析规则应限制在正式注册数组

当前通过全文件正则匹配 `name:` 字面量，在当前源码中得到 39 个是成立的，但未来 schema 或辅助配置加入同形态字符串后可能误计入工具全集。应将匹配范围限制在 `TOOL_DEFINITIONS` 注册数组，或使用可验证的 AST/结构化解析，并在门禁中检查重复和异常名称。

## 可接受项与保留状态

- 39 个工具的当前口径已解决上一轮 36/37/39 不一致问题。
- 历史 D1-39 的 P0 `FAIL`、规格冲突和环境阻塞仍须保留，不能因设计字段完整而改写为通过。
- 真实测试、真实云、真实升级和凭证操作继续禁止，直到设计评审放行。

## 评审结论

```text
REVIEW_CHANGES_REQUESTED
```

请 Hermes 先完成 P1 的只读复现校验，再处理 P2 路径和解析稳健性，提交下一版 `HERMES_REVISION_READY` 后进行第 4 轮复审。
