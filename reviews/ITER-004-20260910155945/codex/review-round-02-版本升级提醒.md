# 版本升级提醒测试设计第二轮评审

> 评审时间：2026-09-10 16:45:00
> 评审者：Codex
> 评审对象：Hermes 本轮补充执行记录
> 归档迭代：`ITER-004-20260910155945`
> 被测项目：`C:\Users\Administrator\devkit-test\hdk`
> 评审结论：`REVIEW_CHANGES_REQUESTED`

## 一、结论

本轮补充执行本身已经明显提高了证据质量，但目前仍不能将测试设计标记为
`TEST_DESIGN_READY`，也不能据此进入正式的 `devkit-test` 执行放行。

主要原因不是“没有执行”，而是以下放行门禁仍未闭合：

1. Hermes 没有把本轮交付同步到约定的 `reviews/<iteration>/hermes/` 目录，正式交接文件仍全部是占位模板。
2. 多终端要求没有满足：当前 NR3 证据集中在 Windows 下的直接 stdio MCP 探针，没有 Linux、Hook 客户端、非 Hook 客户端和真实 Agent 宿主生命周期证据。
3. 设计矩阵中的 D1-49 和 D1-55 没有在本轮结果中明确标记或执行，属于未评估用例。
4. D1-39 的 P0 失败、D1-29/D1-43c/D1-46g 的规格偏差被正确暴露，但尚未完成开发裁决或修复闭环。
5. 报告声明了 `106/106 PASS`，但没有提供与该结论对应的原始 stdout/stderr、退出码和环境清单，无法独立复核断言统计。

因此本轮结论为：`REVIEW_CHANGES_REQUESTED`。

## 二、优先级问题

### [P1] 正式 Hermes 交接物仍为空，当前无法作为设计交付验收

实际补充记录位于：

`results/ITER-004-2026-09-10/NR3版本升级提醒-补充执行记录.md`

而约定的 Hermes 交接目录仍是占位内容：

- `reviews/ITER-004-20260910155945/hermes/test-design.md`
- `reviews/ITER-004-20260910155945/hermes/candidate-matrix.csv`
- `reviews/ITER-004-20260910155945/hermes/status.md`

其中 `status.md` 仍为 `INIT`，候选矩阵只有表头，`test-design.md` 没有本轮实际设计内容。执行记录可以作为
`results` 证据归档，但不能替代 Hermes 的设计交接。否则 Codex 无法确认本轮究竟修改了哪些用例、哪些终端、哪些证据是设计必需项，以及下一轮应复核的版本。

**要求 Hermes 修改：**

- 将本轮实际设计同步到 `reviews/ITER-004-20260910155945/hermes/test-design.md`。
- 将每条受影响用例展开到 `candidate-matrix.csv`，至少填写 `caseId`、`terminal`、`agent`、`os`、`arch`、`node`、`npm`、`shell`、`ttyMode`、`installLayout`、`mcpTransport`、`hookSupport`、`executionLevel`、`requiredEvidence` 和 `status`。
- 补齐 `status.md` 的基线、轮次统计、证据路径和放行检查；完成后将 Hermes 状态改为 `HERMES_REVISION_READY`，不要自行填写 `TEST_DESIGN_READY`。

### [P1] 多终端门禁仍未满足

本轮 NR3 记录的执行环境是 Windows 10 / Node v22.23.2 / npm 10.9.8，证据主要来自：

- 函数级探针；
- 直接启动被测 MCP stdio 进程；
- 一个 OpenCode 布局下的真实安装、升级和重启。

这足以证明部分实现和 Windows 进程链路，但不能证明多终端兼容性。当前缺少：

- Linux 端证据；
- 至少一个 Hook 客户端；
- 至少一个非 Hook 客户端的真实 Agent/宿主生命周期；
- 真实客户端的安装、配置发现、进程启动、重启和提示消费；
- remote/TTY/权限边界的证据，或者明确的 `BLOCKED` 记录。

`results/ITER-005-20260910160332` 中的 Linux/Windows 结果属于另一项安装/MCP wiring 设计，不能直接充当 NR3 版本升级提醒的客户端行为证据。不同设计、不同用例、不同被测行为不能跨迭代借证。

