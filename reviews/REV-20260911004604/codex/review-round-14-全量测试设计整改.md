# Hermes EX 执行轮第 14 轮评审：执行证据核验

## 结论

**REVIEW_CHANGES_REQUESTED**

本轮 Linux 补跑的 5 个展开项具备可复核的 testbot3 证据，且 D1-58 的关键 stdout 文本大部分存在；但不能据此给出 `TEST_DESIGN_READY`：

- D1-39 仍是 Windows P0 FAIL（#554），修复方向的模拟/副本通过不等于发布线回归通过。
- macOS/ARM、CodeArtsSpace、TTY/PTY、Linux-D1-52 升级链仍为 BLOCKED；remote session 为 NOT_RUN。
- D1-29、D1-43c、D1-46g、D1-55b 及 EXP-NR3-19 的规格/实现裁决仍未闭合。
- 追踪表将含 BLOCKED 展开项的 D1-52 聚合为 PASS，语义上高于证据实际覆盖范围；现有门禁未拦截该类状态夸大。
- D1-58 的 S5 归档显示 `EXIT=1`，manifest 的 `time` 为 `07:4X:XX` 占位值。关键提示文本存在，但执行成功性和时间完整性不能按“无条件真机全 PASS”宣称，需补充可审计归档或明确退出码语义。

## 评审范围与核验方法

核对了：

- `reviews/REV-20260911004604/hermes/status.md`
- `results/ITER-004-2026-09-10/evidence/nr3/linux-logs/` 下 4 个 Linux stdout、`linux-manifest.json`
- `results/ITER-008-20260911072254/evidence/d158/` 下 8 个 stdout、`manifest.json`
- `test-cases/expanded/用例矩阵-展开级.csv`
- `test-cases/design/用例矩阵-设计级.csv`
- `test-cases/tracing/需求-设计-证据追踪表.csv`
- `test-cases/design/verify_new.py` 与 `scan_gaps.py`

实际执行结果：

- `python test-cases/design/verify_new.py`：exit 0，设计级 163 行、展开级 137 行、追踪表 169 行，外键与门禁检查全部 PASS。
- `python test-cases/design/scan_gaps.py`：`GATE-PASS`；展开规则空值为 0，36 个工具均有覆盖。

门禁通过只证明结构、枚举、外键和有限的一致性规则满足，不证明所有执行证据、规格或环境路径已经闭合。

## EX 轮 7 项逐项回应

### 1. Linux 5 条 BLOCKED 闭合

**判定：5 个聚合展开项可以接受为“Linux 证据已补齐”，但 D1-46g 必须保留为未裁决的子项。**

| 展开项 | 核验结果 | 评审判定 |
|---|---|---|
| `EXP-NR3-02` / D1-27 | `linux-d1-mcp-loop.stdout.log` 中 D1-41 init/tools/a 通过；`linux-d1-unit-probe.stdout.log` 中 D1-30、D1-35c 通过 | 闭合 |
| `EXP-NR3-04` / D1-42 | mcp-loop D1-42a~e 通过；upgrade-real Phase 5 的 D1-42-real-a/b/c 通过 | 闭合 |
| `EXP-NR3-06` / D1-46 | D1-46a~f、h 的行为通过；D1-46g 明确观察到 reject 直接抛出、未返回 `check_failed` | Linux 证据闭合，规格子项未闭合 |
| `EXP-NR3-08` / D1-53 | unit-probe D1-53fn-a~f 全部通过 | 闭合 |
| `EXP-NR3-24` / D1-45 | mcp-loop D1-45a~f 全部通过 | 闭合 |

D1-46g 与已有 Windows 证据的异常行为一致：注入 `doQuery` reject 后直接冒泡，而不是返回 `check_failed`。这证明不是 Linux 特有差异，但也不能把该子项写成产品契约 PASS；需产品/开发裁决后更新实现或规格。当前 CSV 用父级 `PASS` 加文字备注“46g=SPEC 子项不并入 PASS 计数”表达了该意图，但追踪表 D1-46 仍为 `PASS`，聚合状态不够严格。

### 2. D1-58 五断言真机证据

**判定：关键 stdout 内容可见，S1b/S2b/S3b/S4 的断言内容基本成立；S5 的归档质量不足以支持“无条件全 PASS”。**

- S1b：出现 `[Claude Code] MCP server configured` 与 `[Cursor] MCP server configured`，并列出两个配置文件及两个 `.bak`。
- S2b：出现 merge 后 JSON，`project.owner` 保留，`mcpServers.huaweicloud-devkit` 为唯一条目，并显示 `.bak` 计数为 1。
- S3b：两次出现 `already configured; skipping`，原配置内容展示，`.bak` 计数为 0。
- S4：出现 `No known MCP agent detected`、`not valid JSON` 路径和两行相同 SHA-256：
  `824cddfc13d60cebefe588fd6be2ca8e02cfc...`，支持零写入。
- S5：stdout 确实包含 `No known MCP agent detected`、stdio `mcpServers`/`npx` 片段和 remote 命令提示，但文件同时记录 `=== S5 EXIT=1 ===`。

