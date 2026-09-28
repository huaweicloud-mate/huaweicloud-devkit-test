# FINDINGS — huaweicloud-devkit v1.1.7 每日测试缺陷清单

> 客户端: OpenCode (glm-5.2) | OS: Windows | 版本: v1.1.7 | 日期: 2026-09-29

## #1【D4-2 P0】printenv HW_SECRET_KEY 未被风险规则拦截

- 级别: P0
- 用例: D4-2 凭证env打印拦截
- 描述(现象): `printenv HW_SECRET_KEY` 被 `evaluateCommandRisk` 判定为 `allow`（应 `deny`）。插件实际使用的环境变量 `HW_ACCESS_KEY`/`HW_SECRET_KEY`/`HW_SECURITY_TOKEN`（见 `src/auth/credentials.mjs:219-220`）未被风险规则覆盖。
- 断言(唯一可判定): `evaluateCommandRisk('printenv HW_SECRET_KEY').decision === 'deny'`
- 根因(文件:行号): `safety/rules/cloud-risk-rules.json:39` — `hwc-command-env-dump` 规则的第二个 regex `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 不包含 `HW_` 前缀。`HW_SECRET_KEY` 以 `HW_` 开头但不匹配 `HWC_`（缺 `C`）。
- 证据: `evidence/D4-2/stdout.log`

## #2【D4-3 P0】hcloud --adminPass/--ak/--sk 明文密钥未拦截

- 级别: P0
- 用例: D4-3 明文secret API拦截
- 描述(现象): `hcloud ECS CreateServers --adminPass Password123! --ak AKEXAMPLE --sk SKEXAMPLE` 被 `evaluateCommandRisk` 判定为 `allow`（应 `deny` 或 `warn`）。命令行中的明文 AK/SK/adminPass 参数未被任何风险规则拦截。
- 断言(唯一可判定): `evaluateCommandRisk('hcloud ECS CreateServers --adminPass Password123! --ak AKEXAMPLE --sk SKEXAMPLE').decision !== 'allow'`
- 根因(文件:行号): `safety/rules/cloud-risk-rules.json:53-61` — `hwc-command-secret-value-read` 规则仅匹配 DEW 密钥管理 API（`ShowSecretVersion|DownloadSecret|GetSecretValue`），不覆盖 hcloud 命令行中的 `--adminPass`/`--ak`/`--sk` 明文参数。`src/hcloud-cli.mjs:631` 有 warning 文本但不进入 risk rule engine。
- 证据: `evidence/D4-3/stdout.log`

## #3【EXP-E01~E14 P1】service_catalog 路由准确率低 21.4%

- 级别: P1
- 用例: EXP-E01~E15 评测集路由准确率
- 描述(现象): 15 条中文意图中仅 3 条 HIT（EXP-E06 DCS、EXP-E09 CCE、EXP-E15 代金券），11 条 MISS，1 条 N/A（诊断类）。准确率 21.4%。大部分意图返回 `Run hcloud --help to list available services.` 而非路由到具体服务。
- 断言(唯一可判定): `node eval/harness/run-eval.mjs` 准确率 >= 50%（当前 21.4%）
- 根因(文件:行号): `src/tools.mjs` serviceCatalog 路由逻辑 — 中文意图匹配不完善，大部分中文关键词未映射到对应服务。
- 证据: `evidence/EXP-E01~E15/stdout.log` + `eval/results/eval-run-20260928210507.csv`