另外，直接 MCP 进程测试不能替代客户端适配证据。它可以归类为 `COMMON` 或
`CROSS_PROCESS`，但不能自动满足 `CLIENT_MATRIX`、`AGENT_E2E` 或 Hook 生命周期要求。

**要求 Hermes 修改：**

- 在候选矩阵中把用例明确分类为 `COMMON`、`CLIENT_MATRIX`、`OS_MATRIX`、`AGENT_E2E` 或 `CROSS_PROCESS`。
- 至少补充 Windows + Linux，以及一个 Hook 客户端 + 一个非 Hook 客户端的 NR3 代表性路径。
- 对 macOS、ARM、remote、TTY 等声明支持的路径提供证据；暂时无法执行的必须写明阻塞原因、影响范围和后续解除条件，不能留在空白状态。
- 对 D1-54 的 Hermes 会话限制继续保留为 `BLOCKED`，但不能用机制级等价证据替代真实 Hermes 会话验收。

### [P1] D1-49 和 D1-55 未纳入结果，造成设计追踪断裂

这两个用例已经存在于设计级矩阵，但本轮补充报告没有结果分档，也没有对应探针：

- **D1-49：upgrade handler 无更新与参数校验。**
  当前报告只列出了 D1-50 的 upgrade 命令语义和 handler 层 `up_to_date` 守卫，不能据此推断 D1-49 的全部断言已经覆盖。D1-49 需要逐项覆盖无更新、`check_failed`、版本缺失/空值、非 latest 目标、目标缺失和未知目标等输入。
- **D1-55：多会话提示隔离。**
  当前 D1-48 使用不同 HOME 和不同进程验证隔离；这不能证明同一个 MCP server 上两个并行客户端/会话之间的
  `hintConsumed`、缓存和 dismiss 状态隔离。D1-55 必须使用同一 server 的两个独立 session 或并发 MCP client，并证明 A 会话消费提示、dismiss、刷新缓存不会影响 B 会话。

未执行的用例可以是 `BLOCKED`，但必须显式标记并说明原因；不能在总断言通过数中隐含掉。

### [P1] 已发现的产品失败和规格偏差尚未形成可放行闭环

Hermes 对问题分类是正确方向，但设计放行仍不能跳过这些结论：

| 用例 | 当前结论 | 放行要求 |
|---|---|---|
| D1-39 | 修复前 Windows `npm.cmd` 链路 EINVAL，P0 FAIL | 保留修复前失败证据；修复后的模拟副本只能证明修复方向，不能替代固定 upstream 修复版本的回归证据 |
| D1-29 | prerelease 是否提醒 `next` 与设计文档不一致 | 由开发确认规则；然后更新设计文档或调整实现/预期，并重新生成矩阵 |
| D1-43c | registry 失败且 `dismiss=true` 时返回 `up_to_date` 并写入伪冷却 | 明确规格是否接受；若不接受，修复失败路径并补回归证据 |
| D1-46g | 注入 Promise reject 时异常直接冒泡 | 明确是否要求防御性封装；若要求，补 `check_failed` 和恢复回归证据 |
| D1-54 | Hermes 真实会话 BLOCKED | 保留阻塞，不得将协议层等价覆盖写成会话级 PASS |

本轮的 `FIX(sim)` 能够证明探针和修复方向有效，但不能把模拟修复副本的通过结果写成产品固定版本已经修复。

### [P2] `106/106` 缺少可独立复核的原始运行证据

当前提交了脚本、固定 commit 和 `.sandbox/MANIFEST.md`，这是可复现基础，且脚本语法检查通过；但尚未看到三类探针的原始运行输出文件：

- `d1-unit-probe.mjs` 的完整 stdout/stderr 和退出码；
- `d1-mcp-loop.mjs` 的完整 stdout/stderr 和退出码；
- `d1-upgrade-real.mjs` 的完整 stdout/stderr 和退出码。

报告中的 `106/106` 因此目前只能作为 Hermes 声明，不能作为可审计结果。应为每次运行保留原始日志，并在 manifest 中记录命令、开始/结束时间、Node/npm、OS、架构、shell/TTY、commit、沙箱路径和退出码。汇总报告中的断言数必须能由日志逐项追溯。

