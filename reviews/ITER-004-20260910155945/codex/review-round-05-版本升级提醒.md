# 版本升级提醒测试设计第五轮评审

> 评审时间：2026-09-10T19:51:53+08:00
> 评审对象：`reviews/ITER-004-20260910155945/hermes/`
> 设计文档：`C:\Users\Administrator\devkit-test\hdk\docs\version-upgrade-design.md`
> 被测项目：`C:\Users\Administrator\devkit-test\hdk`
> 评审人：Codex

## 评审结论

`BLOCKED`

Hermes 本轮补齐的 Windows Hermes Agent E2E / Hook 客户端证据有效，可以关闭 D1-54 以及 Hermes Hook 真实生命周期的未执行项。但这不等于“完整终端验收”完成：当前正式矩阵仍有 8 行 `BLOCKED`，其中 Linux 4 行、macOS/ARM 1 行、CodeArtsSpace Hook 1 行、TTY 1 行、真实 MCP session 1 行。按照用户已选择的“完整验收，不接受受限范围豁免”，本轮不能签署 `TEST_DESIGN_READY`。

## Findings

### [P1] 完整终端门槛仍未满足

- `terminal-matrix.csv:16,17,28,32,34,38,39,40` 仍为 `BLOCKED`。
- Linux 的 D1-39、D1-49、D1-52、D1-55 没有本轮 NR3 实机日志；矩阵记录的是无可用 Linux 测试机、SSH 无凭据、WSL 无发行版、Docker 未安装。历史迭代的 Linux 证据不能替代本轮相同被测版本、命令和 manifest 的证据。
- macOS/ARM、CodeArtsSpace Hook、Windows TTY、真实 MCP session 也仍没有可验收证据。CodeArtsSpace 不是“至少一个 Hook”硬门槛的唯一实现，因为 Hermes Hook 已经通过，但在用户明确选择完整验收的口径下，声明支持的终端和交互路径不能直接按未执行放行。
- 必须接入 Linux 测试机并跑同一套 NR3 探针；同时对 macOS/ARM、CodeArtsSpace、PTY/TTY、真实 session 明确执行或保留为正式阻塞项，不能将“无法提供环境”改写为 PASS。

### [P1] 交接文档和执行报告存在旧数据，当前不可作为单一真源

当前矩阵实际为 `39` 行，状态分布为 `PASS 26 / SPEC-MISMATCH 4 / FAIL 1 / BLOCKED 8`，展开矩阵实际为 `132` 行。但：

- `hermes/status.md:50-51,61-66` 仍写 `38` 行、`131` 行和 `70 + 24`；
- `hermes/status.md:73` 仍把 D1-54 和 Hook 写成待补执行，`hermes/status.md:69-75` 仍是第四轮前的待办；
- `hermes/test-design.md:33,69,72-73,76-82` 仍出现 D1-54 `BLOCKED`、`24/4/1/1`、`131` 行以及“Hook 未达”等旧结论；
- 执行报告 `NR3版本升级提醒-补充执行记录.md:95-96` 仍写 Hook 和 Agent E2E `BLOCKED`，但同一文件 `:131-159` 又写 D1-54 和 Hermes Hook 已通过。

Hermes 需要统一更新 `status.md`、`test-design.md` 和执行报告，保留旧失败基线但标注其轮次和用途，统一使用当前矩阵与 E2E manifest 的统计，消除相互矛盾的放行结论。

### [P1] 产品级失败和规格不一致仍未解决

- D1-39 Windows P0 `EINVAL` 仍为 `FAIL`；FIX(sim) 只能证明修复方向，不能作为产品修复版本的验收证据。
- D1-29、D1-43c、D1-46g、D1-55b 仍为 `SPEC-MISMATCH`，其中 D1-55-session 由于 remote transport 没有 session 标识和状态绑定而 `BLOCKED(NOT_RUN)`。
- 因此即使终端证据补齐，也还需要开发或产品对四项规格差异作裁决，并对 D1-39 的官方修复版本做回归。测试设计可在这些问题保留的情况下执行，但当前不能给出产品通过或发布放行结论。

### [P2] Hermes Agent E2E 已通过，但需按测试环境前置条件归档

`run-logs/hermes-e2e-manifest.json` 记录了 Windows 10 x64、Hermes `v0.19.1`、隔离 profile `nr3-test`、5 个会话、48 次工具调用，S1/S2/S3/S4/S6 全部 `PASS`。这足以把 D1-54 和 Hermes Hook 客户端生命周期从 `BLOCKED` 更新为 `PASS`。

其中 HER-1 是 Hermes 测试 venv 的 MCP SDK 漂移，实际为 `mcp==2.1.1`，而 Hermes 声明 `mcp==1.28.1`；通过对齐测试 venv 后复测通过。该处理没有改动 Hermes 代码或 default profile，但必须继续在 manifest 和执行报告中作为测试环境前置条件保留，不能误报为被测项目修复。

## 已确认通过项

- Windows x64 非 Hook OpenCode 的真实 install → upgrade → restart 链路保持 `PASS`。
- Windows x64 Hermes Hook / Agent 真实闭环已由 `hermes-e2e-s1b.out.log`、`s2`、`s3`、`s4`、`s6` 和 manifest 支撑。
- `terminal-matrix.csv` 与 `hermes/candidate-matrix.csv` 当前内容一致，均为 39 行、16 列。
- `test-cases/expanded/用例矩阵-展开级.csv` 当前为 132 行，NR3 展开为 25 行。
- 当前应采用的统计是：设计级 `PASS 25 / SPEC-MISMATCH 4 / FAIL 1 / BLOCKED 0`；终端矩阵 `PASS 26 / SPEC-MISMATCH 4 / FAIL 1 / BLOCKED 8`。设计级 BLOCKED 为 0 不能覆盖终端矩阵 BLOCKED。

## 必须完成的动作

1. 接入实际 Linux 测试机，使用本轮被测版本和同一套探针，归档 stdout、stderr、exit code 和环境 manifest，并更新四个 Linux 行。
2. 对 macOS/ARM、CodeArtsSpace Hook、PTY/TTY 和真实 MCP session 逐项执行；若仍无环境或产品不支持，继续保留 `BLOCKED`，不得宣称完整验收。
3. Hermes 统一同步三份交接材料中的轮次、时间、D1-54 状态、矩阵 39 行、展开 132 行和 `26/4/1/8` 统计。
4. 对 D1-29、D1-43c、D1-46g、D1-55b 完成规格裁决，并用正式产品修复版本重跑 D1-39。
5. 上述条件完成后，再由 Codex 复评；在此之前保持 `FINAL_STATUS=BLOCKED`，禁止标记 `TEST_DESIGN_READY`。

