# Hermes Round-16 整改评审：S5 文本口径

## 结论

**REVIEW_CHANGES_REQUESTED**

本轮唯一整改项 S5 文本口径已核验闭合，且 `verify_new.py` 实跑 exit 0。但全局仍有 D1-39 P0 FAIL、环境 BLOCKED 及未闭合的 SPEC 项，因此按评审门槛不能给出 `TEST_DESIGN_READY`。

## S5 核验

### 1. 断言⑤判定目标真实在场

**通过。** `results/ITER-008-20260911072254/evidence/d158/s5.stdout.log` 中真实存在：

- 菜单流程的 `No supported agent detected.`；
- `configureGenericMCP` 层的 `No known MCP agent detected; here is a config snippet you can paste:`；
- 可粘贴的 stdio 配置片段，包含 `mcpServers`、`npx` 与 `huaweicloud-devkit-mcp`；
- remote（Streamable HTTP）配置提示及 `127.0.0.1:9528`。

因此，断言⑤的判定目标是 L18 的 `No known MCP agent detected...` 加上 snippet/remote 交付物，证据中全部在场；EXIT=1 的设计语义也已在 manifest 中说明，不以退出码单独判定失败。

### 2. 两层文本语义消歧

**通过。** `manifest.json` 的 `S5_text_semantics` 明确区分：

- `menu_layer`：L8 `No supported agent detected.`，属于 `promptZeroDetect` 菜单层引导，不是断言目标；
- `assert_layer`：L18 `No known MCP agent detected; here is a config snippet you can paste:`，属于 `configureGenericMCP` 层，是断言⑤判定目标；
- `conclusion`：两层文本均在 `s5.stdout.log` 中真实存在，判定依据为断言层文本、snippet 与 remote 提示。

该说明消除了把菜单层文本误当成断言⑤目标的歧义。

### 3. EXP-D1-58-05、manifest 与门禁一致性

**通过。** `test-cases/expanded/用例矩阵-展开级.csv` 的 `EXP-D1-58-05`：

- 预期结果同时写明菜单层 `No supported agent detected` 与 configureGenericMCP 层 `No known MCP agent detected...`；
- 明确将后者标为断言⑤判定目标；
- `requiredEvidence` 指向 `results/ITER-008-20260911072254/evidence/d158/s5.stdout.log`，并同步描述 snippet 与 remote 提示。

这与 `manifest.json` 的 `S5_text_semantics` 三段说明一致。实跑 `python test-cases/design/verify_new.py` 结果为 exit 0，包含：

`[PASS] 追踪表/展开级状态一致性(R12+R15)`

最终输出为：

`=== 门禁 PASS: 全部检查通过（exit 0） ===`

## 其余状态确认

本轮未对以下未闭合项新增证据，状态维持 Round-15/本轮整改通知所述：

- D1-39 / Windows P0 #554：FAIL；
- macOS/ARM、CodeArtsSpace、TTY/PTY、Linux 升级链：环境 BLOCKED；
- remote session：NOT_RUN；
- D1-29、D1-43c、D1-55b、D1-46g、EXP-NR3-19 等规格裁决：SPEC 未闭合；
- 追踪表仍有 132 行 `UNASSESSED`。

以上任一类问题均阻断 `TEST_DESIGN_READY`。本轮未修改 `hermes/` 或 CSV 真源。
