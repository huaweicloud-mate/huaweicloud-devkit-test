# 历史问题关联清单（不重复提单）

> 说明：testbot3 上 file_issue.py 因 gh shim 拉取 issue 失败而跳过查重、误开 #707 已关闭。本清单为**本机（Windows）复核**得到的 5 项缺陷历史关联。全部命中既有历史单，Linux 侧 v1.1.5 为复核确认、不新增缺陷。

| 用例 | 级别 | 缺陷 | 历史单 | 复核结论 |
|---|---|---|---|---|
| D4-16 | P0 | sh -c 包裹凭证 env 打印未拦截 | #677 / #682 / #694 | 仍穿透（#694 标「历史关联 #561 #677 复现确认」） |
| D10-3 / EXP-E | P1 | serviceCatalog 路由命中率 21.4% | #689 | 仍 21.4%（11/14 MISS） |
| D9-2 | P1 | invalid params 未返回 -32602 | #704（缺 required 校验）+ #672（错误码未区分） | -32602 新变体，已在 #672 补复核评论 |
| D8-4 | P1 | INSTALL.md 未随包发布 | #694 | 仍缺失 |
| D9-9 | P1 | notifications.cancellation 未声明 | #698 | 仍缺失（SPEC-MISMATCH） |

- 证据：`results/Hermes/2026-09-16-1.94.218.129/Linux/`（Linux 全量）+ `results/Hermes/2026-09-16-192.168.0.102/Windows/`（Windows 全量），双 OS 结论一致。
- 重复单 #707 已关闭（issuecomment-5691679660）。