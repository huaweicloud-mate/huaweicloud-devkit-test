# 历史问题关联清单（不重复提单）

> 本轮 FINDINGS.md 的 8 项产品缺陷中，6 项经 `file_issue.py` 查重命中上游仓 `huaweicloud/huaweicloud-devkit` 历史 open issue（强关联），**不重复开单**，仅在此列出关联单号 + 内容。剩余 2 项（D1-67 env 改名、D9-13 policy.version）为组合进合并单的新契约漂移，按任务约定「提单由维护者统一做」移交维护者统一合一张缺陷单。

| 本轮缺陷 | 关联历史单（强关联） | 说明 |
|---|---|---|
| D4-15 URL 编码操作绕过写检测 | #682（安全策略绕过缺陷合并单 2 项 P0）、#677（Hermes Windows P0 汇总 D1-39/D4-2/D4-3/D4-15/D4-16）、#1055（v1.1.13-next.0 每日合并单） | URL 编码 `%44elete` 绕过 write 检测，v2 仍复现 |
| D10-3 / EXP-E01 路由残留 MISS | #852（serviceCatalog 中文意图路由覆盖不足 21.4%）、#705（中文意图路由准确率仅 21.4%）、#844（Hermes Linux 每日合并单） | gate 放行后 92.9%，残留「查云主机」关键词缺口 |
| D8-9 sanitize 未脱敏 AK/SK/token | #980（telemetry sanitizeValue 未脱敏 AK/SK/token 安装 ID 泄露，连续 3 版本复现） | v2 仍复现 |
| D3-S5 复合意图未拆分 | #788（D3-S5 复合意图分层路由未拆分命中） | 拆分自 #786 |
| D3-C14 hwlink createConnection 签名头 | #1055（v1.1.13-next.0 每日合并单 12 项）、#883（1.1.8-next.2 每日合并单） | |
| D4-25 hook 遥测事件未落盘 | #844（Hermes Linux 2026-10-02 每日合并单 6 项）、#852、#752 | hook-events.jsonl 0 条 |

> 这 6 项均已在 v2 分支 `fcfe047f` 上复现并落根因（文件:行号），本轮不重复开单、不在既有单追加评论（任务约定「提单由维护者统一做」，评论/复核亦由维护者统一操作）。