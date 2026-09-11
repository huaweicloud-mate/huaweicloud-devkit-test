# 版本升级提醒测试设计第七轮复评

> 评审时间：2026-09-10 21:13:04
> 评审对象：`reviews/ITER-004-20260910155945/hermes/`
> 设计文档：`C:\Users\Administrator\devkit-test\hdk\docs\version-upgrade-design.md`
> 被测项目：`C:\Users\Administrator\devkit-test\hdk`
> 评审人：Codex

## 评审结论

`BLOCKED`

本轮确认 Hermes 已接入 Ubuntu 24.04 testbot3，并新增了 Linux 执行证据。D1-49 Linux 和 D1-55 Linux 的扩展探针证据可采信；D1-39 Linux 也有“Linux 不存在 Windows `npm.cmd`/EINVAL 语义”的实测依据。但 Linux 实机为 `aarch64`，正式矩阵对应行仍标记为 `x64`；D1-39 相关 unit/MCP 探针及 D1-52 真实升级探针仍以非零退出结束，D1-52 Linux 升级链没有完成。因此本轮不能签署 `TEST_DESIGN_READY`。

## Findings

### [P1] Linux 证据的架构与矩阵声明不一致

- `results/ITER-004-2026-09-10/evidence/nr3/linux-logs/linux-manifest.json` 记录实际环境为 Ubuntu 24.04.4 LTS、`aarch64`。
- `reviews/ITER-004-20260910155945/terminal-matrix.csv:16,28,32,39` 的 Linux 行仍写 `arch=x64`，没有 `aarch64` 行，也没有说明 ARM64 证据可以代表 Linux x64。
- Node/npm 版本相同不能消除架构差异，尤其是原生依赖、可执行文件和 `npx` 行为可能不同。

必须二选一：接入 Linux x64 重新执行并保留当前 ARM64 证据，或正式把矩阵行改为 `aarch64`、新增 Linux x64 行并将 x64 标为 `BLOCKED`。在完成前，不能称为 Linux x64 已覆盖。

### [P1] Linux 探针非零退出仍被上层矩阵判为 PASS

本轮四个 Linux 探针退出码为：`linux-d1-unit-probe.exit=1`、`linux-d1-mcp-loop.exit=1`、`linux-d1-upgrade-real.exit=1`、`linux-d1-49-d1-55-ext.exit=0`。

- unit 探针存在 5 项 FAIL，其中除 Windows 专测断言外，还包含 D1-50b 的 `npx.cmd` 硬编码问题；
- MCP 探针存在 2 项 FAIL，真实升级探针存在 6 项 FAIL；
- Hermes 将部分失败解释为“Windows 专测断言”或“探针平台限制”，这个解释可以作为诊断，但不能把同一份非零退出的原样探针报告包装成完整 PASS。

应先将探针改成平台感知：Windows 专属断言只在 Windows 执行，Linux 使用 `npm`/`npx` 的对应语义；fixture registry 必须通过 Linux 子进程显式注入。平台化后重新执行，要求 D1-39、D1-52 的相关链路输出清晰、退出码为 0，或按具体失败项更新矩阵状态。

### [P1] D1-52 Linux 真实升级链仍未闭合

`terminal-matrix.csv:32` 仍为 `BLOCKED`。`linux-d1-upgrade-real.stdout.log` 显示真实安装 Phase 1 通过，但升级 p3a-p3c、重启生效 p4a-p4b 没有取得证据，原因包括探针硬编码 `npx.cmd`、npx 子进程没有注入 fixture registry，以及测试机无外网。

这不是完整 Linux 终端验收。必须完成探针平台化和 registry 注入后，重新证明：

- 旧版 1.1.2 的真实安装；
- 真实 `npx` 升级到 1.1.3；
- 文件同步；
- 新进程读取 1.1.3；
- 配置未丢失；
- 失败时不会误报成功。

### [P2] 新增 Linux 证据没有完整纳入交接材料

`hermes/status.md:30,64-70,82,90,97-99` 和 `hermes/test-design.md:19,30-32,47-50,54-59,68-79` 仍有旧的“Linux BLOCKED/未执行”概括、第五轮/第六轮遗留标题和等待内容；执行报告 `:209-221` 已记录 Linux 结果，但顶部执行时间、证据索引和复现说明仍主要指向 Windows `run-logs`，没有把 `linux-logs/linux-manifest.json` 作为同等正式 manifest。

需要统一：

- 实际 Linux 环境为 Ubuntu 24.04.4、aarch64、Node 22.23.2、npm 10.9.8、bash、SSH non-TTY；
- Linux 证据目录和每个探针的退出码；
- 当前矩阵 `PASS 29 / SPEC-MISMATCH 4 / FAIL 1 / BLOCKED 5`；
- D1-52 Linux 仍为 BLOCKED 的准确原因；
- 旧轮次文字只能保留为历史记录，不能出现在当前放行结论中。

### [P1] 完整终端和产品放行仍未满足

当前仍有 5 行 `BLOCKED`：Linux D1-52、macOS/ARM、CodeArtsSpace Hook、TTY/PTY、D1-55-session。D1-39 Windows P0 仍为 `FAIL`，D1-29、D1-43c、D1-46g、D1-55b 仍为 `SPEC-MISMATCH`。

Linux 这次补跑降低了阻塞范围，但没有消除完整终端门槛，也没有消除产品缺陷和规格裁决项。不能开始正式全量 `devkit-test`，也不能标记 `TEST_DESIGN_READY`。

## 本轮确认有效

- Ubuntu testbot3 的 Linux 环境和固定 commit 有 `linux-manifest.json` 记录。
- D1-49/D1-55 扩展探针退出码为 0，分别给出 Linux 结果及 D1-55 的 `PROCESS_SHARED_STATE`/`SPEC`/`BLOCKED session` 分层证据。
- D1-39 Linux 的行为差异具有诊断价值：Linux 使用 `npm` 直启，不复现 Windows `npm.cmd` EINVAL；但当前探针整体非零，需平台化后重跑。
- Windows Hermes Agent E2E/Hook 和 Windows OpenCode 非 Hook 证据继续有效。
- 矩阵与候选矩阵仍保持一致，当前为 39 行；展开矩阵为 132 行。

## 后续动作

1. 修复探针平台差异和 Linux 子进程 fixture registry 注入，重新跑 D1-39 和 D1-52 Linux，确保结果与退出码一致。
2. 处理 Linux 架构矩阵：补 Linux x64，或将 ARM64 单独建行并明确 x64 仍 BLOCKED。
3. 将 Linux manifest、日志和当前统计同步到 `status.md`、`test-design.md` 和执行报告。
4. 继续处理 macOS/ARM、CodeArtsSpace、PTY/TTY、真实 MCP session，以及 D1-39 正式产品修复和四项规格裁决。
5. 保持 `FINAL_STATUS=BLOCKED`，完成上述事项后再由 Codex 复评。

