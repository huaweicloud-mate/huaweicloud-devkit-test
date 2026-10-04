# 历史问题关联清单（当日复现，已跟踪，不重复开单）

> 本日 10 项产品缺陷经查重（GitHub REST API `GET /repos/huaweicloud/huaweicloud-devkit/issues?state=open`，token 读权限），
> **全部命中上游仓已有开放 issue/PR**（含 #844/#845/#846 合并单及其修复 PR #847/#848/#842/#843/#818）。
> 依据 AGENTS 红线 2「命中即历史问题 → 不重复开单」，本次**不新开重复合并单**，仅登记关联清单；
> 按 AGENTS 前置「不自行 close/reopen/评论任何 GitHub issue（由维护者统一操作）」，亦不对既有单追加评论。
> 本机 `gh` CLI 为受限 shim（无 `issue list`），查重改用 REST API 完成。

| # | 用例 | 级别 | 缺陷 | 关联历史单 |
|---|---|---|---|---|
| 1 | D9-12 | P0 | initialize 握手前置状态机缺失 | #774 / #818 |
| 2 | D3-S1 | P1 | 「云主机」中文意图路由未命中 | #844 / #842 / #705 |
| 3 | D10-3 | P1 | 评测集路由准确率 92.9%（1 MISS） | #705 / #844 |
| 4 | EXP-E01 | P1 | 评测集路由 MISS | #705 / #805 / #846 |
| 5 | D4-25 | P2 | Python hook 事件遥测分类错误+目录写偏 | #844 / #847 |
| 6 | D4-26 | P2 | findings.evidence 未脱敏 | #844 / #847 |
| 7 | D8-9 | P2 | telemetry sanitizeValue 未脱敏 | #844 / #847 |
| 8 | D1-65 | P2 | DEBUG 开关仅认 'true' | #844 / #847 |
| 9 | D1-68 | P2 | region 优先级与契约相反 | #844 / #847 |
| 10 | D3-S5 | P2 | 复合意图分层路由未拆分 | #788 / #789 |

## 命中历史单摘要（REST API 实测，state=open，2026-10-05）

- **#774** `[每日测试] Hermes Windows 2026-09-21: D9-4 MCP未强制initialize前置 + D9-9 取消能力未声明`
- **#788** `[P2] D3-S5 复合意图分层路由未拆分命中（拆分自 #786）`
- **#789** `feat: #788 expand serviceCatalog routeMap for Chinese compound intent splitting and phased...`（修复 PR）
- **#805** `[每日测试] Hermes-GLM-5.2 2026-09-23 测试发现：D4-23 SPEC-MISMATCH + EXP-E01~E14 路由基线`
- **#818** `fix(mcp): #814 restore version check in initialize and enforce -32600 pre-init guard`（修复 PR，未发布到 npm `next`）
- **#842** `fix: #705 add '云主机' alias to ECS routeMap keywords`（修复 PR）
- **#843** `fix: #815 extend routeMap keywords + explain_error routing`（修复 PR）
- **#844** `[测试报告] huaweicloud-devkit 1.1.8-next.1 每日测试缺陷合并单（Hermes Linux 2026-10-02，6 项）`
- **#845** `[daily-test] safety-policy 安全检测覆盖不足 + serviceCatalog 中文路由缺失 (8 FAIL: P0x4 P1x4)`
- **#846** `[测试报告] huaweicloud-devkit v1.1.8-next.1 每日测试缺陷合并单（1 项）`
- **#847** `fix: #844 修复 v1.1.8-next.1 每日测试 6 项缺陷（路由+脱敏+遥测+DEBUG+region）`（修复 PR，未发布到 npm `next`）
- **#848** `fix: #841 修复每日测试8项历史缺陷（P0×4+P1×4）`（修复 PR）

## 当日复现说明

- SUT 仍为 `huaweicloud-devkit@1.1.8-next.1`（npm `next` tag，gitHead `ffd7b474`），与 #844 报告的版本一致；相关修复 PR（#818/#842/#843/#847/#848）尚**未发布到 npm `next`/正式包**，故本日全量重跑原样复现 10 项产品缺陷，无新增、无回归变化。
- 本日测试侧改进：`D3-S6` 探针修复（补 FunctionGraph required 参数 + TIMER 触发器绑定 + 删除去 `:latest`）后真云实测 PASS，故状态分布由前一日 `PASS 132 / FAIL 8 / SPEC 3 / NOT_RUN 2` 变为 `PASS 133 / FAIL 7 / SPEC 3 / NOT_RUN 2`。
- 今日证据：`evidence/<case-id>/stdout.log`（本机 2026-10-05 新鲜执行），逐条见 `FINDINGS.md`。