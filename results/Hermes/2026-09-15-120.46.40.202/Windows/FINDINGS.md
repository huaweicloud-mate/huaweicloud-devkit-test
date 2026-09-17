# FINDINGS — 缺陷发现清单（Hermes-GLM-5.2）

> **落盘路径**：`results/Hermes/2026-09-15-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：2026-09-15 18:42:10（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

## 格式铁律（给 agent）

1. 每个缺陷一行标题，严格格式：`## #序号【级别】标题`
2. 每段至少写 `- **根因**：`（必须含【文件:行号】+ 原因）与 `- **断言**：`（唯一可判定断言）
3. 根因定位方法见技能 `huaweicloud-devkit-source-coverage`（源码文件地图 + 核对四步）。

---

## #1【P0】echo 凭证环境变量未拦截（D4-2）— 已知缺陷 #677/#688

- **现象**：`classifyTextCommand('echo $HUAWEICLOUD_SDK_AK')` 返回 `decision=allow, risk=not_huaweicloud`，未拦截凭证环境变量打印
- **断言**：`classifyTextCommand('echo $HUAWEICLOUD_SDK_AK').decision === 'deny'`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335` — 环境变量检测正则 `/(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)/i` 不包含 `echo` 命令，导致 `echo $HUAWEICLOUD_SDK_AK` 绕过凭证环境变量检测
- **影响**：攻击者可通过 echo 命令打印凭证环境变量，导致 AK/SK 泄露到 agent 上下文
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：已知缺陷 #677/#688（fix PR #688 open），本次复现确认

## #2【P0】Shell 包裹命令穿透安全分类器（D4-16）— 已提单 #690

- **现象**：`classifyTextCommand('sh -c "hcloud ECS DeleteServer --server_id=test"')` 返回 `decision=allow, risk=not_huaweicloud`，写操作未被拦截
- **断言**：`classifyTextCommand('sh -c "hcloud ECS DeleteServer"').decision === 'deny'`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:345` — `splitSimpleCommand` 按空格分割后 `sh` 被当作 service，内层 `hcloud ECS DeleteServer` 未被提取分类。正则 `/(^|\s)hcloud(\.exe)?\s+/i` 匹配到 hcloud 但 `commandOperation` 将 `sh` 作为 service 处理
- **影响**：攻击者可通过 `sh -c`/`bash -c`/`eval`/`cmd /c` 包裹 hcloud 写命令绕过安全策略
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：已提单 #690

## #3【P0】hook_check_deploy_plan 公网暴露规则误报（D4-22）— 待提单

- **现象**：`evaluateDeployPlan` 的 `hwc-functiongraph-public-no-auth` 规则对 `public_access=false` 的安全配置也触发 `severity=warn` 告警
- **断言**：当 deploy plan 中 `public_access=false` 时，`evaluateDeployPlan(plan).findings` 不应包含 `ruleId=hwc-functiongraph-public-no-auth`
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` — `hwc-functiongraph-public-no-auth` 规则匹配 FunctionGraph CreateFunction 动作但不检查 `public_access` 字段值，导致安全配置被误报为公网暴露
- **影响**：安全配置产生误报告警，降低告警可信度，可能导致开发者忽略真实告警
- **证据**：`evidence/D4-22/stdout.log`
- **状态**：待提单

## #4【P0】EXP-NR3-09 spawnSync('npm.cmd') EINVAL 在 Windows 仍可复现 — 已知缺陷 #677 (D1-39)

- **现象**：`spawnSync('npm.cmd', ['--version'], {shell: false})` 在 Windows 上返回 `error.code=EINVAL, status=null`；使用 `shell: true` 则正常返回 `status=0, stdout=10.9.2`
- **断言**：`spawnSync('npm.cmd', ['--version'], {shell: false}).error?.code !== 'EINVAL'`（Windows 上不应 EINVAL）
- **根因**：Node.js 在 Windows 上 `spawnSync` 不带 `shell: true` 时无法执行 `.cmd`/`.bat` 文件。`plugins/huaweicloud-core/src/update-check.mjs` 的 `queryDistTagsSync` 调用 `spawnSync('npm.cmd')` 时需确认是否已使用 `shell: true`
- **影响**：Windows 上升级检测链静默失败，用户无法收到升级提醒
- **证据**：`evidence/EXP-NR3-09/stdout.log`
- **状态**：已知缺陷 #677 (D1-39)，本次 EXP-NR3-09 复现确认
