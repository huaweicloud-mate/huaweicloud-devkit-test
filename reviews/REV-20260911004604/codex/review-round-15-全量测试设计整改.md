# Hermes Round-15 整改评审：聚焦 Round-14 四项整改

## 结论

**REVIEW_CHANGES_REQUESTED**

Round-15 的四项整改大部分已落实，且门禁增强有效；但当前仍存在 P0 FAIL、环境 BLOCKED、规格 SPEC 未闭合，不能给出 `TEST_DESIGN_READY`。另外，D1-58 S5 的 manifest/断言文本与实际 stdout 存在措辞不一致，需补齐证据口径。

## 四项整改核验

### 1. manifest 时间戳

**通过。** `results/ITER-008-20260911072254/evidence/d158/manifest.json` 的 `time` 已为：

`2026-09-11 07:35:00`

未发现原来的 `07:4X:XX` 占位符；时间格式、时区和日期均可审计。

### 2. S3/S5 EXIT=1 语义及 S5 snippet 判定

**语义解释基本合理，但证据文本仍需修正。**

- manifest 新增 `exit_code_semantics`，明确 S3/S5 的 `EXIT=1` 是 `configureGenericMCP` 返回 `false` 的设计预期，不直接等同于功能失败。
- S5 的断言⑤以 snippet 文本在场作为 PASS 依据，而不是以退出码为 PASS 依据；这与日志行为相符。`s5.stdout.log` 实际包含可粘贴的 `mcpServers`/stdio 配置片段、remote 配置提示，并记录 `=== S5 EXIT=1 ===`。
- 但 manifest、追踪表/展开级预期仍写 `No known MCP agent detected`，实际 `s5.stdout.log` 写的是 `No supported agent detected`。若断言是精确文本匹配，S5 证据未完全闭合；应统一产品实际输出、manifest、展开级预期和 requiredEvidence 的措辞，或明确采用等价语义匹配规则。
- 因此，本项不能被表述为无条件的 D1-58 全量 PASS；至少应保留该文本口径差异的审计说明或修正证据/断言。

### 3. 聚合状态收紧

**通过，且未发现夸大 PASS。**

实际追踪表状态为：

- D1-52：`PARTIAL(BLOCKED×2)`；展开级包含 `EXP-NR3-15b` CodeArtsSpace BLOCKED 和 `EXP-NR3-16` Linux 升级链 BLOCKED。
- D1-46：`PARTIAL(SPEC:46g)`；46g 的 reject 防御语义仍明确保留为 SPEC。
- D1-55：`PARTIAL(SPEC+NOT_RUN+BLOCKED)`；展开级分别包含 remote SPEC、remote session NOT_RUN 和 TTY BLOCKED。

这些聚合状态如实反映了部分覆盖，不再把未闭合子项汇总成纯 PASS。`gen_tracing.py` 也已识别 `PARTIAL` 前缀并保持该聚合语义。

### 4. 门禁增强及 BLOCKED 聚合拦截

**通过。**

实跑：

`python test-cases/design/verify_new.py`

结果为 exit 0，状态一致性检查为 PASS，未出现 `[FAIL]`；脚本输出的 NR3 分布为 PASS 18、BLOCKED 4、FAIL 1、SPEC-MISMATCH 1、NOT_RUN 1。

同时做了负向核验：在隔离副本中仅将 D1-52 追踪状态改回 `PASS`，保留其展开级 BLOCKED 子项。门禁明确报：

`追踪表/展开级状态一致性 ... 展开级含BLOCKED`

并以 exit 1 退出。因此，新增规则确实拦截了 BLOCKED 聚合夸大为 PASS；`VALID_STATUS` 对 `PARTIAL` 前缀的支持也已生效。

## Round-14 七项外部依赖复核

本轮无新证据，状态维持 Round-14 判定：

1. **D1-39 / Windows P0 #554：FAIL，未闭合。** `EXP-NR3-09` 仍为 P0 FAIL；模拟修复不能替代发布线回归。
2. **macOS/ARM：BLOCKED，未变。** `EXP-NR3-11` 因无 macOS/ARM 机器或 CI runner 未执行。
3. **CodeArtsSpace：BLOCKED，未变。** `EXP-NR3-15b` 因无可用 CodeArtsSpace 环境未执行。
4. **TTY/PTY：BLOCKED，未变。** `EXP-NR3-21` 缺少真实 PTY 交互环境。
5. **Linux-D1-52 升级链：BLOCKED，未变。** `EXP-NR3-16` 的安装链有证据，但真实升级链仍受探针平台/网络限制。
6. **remote session：NOT_RUN，未变。** `EXP-NR3-20` 当前没有可验证的 session 标识/绑定流程。
7. **规格裁决：未闭合。** `EXP-NR3-19` 的进程级共享与会话隔离要求存在 SPEC-MISMATCH；D1-46g 的 reject 防御语义也仍为 SPEC，相关 D1-29/D1-43c/D1-55b 规格问题未完成裁决。

## 放行阻断项

以下任一项都足以阻止 `TEST_DESIGN_READY`，当前多项同时存在：

- `EXP-NR3-09` / D1-39：P0 FAIL；
- `EXP-NR3-11`、`EXP-NR3-15b`、`EXP-NR3-16`、`EXP-NR3-21`：环境 BLOCKED；
- `EXP-NR3-19`、D1-46g 及相关规格项：SPEC 未闭合；
- D1-58 S5：实际日志为 `No supported...`，而断言/manifest 为 `No known...`，文本证据口径未统一。

本轮未修改 `hermes/`、CSV 真源或门禁脚本，仅提交本评审文件。