### [P2] 时间和路径引用仍未统一

补充记录使用了 `2026-09-10 16:20（北京时间）`，不符合本轮约定的文档时间格式
`YYYY-MM-DDTHH:mm:ss+08:00`。同时仍引用旧路径
`Hermes测试用例评审-版本升级提醒.md`，应改为：

`reviews/ITER-004-20260910155945/codex/review-round-01-版本升级提醒.md`

文件夹和文件名中的紧凑时间戳可以继续使用 `YYYYMMDDHHmmss`；文档正文中的生成时间、执行时间和更新时间统一使用北京时间时间戳 `YYYY-MM-DD HH:mm:ss`。

## 三、已确认的有效补强

以下内容本轮方向正确，可以保留并作为下一轮基线：

- 正式版、next 线、dev 和模拟修复副本固定到了 commit/版本，且提供了沙箱来源清单。
- 使用独立 HOME、缓存、插件目录和 `HUAWEICLOUD_HOME`，降低了本机污染和状态串扰风险。
- D1-41、D1-42、D1-45 已补充真实 MCP stdio 闭环，包含提示消费、dismiss、落盘和进程重启后的状态读取。
- D1-52 已覆盖一次真实 npm/npx 安装升级、目标文件同步、配置保留和新进程重启生效。
- D1-40/D1-53 使用受控 fixture 构造镜像滞后和坏响应，证据强度高于只观察当前 registry。
- PASS、SPEC-MISMATCH、FAIL、BLOCKED 已经开始分档，特别是没有把 D1-39 修复前失败伪装成通过。
- 五个证据脚本已完成 `node --check`，脚本本身至少通过语法级验证。

## 四、当前追踪口径

### D1-41~D1-55

| 分类 | 用例 |
|---|---|
| 已有 PASS 证据 | D1-41、D1-42、D1-44、D1-45、D1-47、D1-48、D1-50、D1-51、D1-52、D1-53 |
| 部分 PASS，含规格偏差子项 | D1-43（`D1-43c` 为 SPEC-MISMATCH）、D1-46（`D1-46g` 为 SPEC-MISMATCH） |
| BLOCKED | D1-54 |
| 未覆盖或未分类 | D1-49、D1-55 |

报告中“新增 D1-41~55 中 10 条通过”可以保留，但必须同时列出 D1-43c、D1-46g、D1-49、D1-54、D1-55，不能用“106/106”掩盖设计级未评估项。

### 总体状态

当前应记录为：

- `PASS`：已有证据支持的用例；
- `SPEC-MISMATCH`：D1-29、D1-43c、D1-46g；
- `FAIL`：D1-39 修复前 Windows P0；
- `BLOCKED`：D1-54；
- `UNASSESSED`：D1-49、D1-55；
- `REVIEW_CHANGES_REQUESTED`：正式设计交接、多终端矩阵和审计证据尚未闭合。

## 五、Hermes 下一轮必须交付

1. 更新 `reviews/ITER-004-20260910155945/hermes/` 下的三份正式交接文件，并把状态改为 `HERMES_REVISION_READY`。
2. 把 D1-49、D1-55 补齐；不能执行时显式写 `BLOCKED`，并保留影响范围和解除条件。
3. 补充 Windows/Linux、Hook/非 Hook 客户端矩阵；将直接 MCP 探针和真实 Agent E2E 分层记录。
4. 为每条受影响用例填充终端、Agent、OS、架构、Node/npm、shell/TTY、安装布局、MCP 传输和 Hook 能力。
5. 保留 D1-39 的修复前 P0 FAIL；固定修复版本后再提供产品级回归证据，不能用 `FIX(sim)` 代替。
6. 完成 D1-29、D1-43c、D1-46g 的规格裁决，更新设计文档/实现/预期中的对应一方，并重新生成唯一真源矩阵。
7. 保存三类探针的原始日志、退出码和环境 manifest，修正正文时间格式及旧路径引用。
8. 交付后将 Hermes 状态更新为 `HERMES_REVISION_READY`，由 Codex 进行第三轮复评。

在上述项目完成前，本轮不能签署 `TEST_DESIGN_READY`。
