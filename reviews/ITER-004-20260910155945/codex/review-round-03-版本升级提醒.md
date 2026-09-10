# 版本升级提醒测试设计第三轮评审

> 评审时间：2026-09-10T18:00:00+08:00
> 评审者：Codex
> 评审对象：Hermes 第三轮修订
> 归档迭代：`ITER-004-20260910155945`
> 被测项目：`C:\Users\Administrator\devkit-test\hdk`
> 评审结论：`REVIEW_CHANGES_REQUESTED`

## 一、总体结论

本轮修订已经完成第二轮提出的大部分文档和证据整理工作，D1-49 已补齐，
D1-55 已发现并保留真实的实现偏差，原始日志也已经归档。

但是，按照仓库已经固化的放行门槛，本轮仍不能签署
`TEST_DESIGN_READY`。当前阻塞点主要是：

1. Windows/Linux、Hook/非 Hook 和真实 Agent 的“矩阵声明”已经建立，但 Linux、
   Hook 客户端和 Hermes Agent E2E 仍全部是 `BLOCKED`，不满足至少一个 Hook、
   一个非 Hook、Windows 和 Linux 的实际覆盖门槛。
2. 评审归档要求的顶层 `terminal-matrix.csv` 不存在，NR3 也没有同步到
   `test-cases/expanded/`；当前只有 Hermes 候选矩阵，设计级与展开级真源仍未闭合。
3. D1-55 的扩展探针证明了同一进程内两个请求序列的状态共享，但没有建立真正
   MCP session 标识或独立协议会话，尚不足以把结果完整表述为“会话级隔离”验证。
4. 原始 manifest 的时区和被测 commit 采集方式存在可审计性问题，当前日志可读，
   但不能直接作为严格的时间和版本基线。

因此当前状态继续保持：`REVIEW_CHANGES_REQUESTED`。

## 二、必须处理的问题

### [P1] 多终端硬门槛仍未满足，`BLOCKED` 不是实际覆盖

本轮候选矩阵已经明确列出了 Linux、Hook、macOS/ARM、TTY 和 Hermes Agent，
这是正确的记录方式。但实际状态仍为：

- Linux：D1-39、D1-49、D1-52、D1-55 全部 `BLOCKED`；
- Hook 客户端：D1-52 `BLOCKED`；
- Hermes 真实 Agent 会话：D1-54 `BLOCKED`；
- TTY：D1-55 TTY 行 `BLOCKED`；
- Windows 非 Hook OpenCode：已执行；
- Windows 直接 stdio/remote 探针：已执行。

闭环文档的放行门槛是至少覆盖一个 Hook 客户端、一个非 Hook 客户端、
Windows 和 Linux。将未执行路径准确标成 `BLOCKED` 可以避免误报，但不能把
`BLOCKED` 计作已经覆盖。因此：

- 若本迭代目标是“NR3 测试设计可执行”，应保留这些行并明确执行顺序和阻塞影响，
  但不能签署当前流程定义的 `TEST_DESIGN_READY`；
- 若要真正签署 `TEST_DESIGN_READY`，至少需要补上 Linux 代表环境和一个真实
  Hook 客户端；涉及 Hermes 用户行为的 D1-54 仍需真实 Agent E2E，不能用协议层
  等价覆盖替代。

这不是要求把 macOS/ARM/TTY 强行伪造为通过，而是要求区分“设计已列出”和
“门禁所要求的代表终端已实际验证”。

### [P1] 顶层终端矩阵和 NR3 展开级矩阵仍缺失

闭环文档要求评审确认后的矩阵位于：

`reviews/ITER-004-20260910155945/terminal-matrix.csv`

该文件当前不存在。Hermes 的
`hermes/candidate-matrix.csv` 已有 37 行、30 个唯一用例，是有效候选交付，
但还不是评审确认后的正式矩阵。

同时，`test-cases/expanded/用例矩阵-展开级.csv` 当前仍是历史 D5 数据，
其中没有任何 `D1-*` 行。也就是说，Hermes 文档声称“设计级与展开级已闭合”，
但仓库的正式展开级真源尚未同步。

**必须修改：**

- 生成顶层 `terminal-matrix.csv`，内容与最终确认的 Hermes 矩阵一致；
- 为 D1-26~D1-55 生成展开级条目，至少把客户端、OS、Hook/非 Hook、remote、
  TTY 和 BLOCKED 路径展开；
- 更新生成脚本或生成说明，保证设计级和展开级能够复现；
- 不要覆盖历史 D5 数据，新增 NR3 行时保留来源和生成时间。

### [P1] D1-55 当前是“同进程双请求序列”，不是完整的 session-level 验证

`d1-49-d1-55-ext.mjs` 的 D1-55 实现通过同一个 remote URL 发送两次
`initialize`，再用不同 JSON-RPC id 区分 A/B 请求序列。它确实成功证明：

- `hintConsumed` 在当前 server 进程内共享；
- A 消费提示后，B 拿不到提示；
- dismiss 和缓存存在 server/HOME 级共享现象。

但脚本没有使用 MCP session id、session header 或两个独立的长连接会话，
因此“两个客户端”目前更准确地说是“同一进程中的两组请求序列”。这不足以
证明真正 session 生命周期下的行为，也无法区分：

- 被测产品没有实现 session 隔离；
- 测试 transport 本身没有建立 session；
- 设计文档所说的“会话”实际指进程、连接还是 Agent session。

**必须修改：**

- 如果 remote transport 支持 session：使用实际 session 建立流程，分别保留
  A/B 的 session 标识，并并行或交错调用；
