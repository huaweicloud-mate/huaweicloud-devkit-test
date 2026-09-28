# OpenCode-glm-5.2 每日测试报告

> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-09-29 05:12:00（北京时间）
> **执行归档**：`results/OpenCode/2026-09-29-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项，P1 11 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `glm-5.2` |
| OS / 架构 | `Windows` (x86_64) |
| 被测版本（SUT） | `1.1.7` (npm latest) |
| 源码 commit | `7456d059` (release-1.1.7) |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：源码级直调（import 源码模块 + 函数级断言）+ MCP 工具直调（callTool 执行 list_operations/plan_cli_command）+ eval harness 路由测试（run-eval.mjs 跑 serviceCatalog 15 条中文意图）。探针脚本 + stdout.log 证据落盘，backfill_daily.py 批量回填。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 13 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `90.8%` |
| P0 / P1 / P2 新增缺陷 | `2 / 11 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `无需释放（本次为源码级+工具级测试，无真云资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `100` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

### 3.3 P0 分布

| 优先级 | 总数 | PASS | FAIL | BLOCKED | NOT_RUN |
|---|---|---|---|---|---|
| P0 | 21 | 19 | 2 | 0 | 0 |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | `safety/rules/cloud-risk-rules.json:39` | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `safety/rules/cloud-risk-rules.json:56` | 待提单 |
| 3 | P1 | `EXP-E01~E14` | D10评测 | service_catalog 路由准确率低 21.4% | `src/tools.mjs` serviceCatalog 路由逻辑 | 待提单 |

### 根因详情

#### #1【D4-2 P0】printenv HW_SECRET_KEY 未被拦截

- **用例**: D4-2 凭证env打印拦截
- **现象**: `printenv HW_SECRET_KEY` 被 evaluateCommandRisk 判定为 `allow`（应 `deny`）
- **断言**: `printenv HW_SECRET_KEY` → `decision == 'deny'`
- **根因**: `safety/rules/cloud-risk-rules.json:39` — `hwc-command-env-dump` 规则的 regex `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 不包含 `HW_` 前缀。插件实际使用的环境变量为 `HW_ACCESS_KEY`/`HW_SECRET_KEY`/`HW_SECURITY_TOKEN`（见 `src/auth/credentials.mjs:219-220`），但规则只覆盖 `HUAWEICLOUD_*`/`HWC_*`/`HCLOUD_*`/`OS_*` 前缀。
- **证据**: `evidence/D4-2/stdout.log`
- **修复建议**: 在 `hwc-command-env-dump` 的第二个 regex 中添加 `HW_` 前缀：`(HUAWEICLOUD|HWC_|HCLOUD|HW_|OS_)`

#### #2【D4-3 P0】hcloud --adminPass/--ak/--sk 明文密钥未拦截

- **用例**: D4-3 明文secret API拦截
- **现象**: `hcloud ECS CreateServers --adminPass Password123! --ak AKEXAMPLE --sk SKEXAMPLE` 被 evaluateCommandRisk 判定为 `allow`（应 `deny` 或 `warn`）
- **断言**: 含 `--adminPass`/`--ak`/`--sk` 明文参数的 hcloud 命令 → `decision != 'allow'`
- **根因**: `safety/rules/cloud-risk-rules.json:53-61` — `hwc-command-secret-value-read` 规则仅匹配 `ShowSecretVersion|DownloadSecret|GetSecretValue` 和 `secret_string|secret_binary|secretString|secretBinary`（DEW 密钥管理 API），不覆盖 hcloud 命令行中的 `--adminPass`/`--ak`/`--sk` 明文参数。`src/hcloud-cli.mjs:631` 有 warning 文本但不进入 risk rule engine。
- **证据**: `evidence/D4-3/stdout.log`
- **修复建议**: 新增规则匹配 hcloud 命令中的 `--adminPass\s+\S+`、`--ak\s+\S+`、`--sk\s+\S+` 明文参数

#### #3【EXP-E01~E14 P1】service_catalog 路由准确率 21.4%

- **用例**: EXP-E01~E15 评测集路由准确率
- **现象**: 15 条中文意图中仅 3 条 HIT（EXP-E06 DCS、EXP-E09 CCE、EXP-E15 代金券），11 条 MISS，1 条 N/A（诊断类）。准确率 21.4%（基线）。
- **断言**: 每条意图路由到期望服务 → `HIT`
- **根因**: `src/tools.mjs` serviceCatalog 路由逻辑不完善，大部分中文意图返回 `Run hcloud --help to list available services.` 而非路由到具体服务技能。
- **证据**: `evidence/EXP-E01~E15/stdout.log` + `eval/results/eval-run-20260928210507.csv`
- **修复建议**: 增强 serviceCatalog 的中文意图匹配，覆盖 ECS/OBS/RDS/EIP/CBR/FunctionGraph/BSS/CES/ELB/IAM 等服务的中文关键词

---

## 五、未执行用例与原因

无未执行用例。全部 141 条用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无。所有探针使用源码级直调，凭证文件仅读取 metadata（不输出 AK/SK 值）。
- [x] 写操作误判 read-only：无。D4-5 写操作误判检测 PASS，DeleteServers 正确识别为 warn。
- [x] 红线（I 类）违规：0 项。全部 PASS 用例均有证据落盘 + evidencePath 回填，通过 verify_no_fake_pass.py 门禁。
- [x] 脱敏复核：redactSecrets 函数正确脱敏 AK/SK/token/adminPass（D2-4/D4-6/D4-26/D4-27 全部 PASS）。
- [x] 真云用例：本次为源码级+工具级测试，展开级 EXP-C4-01~22 通过 callTool 实际执行 list_operations + plan_cli_command，22 条全部 PASS。无真云资源创建/删除。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/OBS 等 | 无 | 无 | 无需归零（本次无真云资源创建） |
| 沙箱实例 | 无 | 无 | 无需释放 |
| 临时文件 | 探针脚本 + stdout.log | 保留为证据 | 已在 evidence/ 目录归档 |

---

## 八、遗留与建议

1. **D4-2/D4-3 P0 缺陷需优先修复**：cloud-risk-rules.json 的 env dump 规则缺少 `HW_` 前缀，secret read 规则不覆盖 hcloud 命令行明文参数。建议在下一个版本修复。
2. **serviceCatalog 路由准确率 21.4% 需提升**：大部分中文意图返回通用 help 而非路由到具体服务。建议增强中文关键词匹配逻辑。
3. **门禁通过**：verify_no_fake_pass.py + verify_coverage.py 双门禁均通过，所有 PASS 用例有证据，P0 无 NOT_RUN，NOT_RUN+空占比 0.0%。