此外，`d158/manifest.json` 的 `time` 是 `2026-09-11T07:4X:XX+08:00`，不是可审计的完整时间戳。故 D1-58 的功能性文本证据可复核，但执行归档应补齐真实 exit code 解释/成功判定、完整时间戳，并重新绑定最终可审计的 S5 日志后，才可把五行作为无条件 PASS 关闭。

### 3. Windows 专测 FAIL 的平台边界

**判定：本轮判读没有越权把 Windows 专测 FAIL 记为 Linux 产品缺陷。**

Linux unit-probe 的 5 个 FAIL 和 mcp-loop 的 2 个 FAIL 都属于 D1-39 Windows `npm.cmd`/EINVAL 专测或修复前负向场景。Linux 没有 Windows `.cmd`/EINVAL 路径，不能由这些 FAIL 推导 Linux 产品缺陷。该边界判读合规。

但这不改变 D1-39 的 Windows P0 状态：修复副本的 `shell:true`、`node.exe+npm-cli` 等结果只能证明修复方向，不能替代发布线 Windows 1.1.2 存量用户回归。

### 4. 矩阵、追踪表、外键与门禁

**判定：结构门禁闭合；语义状态仍有一处需要修正/补强。**

已核实：

- 行数、列数、ID 唯一性、设计级/展开级外键、追踪表 `designCaseId`/`expandedCaseId` 外键均通过。
- 5 条 Linux 展开项状态为 PASS，D1-58 五行状态为 PASS；requiredEvidence 路径存在于对应归档描述中。
- `verify_new.py` exit 0；`scan_gaps.py` 为 `GATE-PASS`。

需要保留为整改项：

- 追踪表 D1-52 为 `PASS`，但其 `expandedCaseId` 同时包含 `EXP-NR3-15b`、`EXP-NR3-16`，两者分别为 CodeArtsSpace BLOCKED、Linux-D1-52 升级链 BLOCKED。真实升级安装与重启生效不能以整个 D1-52 已 PASS 表述，应改为部分覆盖/未闭合的聚合语义，或拆分追踪行。
- D1-46 的父级追踪状态为 PASS，但其 requiredEvidence 明确包含 reject 防御语义，Linux 日志和 Windows 证据都显示该子项 SPEC-MISMATCH。应让追踪状态或子断言结构显式保留 SPEC，而不是仅依靠备注。

根因是门禁的状态一致性规则只阻止“展开级存在 FAIL/SPEC 时追踪父级为 PASS”，没有将 BLOCKED 聚合为未闭合，也无法解析 requiredEvidence/执行要点中的子断言 SPEC 文本。因此 exit 0 不能推翻以上语义问题。

### 5. 剩余未闭合项

以下状态确认仍有效，不能在本轮关闭：

- **D1-39 / EXP-NR3-09：FAIL，P0**。Windows `npm.cmd` EINVAL 静默失败；待发布线修复版本回归。
- **macOS/ARM / EXP-NR3-11：BLOCKED**。无机器或 CI runner。
- **CodeArtsSpace / EXP-NR3-15b：BLOCKED**。无可用客户端环境。
- **TTY/PTY / EXP-NR3-21：BLOCKED**。尚无声明范围内的真实 Windows TTY/PTY 证据。
- **Linux-D1-52 升级链 / EXP-NR3-16：BLOCKED**。真实 npm/npx 拉取及探针平台化仍未完成。
- **remote session / EXP-NR3-20：NOT_RUN**。remote transport 无 session 标识/绑定；现有证据只能说明 PROCESS_SHARED_STATE。
- **规格裁决**：D1-29、D1-43c、D1-46g、D1-55b，以及 EXP-NR3-19 的 remote 双请求语义仍未裁决。D1-46g 虽完成 Linux 复核，但“行为一致”不是“规格闭合”。
- **132 行 UNASSESSED**：仍需后续执行轮，不因本轮新增 5 条 Linux 判读和 5 条 D1-58 证据而关闭。

### 6. 出口标准与本轮净效果

**判定：部分达成，不满足放行门槛。**

本轮有效净效果是：Linux 5 条环境补跑从 BLOCKED 进入有证据的聚合 PASS，D1-58 增加了真机 stdout 证据，结构门禁保持通过。与此同时，P0 FAIL、环境 BLOCKED、remote NOT_RUN、规格未决和大量 UNASSESSED 仍存在；并且 D1-52/D1-46 聚合状态需要收紧。

### 7. 仍需外部确认与后续动作

需要外部执行或产品/开发决策，不能由本轮文件审查替代：

1. 发布线修复后的 Windows D1-39 全链回归。
2. macOS/ARM、CodeArtsSpace、Windows TTY/PTY 环境接入，或正式撤销对应支持承诺。
3. Linux-D1-52 真实升级链的可联网、平台化探针执行。
4. remote session 是否支持及 D1-55 的会话隔离语义裁决。
5. D1-29、D1-43c、D1-46g、D1-55b/EXP-NR3-19 的规格裁决。
6. 补齐 D1-58 manifest 时间、S5 退出码和最终证据绑定。
7. 继续执行 132 行 `UNASSESSED` 及其余设计级契约。

## 最终判定

**REVIEW_CHANGES_REQUESTED**

本轮不修改 `hermes/`、任何 CSV 真源或门禁脚本；仅提交本评审文件。