- 如果当前 remote transport 不支持 session：在用例中明确降级为
  `PROCESS_SHARED_STATE`，并新增一个 `BLOCKED` 或 `NOT_RUN` 的真实 session
  验证项；
- 把 D1-55b 的 `SPEC-MISMATCH` 继续保留，直到开发裁决“按 session 隔离”还是
  “按进程共享”是正式语义。

### [P2] `120/120 PASS` 的断言统计容易掩盖设计级规格偏差

四个探针的日志确实显示 120 个探针断言全部通过，且退出码为 0；这说明探针
成功观察到了预设结果。但其中 D1-55b 的 PASS 实际表示“成功观测到不符合设计
预期的行为”，不是产品行为通过。

报告目前已经在设计级统计中将 D1-55b 归入 `SPEC-MISMATCH`，方向正确。
为了避免执行阶段误读，统一改成：

```text
探针断言：120/120 checks passed
设计级结果：PASS 24 / SPEC-MISMATCH 4 / FAIL 1 / BLOCKED 1
```

并在日志汇总中把 D1-55b 标为 `OBSERVED_SPEC_MISMATCH` 或类似分类，
不要只输出 `PASS D1-55b`。

### [P2] run-probes manifest 的时间戳没有正确转换为北京时间

`results/ITER-004-2026-09-10/evidence/nr3/run-probes.mjs` 中的
`nowFull()` 只是把 UTC 的 `Z` 替换成 `+08:00`，没有增加 8 小时。
因此 manifest 当前记录：

`2026-09-10T09:19:30.480+08:00`

而同一轮报告记录的是北京时间 17:20 左右。这个时间字符串格式看似正确，
语义实际上错误，会影响执行顺序和证据审计。

**必须修改：**

- 使用真正的时区转换，或统一使用带 `Z` 的 UTC 时间；
- 保证文档正文、manifest 和日志索引对同一执行的时间口径一致；
- 保留当前日志，但修复 runner 后重新执行并生成新一组日志。

### [P2] manifest 的 `hdkGitHead` 取自工作副本，不是沙箱被测对象

`run-probes.mjs` 的 `gitHead()` 固定读取：

`C:/Users/Administrator/devkit-test/hdk`

而实际探针使用的是 `evidence/nr3/.sandbox` 下的 worktree/产物。当前两者
恰好可能一致，但以后工作副本移动或变更后，manifest 会记录错误 commit。

**必须修改：**

- 从 `.sandbox/MANIFEST.md` 或探针实际加载的固定 worktree 读取 commit；
- 或由 `build-sandbox.mjs` 输出 source commit，并由 runner 原样写入 manifest；
- manifest 必须同时记录“源 commit”和“实际执行产物路径”，不能依赖外部工作副本。

## 三、已确认的有效修订

以下内容可以作为后续基线：

- `hermes/test-design.md`、`candidate-matrix.csv`、`status.md` 已经有实际内容，
  且 Hermes 保持 `HERMES_REVISION_READY`，没有越权写成 `TEST_DESIGN_READY`。
- D1-49 已经有真实 MCP/CLI 级断言，覆盖无更新、非法版本、空版本、查询失败、
  未知 target 和默认 target。
- D1-55 已经有真实 remote server 进程级共享状态的实锤，而不是只做函数 mock。
- 四个探针都有 stdout、stderr、exit 文件和 manifest，当前运行退出码均为 0。
- D1-39 的 P0 FAIL、D1-29/D1-43c/D1-46g/D1-55b 的规格偏差、
  D1-54 的真实 Hermes 会话 BLOCKED 均已正确分档。
- 固定版本、隔离 HOME/npm cache/plugin 目录、真实升级和 FIX(sim) 边界说明均已保留。

## 四、第三轮后的状态口径

| 类别 | 当前数量 | 说明 |
|---|---:|---|
| PASS | 24 | 设计级用例达到当前预期 |
| SPEC-MISMATCH | 4 | D1-29、D1-43c、D1-46g、D1-55b |
| FAIL | 1 | D1-39 修复前 Windows P0 |
| BLOCKED | 1 设计用例，8 个矩阵行 | D1-54，以及 Linux/Hook/TTY/macOS/ARM 等展开路径 |
| UNASSESSED | 0 | 设计级 D1-26~D1-55 已有明确状态 |
| 探针 checks | 120/120 | 仅表示探针断言通过，不等于设计级 PASS |

## 五、Hermes 下一步必须交付

1. 补齐并提交顶层 `reviews/ITER-004-20260910155945/terminal-matrix.csv`。
2. 生成 NR3 的展开级矩阵，确保 `test-cases/expanded/` 不再只有历史 D5 条目。
3. 修正 D1-55 的真实 session 建模，或明确把当前证据降级为进程级证据。
4. 修正 runner 的时区转换和 sandbox commit 采集，重新生成日志 manifest。
5. 将探针 checks 与设计级结果分开表述，避免 `120/120 PASS` 被理解成产品通过。
6. 明确 Linux 和 Hook 代表环境的接入安排。若本轮确实无法接入，继续保持
   `BLOCKED`，但本轮不能签署 `TEST_DESIGN_READY`。
7. 开发裁决 D1-29、D1-43c、D1-46g、D1-55b；产品修复后的验证仍应另行保留，
   不能把设计偏差直接改写成 PASS。

完成上述项目后，Hermes 再将状态更新为 `HERMES_REVISION_READY`，由 Codex
进行第四轮复评。当前不要启动正式的全量 `devkit-test` 执行。
