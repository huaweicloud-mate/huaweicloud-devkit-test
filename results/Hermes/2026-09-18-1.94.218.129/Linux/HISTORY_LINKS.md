# 历史问题关联清单（不重复提单）

> 生成时间：`2026-09-18 05:30:00`（北京时间）· 被测版本 v1.1.5（gitHead e7ed6f66）
> 说明：本清单为**本机（Linux）经 api.github.com 手动查重**得到的 8 项缺陷历史关联。全部命中既有历史单（open），本次为复核确认，**不新增缺陷单**（避免重复提单堆积）。

| 用例 | 级别 | 缺陷 | 关联历史单 | 复核结论（v1.1.5） |
|---|---|---|---|---|
| D4-16 | P0 | sh -c 包裹凭证 env 打印未拦截 | #677 / #682 / #694 | 仍穿透（`classifyTextCommand` 未解包 shell 包裹） |
| D2-4 | P0 | redactString 字符串路径漏小写 ak=/sk= | #694 / #683 / #651 / #679 | 仍漏（对象+redactOutput 路径正确，字符串路径漏） |
| D4-23 | P0 | 全局规则 huawei-agent-rules.mdc 未注入 | #650（closed，上游明示「有意不处理」）/ #679 | 仍缺失（package.json files 不含 rules/，安装包无 .mdc） |
| D4-27 | P1 | redactSecrets 字符串路径漏小写 ak=/sk=/token= | 同 D2-4 根因 → #694 / #651 / #679 | 仍漏（安全层 redactString 正则缺口） |
| D8-4 | P1 | INSTALL.md 未随 npm 包发布 | #694 / #681 / #675 | 仍缺失（package.json files 不含 INSTALL.md） |
| D9-2 | P0 | invalid params 未返回 -32602 | #704（closed，已修 required 校验）/ #672 / #651 | -32602 变体仍存在（params 非 object 无 error 对象） |
| D9-9 | P1 | notifications.cancellation 未声明（SPEC） | #698 | 仍缺失（mcp-server.mjs:158 未声明） |
| D10-3 / EXP-E01~14 | P1 | serviceCatalog 路由命中率 21.4% | #689 / #683 | 仍 21.4%（11/14 MISS） |

## 关联历史单详情（今日实拉 api.github.com 复核）

- **#677**（open）Hermes Windows P0 缺陷汇总（含 D4-16）
- **#682**（open）安全策略绕过缺陷合并单（含 D4-16/D4-15）
- **#694**（open）每日测试缺陷合并单（含 D2-4/D4-16/D4-2/D8-4）
- **#683**（open）全量测试缺陷合并单（10 项，含 D10-3/D2-4）
- **#679**（open）全量测试缺陷合并单（8 项，含 D4-23）
- **#672**（open）全量测试缺陷合并单（含 D9-2）
- **#651**（open）全量测试缺陷合并单（12 项，含 D9-2/D2-4）
- **#650**（closed）全量测试缺陷合并单（含 D4-23，上游「有意不处理」）
- **#704**（closed）D9-2 缺少 required 参数校验（已修复）
- **#698**（open）每日测试缺陷合并单（1 项，含 D9-9）
- **#689**（open）每日测试缺陷合并单（5 项，含 D10-3/D2-11）

> 证据：`results/Hermes/2026-09-18-1.94.218.129/Linux/`（本日 evidence/ 各探针 stdout.log + D9-protocol + D10-eval）。
> 结论：8 项缺陷均为历史复现确认，无需新开单；建议上游按 FINDINGS.md 逐项就已有的 #677/#694/#679/#672/#698/#689 等单推进修复。