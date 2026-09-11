# 版本升级提醒测试设计第六轮复评

> 评审时间：2026-09-10 20:15:51
> 评审对象：`reviews/ITER-004-20260910155945/hermes/`
> 设计文档：`C:\Users\Administrator\devkit-test\hdk\docs\version-upgrade-design.md`
> 被测项目：`C:\Users\Administrator\devkit-test\hdk`
> 评审人：Codex

## 评审结论

`BLOCKED`

Hermes 已完成第五轮要求的文档整改，交接材料中的旧统计和矛盾结论已清理；Windows Hermes Agent E2E / Hook 客户端证据也已通过复核。本轮没有发现新的测试设计遗漏，但“完整终端验收”仍未完成：正式矩阵仍有 8 行 `BLOCKED`，并且没有新增 Linux 实机证据。根据用户已确认的完整验收口径和归档闭环文档的终端硬门槛，本轮不签署 `TEST_DESIGN_READY`。

## Findings

### [P1] Linux 代表终端仍未执行，完整终端门槛未闭合

- `reviews/ITER-004-20260910155945/terminal-matrix.csv` 当前仍为 `PASS 26 / SPEC-MISMATCH 4 / FAIL 1 / BLOCKED 8`。
- D1-39 Linux、D1-49 Linux、D1-52 Linux OpenCode、D1-55 Linux remote 仍为 `BLOCKED`；本轮证据目录中没有 Linux、Ubuntu、Debian 或 testbot 的执行日志。
- `hermes/status.md:62-70` 已如实记录无 Linux 测试机、SSH 无凭据、WSL 无发行版和 Docker 未安装，并给出了解除条件，但这只能证明“阻塞被正确记录”，不能证明 Linux 已验收。
- 归档闭环门槛 `docs/06-Hermes-Codex测试设计评审闭环.md:257-276` 明确要求至少覆盖一个 Hook 客户端、一个非 Hook 客户端、Windows 和 Linux；当前 Hook/非 Hook/Windows 已满足，Linux 仍不满足。

必须接入真实 Linux 环境，使用本轮固定版本和同一套探针，归档 stdout、stderr、exit code、环境 manifest 后再复评。历史迭代证据不能直接替代本轮 NR3 证据。

### [P1] 其他声明支持路径仍未形成完整终端验收

以下路径仍是正式矩阵中的 `BLOCKED`，不能作为已完成验收处理：

- macOS/ARM：无机器或 CI runner；
- CodeArtsSpace Hook：无可用客户端环境；
- Windows TTY/PTY：当前只有 PowerShell non-TTY 管道；
- D1-55-session：remote transport 没有 `MCP-Session-Id` 和 session 状态绑定。

其中 Hermes Hook 已经满足“至少一个 Hook 客户端”的代表性硬门槛，但不能替代 CodeArtsSpace、TTY 或真实 session 路径本身的证据。若这些能力属于声明支持范围，必须逐项执行；若暂不支持，必须继续保持 `BLOCKED` 并由产品/开发明确范围，不得宣称“完整终端验收”。

### [P1] 产品缺陷和规格裁决仍阻止产品级放行

- D1-39 Windows P0 `EINVAL` 仍为 `FAIL`；`FIX(sim)` 不是正式产品修复版本。
- D1-29、D1-43c、D1-46g、D1-55b 仍为 `SPEC-MISMATCH`。
- D1-55-session 仍为 `BLOCKED(NOT_RUN)`，因为当前 remote transport 不支持真实 session 隔离。

这些问题不影响测试设计文档继续作为执行依据，但在正式产品验收或发布放行前必须完成规格裁决和正式修复版本回归。

## 本轮确认已闭合

- `hermes/status.md`、`hermes/test-design.md` 和执行报告已统一为当前统计，不再把 D1-54 或 Hermes Hook 误报为 BLOCKED。
- 当前矩阵为 39 行，状态为 `PASS 26 / SPEC-MISMATCH 4 / FAIL 1 / BLOCKED 8`。
- 展开矩阵为 132 行，其中 NR3 展开 25 行。
- 矩阵与候选矩阵内容一致。
- Hermes E2E manifest 仍提供 5 个隔离会话、48 次工具调用，S1/S2/S3/S4/S6 全部 PASS。
- run-logs 下 20 个文件和 NR3 `.mjs` 证据脚本可通过现有语法检查。
- 所有当前未执行项均已明确标注原因、影响和解除条件，没有把 BLOCKED 或 mock 结果伪装成 PASS。

## 后续动作

1. 接入 Linux 测试机，按当前固定版本和探针补跑 4 个 Linux 矩阵行，并归档完整日志和 manifest。
2. 对 macOS/ARM、CodeArtsSpace、TTY/PTY 和真实 MCP session 完成执行或明确正式支持范围及豁免决策。
3. 完成 D1-29、D1-43c、D1-46g、D1-55b 的规格裁决，并使用正式产品修复版本回归 D1-39。
4. 条件完成后由 Codex 再次复评；在此之前 `FINAL_STATUS` 保持 `BLOCKED`，不得标记 `TEST_DESIGN_READY`。

