# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-09-27-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-27 05:15:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P1】EXP-E01~E14 serviceCatalog 中文意图路由准确率低（21.4% HIT，11/15 MISS + 1 N/A）

- **现象**：`node eval/harness/run-eval.mjs` 跑 15 条中文自然语言意图调 `serviceCatalog(intent)`，11 条 MISS + 1 条 N/A，未命中的意图返回 fallback "Run hcloud --help to list available services." 而非正确服务路由。仅 E06(DCS)、E09(CCE)、E15(Voucher) 3 条命中。
- **断言**：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 应返回 ECS 服务路由（命中 routeMap 中 ECS 条目），实际返回 "Run hcloud --help to list available services."（未命中）。同理 E02(ECS创建)、E03(OBS静态站→误路由 Sandbox+DevStation)、E04(EIP)、E05(RDS)、E07(CBR)、E08(explain_error诊断)、E10(FunctionGraph)、E11(BSS费用)、E12(CES监控)、E13(ELB证书)、E14(IAM审计) 均未命中。
- **根因**：`tools.mjs:1947` — `serviceCatalog` 函数（`tools.mjs:1815`）的 `routeMap`（`tools.mjs:1817`）未覆盖评测集中 11/15 条中文自然语言意图的模式匹配，导致未命中意图走到 fallback 分支（`tools.mjs:1947` 返回 "Run hcloud --help to list available services."）。
- **影响**：中文用户使用自然语言意图（如"查一下我的云主机"、"创建一台 Ubuntu 云服务器"）时无法被正确路由到对应华为云服务，需改用英文服务名或 hcloud CLI 命令。影响 D10-3 路由准确率基线（当前 21.4% HIT）。
- **证据**：
  - `evidence/EXP-E01/stdout.log`（harness verdict=MISS, expected=ECS, actual="Run hcloud --help..."）
  - `evidence/EXP-E02/stdout.log`（harness verdict=MISS, expected=ECS）
  - `evidence/EXP-E03/stdout.log`（harness verdict=MISS, expected=OBS, actual="Sandbox+DevStation"）
  - `evidence/EXP-E04/stdout.log`（harness verdict=MISS, expected=EIP）
  - `evidence/EXP-E05/stdout.log`（harness verdict=MISS, expected=RDS）
  - `evidence/EXP-E07/stdout.log`（harness verdict=MISS, expected=CBR）
  - `evidence/EXP-E08/stdout.log`（harness verdict=N/A, expected=explain_error）
  - `evidence/EXP-E10/stdout.log`（harness verdict=MISS, expected=FunctionGraph）
  - `evidence/EXP-E11/stdout.log`（harness verdict=MISS, expected=BSS）
  - `evidence/EXP-E12/stdout.log`（harness verdict=MISS, expected=CES）
  - `evidence/EXP-E13/stdout.log`（harness verdict=MISS, expected=ELB）
  - `evidence/EXP-E14/stdout.log`（harness verdict=MISS, expected=IAM）
  - `eval/results/eval-run-20260926210447.csv`（harness 完整结果）
- **状态**：已知基线（21.4% HIT），每日测试追踪路由准确率变化。此为 pre-existing 问题，非新增回归。
