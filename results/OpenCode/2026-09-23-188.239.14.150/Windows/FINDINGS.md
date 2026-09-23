# FINDINGS — 缺陷发现清单（OpenCode-GLM-5.2）

> **落盘路径**：`results/OpenCode/2026-09-23-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-23 17:00:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.7-next.0（gitHead 0790e92a）
> **本清单是统一提单脚本的解析输入**：格式严格遵循 templates/findings.md 规范。

---

## #1【P0】D4-2 凭证env打印拦截不完整

- **现象**：`hook_check_command("printenv HW_SECRET_KEY")` 返回 `decision=allow`，无 findings。同样 `echo $HW_SECRET_KEY` 也返回 `allow`。环境变量打印命令未被风险规则拦截。
- **断言**：`printenv HW_SECRET_KEY` 和 `echo $HW_SECRET_KEY` 应返回 `decision=deny`（凭证环境变量打印拦截）
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:39` — `hwc-command-env-dump` 规则的第二个条件正则 `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 未覆盖 `HW_` 前缀。Huawei Cloud devkit 使用 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 作为环境变量名，但正则只匹配 `HUAWEICLOUD`/`HWC_`/`HCLOUD`/`OS_` 前缀，`HW_` 前缀未被包含。
- **影响**：攻击者可通过 `printenv HW_SECRET_KEY` 或 `echo $HW_ACCESS_KEY` 提取环境变量中的凭证而不被 hook 拦截，存在凭证泄露风险。
- **证据**：`evidence/D4-2/stdout.log`，MCP 工具 `huaweicloud_hook_check_command` 实测 `printenv HW_SECRET_KEY` → `allow`
- **状态**：待提单

## #2【P0】D4-3 明文secret API拦截缺失

- **现象**：`hook_check_command("hcloud ECS CreateServers --adminPass Password123! --ak AKEXAMPLE --sk SKEXAMPLE")` 返回 `decision=allow`，无 findings。hcloud 命令中内联的 `--adminPass`/`--ak`/`--sk` 明文密钥参数未被检测和拦截。
- **断言**：hcloud 命令含 `--adminPass`/`--ak`/`--sk`/`--password` 等明文密钥参数时应返回 `decision=deny` 或 `warn`
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` — 缺少检测 hcloud 命令内联密钥参数的规则。现有规则覆盖凭证文件读取（`hwc-command-credential-file`）、环境变量打印（`hwc-command-env-dump`）、DEW 密钥读取（`hwc-command-secret-value-read`），但无规则检测命令行参数中的明文密钥（`--adminPass`/`--ak`/`--sk`/`--password`/`--token`）。
- **影响**：用户在 hcloud 命令中直接传入明文 `--adminPass`/`--ak`/`--sk` 不会被拦截，凭证可能出现在命令历史和日志中。
- **证据**：`evidence/D4-3/stdout.log`，MCP 工具 `huaweicloud_hook_check_command` 实测返回 `allow`
- **状态**：待提单

## #3【P0】D4-16 命令包裹穿透

- **现象**：`hook_check_command("sh -c \"cat credentials.json\"")` 返回 `decision=allow`，无 findings。当凭证读取命令被 shell 包裹（`sh -c`/`bash -c`/`cmd /c`）时，内层命令未被提取和检查。
- **断言**：`sh -c "cat credentials.json"` 应返回 `decision=deny`（内层凭证读取命令被检测）
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:143` — `evaluateCommandRisk()` 函数对完整命令文本执行正则匹配，不解析/提取 shell 包裹（`sh -c`/`bash -c`/`cmd /c`）中的内层命令。当 `cat credentials.json` 被包裹在 `sh -c "..."` 中时，正则 `(^|\s)(cat|type|...)` 不匹配（`cat` 前是 `"` 而非空格），且 `credentials.json` 不含 `.hcloud`/`.huaweicloud` 关键字。
- **影响**：攻击者可通过 shell 包裹绕过 hook 检测，执行凭证读取等高危命令。
- **证据**：`evidence/D4-16/stdout.log`，MCP 工具 `huaweicloud_hook_check_command` 实测返回 `allow`
- **状态**：待提单

## #4【P1】D10-3 serviceCatalog 路由准确率 21.4% 远低于 90% 阈值（含 EXP-E01~E14 路由 MISS）

- **现象**：eval harness 实测 `serviceCatalog` 路由准确率 21.4%（3 HIT / 14 total），11/14 中文意图落入 `Run hcloud --help to list available services.` 通用兜底。HIT 仅有 EXP-E06(DCS)、EXP-E09(CCE)、EXP-E15(Voucher)。MISS 涉及 EXP-E01(ECS查询)、EXP-E02(ECS创建)、EXP-E03(OBS静态站)、EXP-E04(EIP)、EXP-E05(RDS)、EXP-E07(CBR)、EXP-E10(FunctionGraph)、EXP-E11(BSS费用)、EXP-E12(CES)、EXP-E13(ELB证书)、EXP-E14(IAM审计)。
- **断言**：serviceCatalog 路由准确率应 ≥90%（当前 21.4%）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1815` — `serviceCatalog(intent)` 函数的意图匹配模式未充分覆盖 eval-set-v1.csv 中的中文意图。`tools.mjs:1947` 的兜底返回 `Run hcloud --help to list available services.` 在 11/14 意图上触发，说明匹配模式覆盖面不足。
- **影响**：Agent 无法正确路由大部分中文用户意图到对应华为云服务，导致用户请求无法被正确处理。
- **证据**：`evidence/D10-3/stdout.log`、`evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E14/stdout.log`、`evidence/eval-run-result.csv`
- **状态**：待提单
