# FINDINGS — 缺陷发现清单（WorkBuddy-GLM-5.2）

> **落盘路径**：`results/WorkBuddy/2026-09-19-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-19 05:15:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

## #1【P1】D10-3 / EXP-E01~E14 serviceCatalog 中文意图路由准确率低（21.4%远低于90%目标）

- **现象**：通过 eval harness（run-eval.mjs）对 serviceCatalog 逐条调中文意图，14条可判定中仅3条HIT（EXP-E06 DCS, EXP-E09 CCE, EXP-E15 Voucher），11条MISS。多数MISS返回 fallback 文本 "Run hcloud --help to list available services" 而非匹配到对应服务。
- **断言**：serviceCatalog 中文意图路由准确率≥90%（14条可判定中≥13条HIT）；每条意图命中对应服务（EXP-E01→ECS, EXP-E02→ECS, EXP-E03→OBS, EXP-E04→EIP, EXP-E05→RDS, EXP-E07→CBR, EXP-E10→FunctionGraph, EXP-E11→BSS, EXP-E12→CES, EXP-E13→ELB, EXP-E14→IAM）
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 函数对中文自然语言意图的路由匹配覆盖不足。中文意图（如"帮我查一下我账号在华北北京四有哪些云主机"）未能匹配到 ECS 服务，而是返回 fallback 提示"Run hcloud --help to list available services"。当前路由逻辑可能仅覆盖少量关键词（DCS/CCE/Voucher 命中），大量中文云服务意图未覆盖。
- **影响**：用户使用中文自然语言描述需求时，serviceCatalog 无法正确路由到对应华为云服务，导致 Agent 无法激活正确的 skill 和工具，影响用户体验和功能可用性。
- **证据**：`evidence/EXP-E01/eval-run.csv`（全量15条评测结果CSV），`evidence/d5-c4-probe.mjs`（probe脚本），eval harness 命令：`node eval/harness/run-eval.mjs <mcp-server.mjs>`
- **状态**：待提单

## #2【P1】D1-27 / D1-31 check_update 在 Windows 下返回 check_failed 而非 up_to_date

- **现象**：当前版本 1.1.5（npm latest 正式版），执行 check_update 返回 result=check_failed 而非预期的 result=up_to_date。执行 check_update(dismiss=true, dismissVersion='1.1.4') 同样返回 result=check_failed 而非 result=dismissed。
- **断言**：current=1.1.5（=latest）时 result=up_to_date, updateAvailable=false；dismiss=true 时 result=dismissed, dismissed=true
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs` queryDistTagsSync 函数在 Windows 环境下查询 npm registry 失败，导致无法获取 dist-tags 信息，返回 check_failed。可能与 Windows 下 npm.cmd spawnSync 的网络请求、DNS 解析或 registry 配置有关（关联 #554 Windows 升级检测链 EINVAL 问题）。
- **影响**：用户在 Windows 环境下无法获取正确的版本更新状态，check_update 工具功能不可用。
- **证据**：`evidence/D1-27/probe.txt`（result=check_failed），`evidence/D1-31/probe.txt`（dismiss 后 result=check_failed），`evidence/p0-design-probe.mjs`（probe脚本）
- **状态**：待提单
