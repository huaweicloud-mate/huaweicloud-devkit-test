# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2）

> **落盘路径**：`results/WorkBuddy/2026-09-25-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-25 05:10:00（北京时间）

## #1【P0】D2-4/D4-26/D4-27 redactString 未脱敏 lowercase ak/sk 键值

- **现象**: `redactSecrets('{"ak":"AKID123","sk":"SK1234567890abcdef"}')` 返回值中 SK 值 `SK1234567890abcdef` 完整保留，未被脱敏
- **断言**: `redactSecrets('{"ak":"...","sk":"..."}')` 返回值不含原始 SK 值
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs:45` — `redactString` 的 regex `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 仅匹配大写 `AK`/`SK`，不匹配 JSON 中 lowercase `ak`/`sk`
- **影响**: 凭证信息在 findings/输出中可能泄露，影响 D2-4（凭证脱敏正确性）、D4-26（findings 证据脱敏）、D4-27（双路径输出脱敏）
- **证据**: `evidence/D2-4/stdout.log`, `evidence/D4-26/stdout.log`, `evidence/D4-27/stdout.log`
- **状态**: 待提单

## #2【P0】D4-16 classifyTextCommand 未解包 sh -c shell wrapper

- **现象**: `classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 返回 `decision: 'allow'`，凭证环境变量打印命令未被拦截
- **断言**: `classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"').decision === 'deny'`
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs:384-430` — `classifyTextCommand` 在 hcloud regex 不匹配时直接 fallthrough 到 `applyRawCommandRiskRules`，未调用 `stripExecutable` 解包 `sh -c` wrapper；`stripExecutable`（line 67-88）仅在 `classifyHcloudArgs` 路径（line 173）生效
- **影响**: 攻击者可通过 `sh -c "printenv HW_*"` 绕过凭证打印拦截
- **证据**: `evidence/D4-16/stdout.log`
- **状态**: 待提单

## #3【P0】D4-23 setup-cli 未注入 huawei-agent-rules.mdc 全局规则

- **现象**: `setup-cli.mjs` 全文无 `huawei-agent-rules` / `agent-rules` / `rules` 引用；安装后客户端目录无规则文件
- **断言**: `setup-cli.mjs` 中存在 `huawei-agent-rules` 引用，安装后客户端目录存在规则文件
- **根因**: `plugins/huaweicloud-core/src/setup-cli.mjs` — 缺少规则注入逻辑（SPEC-MISMATCH）；规则文件 `rules/huawei-agent-rules.mdc` 存在于仓库但未在安装流程中注入
- **影响**: 全局安全规则不生效，11 个安装目标均受影响
- **证据**: `evidence/D4-23/stdout.log`
- **状态**: 待提单

## #4【P1】EXP-E01~E14 serviceCatalog 路由层 10/15 评测集意图未命中

- **现象**: `run-eval.mjs` 跑完 15 条评测集，10 条返回 MISS（E06/E08/E09/E15 命中），路由准确率仅 33.3%
- **断言**: 15 条评测集 HIT 率 >= 80%
- **根因**: `plugins/huaweicloud-core/src/hcloud-cli.mjs` — serviceCatalog 路由规则覆盖不全，部分中文意图未被匹配到对应服务
- **影响**: 用户部分中文意图无法被正确路由到对应华为云服务
- **证据**: `evidence/c4-service-matrix/stdout.log`
- **状态**: 待提单（已知基线问题，非本次回归）
