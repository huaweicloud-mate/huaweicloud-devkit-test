# FINDINGS — 缺陷发现清单（OpenCode-GLM-5.2）

> **落盘路径**：`results/OpenCode/2026-09-24-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-24 13:00:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.7-next.1（gitHead 657ceb7b）
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

## #4【P1】D4-7 hook_check_command对内联密钥无效

- **现象**：`hook_check_command("hcloud ECS ListServersDetails --ak AKEXAMPLE --sk SKEXAMPLE")` 返回 `decision=allow`，无 findings。`hook_check_artifacts` 和 `hook_check_deploy_plan` 正常工作（分别返回 `deny` 和 `warn`），但 `hook_check_command` 对含内联密钥参数的 hcloud 命令无效。
- **断言**：`hook_check_command` 对含 `--ak`/`--sk`/`--adminPass` 的命令应返回 `decision=deny` 或 `warn`
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` — 同 #2，缺少检测命令行内联密钥参数的规则。`risk-rule-engine.mjs:106` 的 `evaluate()` 函数在无规则匹配时返回 `allow`。
- **影响**：三工具中 `hook_check_command` 形同虚设，无法检测 hcloud 命令中的明文密钥。
- **证据**：`evidence/D4-7/stdout.log`，MCP 工具实测 `hook_check_command` → `allow`，`hook_check_artifacts` → `deny`，`hook_check_deploy_plan` → `warn`
- **状态**：待提单

## #5【P1】D4-17 未知命令fail-open（应fail-closed）

- **现象**：`hook_check_command("unknown-command-xyz")` 返回 `decision=allow`，无 findings。空/null/undefined 输入正确返回 `deny`（invalid-input），但有效的未知命令字符串返回 `allow`。
- **断言**：未知命令应返回 `decision=deny` 或至少 `warn`（fail-closed 策略）
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` — `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`。当无规则匹配时 `findings` 为空，`hasDeny=false`，`hasWarn=false`，返回 `allow`。这是 fail-open 行为，应改为 fail-closed（未知命令默认 deny 或 warn）。
- **影响**：未知或未覆盖的命令可以通过 hook 检查，可能导致安全风险。
- **证据**：`evidence/D4-17/stdout.log`，MCP 工具 `huaweicloud_hook_check_command("unknown-command-xyz")` 实测返回 `allow`
- **状态**：待提单

## #6【P1】D2-4 凭证脱敏遗漏token=模式

- **现象**：`redactString("AK=AKEXAMPLE12345678 SK=SKexample8901234567890ab token=token123")` 返回 `AK=<redacted> SK=<redacted> token=token123`。`AK` 和 `SK` 被正确脱敏，但 `token=token123` 未被脱敏。
- **断言**：`token=token123` 应被脱敏为 `token=<redacted>`（所有 secret-like 参数值应脱敏）
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42-45` — `redactString()` 函数的正则模式包含 `security_token`/`x_auth_token` 但不包含裸 `token` 关键字。正则 `/(?:access[_-]?key|secret[_-]?key|security[_-]?token|x[_-]?auth[_-]?token|authorization|password|passwd|adminPass|credential)\s*[:=]\s*/gi` 未覆盖 `token=` 模式。同样 `risk-rule-engine.mjs:22` 的 `redactEvidence()` 函数有相同遗漏。
- **影响**：含 `token=` 的输出中 token 值会明文显示，存在凭证泄露风险。
- **证据**：`evidence/D2-4/stdout.log`，源码直调 `redactString()` 测试
- **状态**：待提单

## #7【P2】D4-26 findings证据脱敏遗漏token=模式

- **现象**：`redactString("evidence: AK=AKEXAMPLE123 SK=SKexample456 token=tok789 password=pass123")` 返回 `evidence: AK=<redacted> SK=<redacted> token=tok789 password=<redacted>`。`token=tok789` 未被脱敏。
- **断言**：`token=tok789` 应被脱敏为 `token=<redacted>`
- **根因**：同 #6 — `safety-policy.mjs:42-45` 的 `redactString()` 正则不包含裸 `token` 关键字
- **证据**：`evidence/D4-26/stdout.log`
- **状态**：待提单

## #8【P1】D10-3 serviceCatalog路由准确率21.4%远低于90%阈值（含EXP-E01~E14路由MISS）

- **现象**：eval harness 实测 `serviceCatalog` 路由准确率 21.4%（3 HIT / 14 total），11/14 中文意图落入 `Run hcloud --help to list available services.` 通用兜底。HIT 仅有 EXP-E06(DCS)、EXP-E09(CCE)、EXP-E15(Voucher)。MISS 涉及 EXP-E01(ECS查询)、EXP-E02(ECS创建)、EXP-E03(OBS静态站)、EXP-E04(EIP)、EXP-E05(RDS)、EXP-E07(CBR)、EXP-E10(FunctionGraph)、EXP-E11(BSS费用)、EXP-E12(CES)、EXP-E13(ELB证书)、EXP-E14(IAM审计)。
- **断言**：serviceCatalog 路由准确率应 ≥90%（当前 21.4%）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` — `serviceCatalog(intent)` 函数的意图匹配模式未充分覆盖 eval-set-v1.csv 中的中文意图。兜底返回 `Run hcloud --help to list available services.` 在 11/14 意图上触发，说明匹配模式覆盖面不足。
- **影响**：Agent 无法正确路由大部分中文用户意图到对应华为云服务，导致用户请求无法被正确处理。
- **证据**：`evidence/D10-3/stdout.log`、`evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E14/stdout.log`、`evidence/eval-run-result.csv`
- **状态**：待提单
