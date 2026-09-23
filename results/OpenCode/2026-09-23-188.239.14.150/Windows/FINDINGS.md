# FINDINGS — 缺陷发现清单（OpenCode-GLM-5.2）1.1.6 正式版

> **落盘路径**：`results/OpenCode/2026-09-23-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-23 15:33:57（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.6（npm latest，gitHead `46152dd`）
> **本清单是统一提单脚本的解析输入**。

---

## #1【P0】凭证 env 打印拦截不完整 — printenv HW_SECRET_ACCESS_KEY / echo AK=xxx 未被拦截

- **现象**：`hook_check_command` 对 `printenv HW_SECRET_ACCESS_KEY` 和 `echo AK=xxx SK=xxx` 返回 `decision='allow'`
- **断言**：`hook_check_command({command:'printenv HW_SECRET_ACCESS_KEY'}).decision === 'deny'`
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` — 风险规则（`hwc-command-credential-file`）仅匹配凭证文件路径模式（credentials.json, .hcloud/config.json），不匹配 env 变量名（HW_SECRET_ACCESS_KEY）或 echo 命令中的凭证值模式
- **影响**：攻击者可通过 `printenv HW_SECRET_ACCESS_KEY` 或 `echo AK=xxx SK=xxx` 绕过风险规则引擎泄露凭证
- **证据**：`evidence/D4-2/stdout.log`（decision=allow）
- **状态**：待提单（历史关联 #561 #677 #694）

## #2【P1】serviceCatalog 自然语言路由命中率低 — 15 题中 11 题 MISS

- **现象**：15 个自然语言服务路由任务中，11 个未路由到正确服务（EXP-E01/E02/E03/E04/E05/E07/E10/E11/E12/E13/E14），serviceCatalog 返回 "Run hcloud --help" 而非预期服务
- **断言**：`serviceCatalog({intent:'帮我查一下我账号在华北北京四有哪些云主机'}).recommendedServices` 应包含 `ECS`
- **实际**：返回 `Run hcloud --help`（11/15 MISS）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` — `serviceCatalog()` 关键词匹配表未覆盖中文自然语言查询模式，中文关键词到服务名的映射缺失
- **影响**：自然语言用户意图无法正确路由到对应华为云服务
- **证据**：`evidence/EXP-E01/stdout.log` 至 `evidence/EXP-E14/stdout.log`
- **状态**：待提单（历史关联 #689）
