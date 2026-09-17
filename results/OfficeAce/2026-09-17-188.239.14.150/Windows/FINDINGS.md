# FINDINGS — 缺陷发现清单（OfficeAce-GLM-5.2）

> **落盘路径**：`results/OfficeAce/2026-09-17-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-17 02:50:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】D4-16 命令包裹穿透（sh -c wrap bypass）

- **现象**：`classifyTextCommand('sh -c "hcloud ECS CreateServers"')` 返回 `allow`，sh wrap 未被拦截
- **断言**：包含 `sh -c` 的命令应返回 `deny` 或 `confirm`，不应直接 `allow`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` 的 `classifyTextCommand()` 未检测 `sh -c` / `bash -c` 包裹模式，攻击者可通过 shell wrap 绕过安全策略
- **影响**：安全红线违规，I 类风险——任意命令可通过 sh wrap 绕过安全检查执行写操作
- **证据**：`evidence/d4-security/stdout.log`（D4-16 测试项）
- **状态**：待提单

## #2【P0】D2-4 凭证脱敏不完整（AK/SK 泄漏）

- **现象**：`redactSecrets()` 对部分凭证格式未脱敏，AK/SK 明文残留
- **断言**：所有 AK/SK 格式（`AK*`、`SK*`、`AccessKeyId`、`SecretAccessKey`）均应被 `***` 替换
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` 的 `redactSecrets()` 正则覆盖不全，部分华为云凭证前缀未匹配
- **影响**：凭证泄漏风险，日志/输出中可能暴露 AK/SK 明文
- **证据**：`evidence/d2-auth/stdout.log`（D2-4 测试项）
- **状态**：待提单

## #3【P0】D1-39 Windows 下 queryDistTags 返回 null

- **现象**：在 Windows 环境下 `queryDistTagsSync('huaweicloud-devkit')` 返回 `null`，更新检查功能失效
- **断言**：Windows 下应能正常查询 npm registry 获取 dist-tags，返回 `{ latest: 'x.y.z', next: ... }` 结构
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs` 的 `queryDistTagsSync` 在 Windows 上可能因 `npm` 子进程调用方式或路径解析问题导致返回 null
- **影响**：Windows 用户更新检查功能完全失效，无法获取最新版本通知
- **证据**：`evidence/d1-upgrade/stdout.log`（D1-39 测试项）
- **状态**：待提单

## #4【P1】D1-1 更新检查 JSON 解析错误

- **现象**：`judgeUpdate()` 调用时抛出 `"undefined" is not valid JSON` 错误
- **断言**：`judgeUpdate(currentVersion, distTags, skipState)` 应在 distTags 为 undefined 时优雅降级，返回 `check_failed`
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs` 的 `judgeUpdate` 在某些参数组合下未做 null/undefined 防御，直接 `JSON.parse` 导致异常
- **证据**：`evidence/d1-upgrade/stdout.log`（D1-1 测试项）
- **状态**：待提单

## #5【P1】D1-3 更新检查 includes 属性读取错误

- **现象**：`judgeUpdate()` 调用时抛出 `Cannot read properties of undefined (reading 'includes')` 错误
- **断言**：`judgeUpdate` 应在参数缺失时返回安全默认值，不应抛出未捕获异常
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs` 的 `judgeUpdate` 内部对 `skipState` 或 `distTags` 属性访问未做 null 防御
- **证据**：`evidence/d1-upgrade/stdout.log`（D1-3 测试项）
- **状态**：待提单

## #6【非产品缺陷】D10-3 eval harness 路由准确率低（21.4%）

- **现象**：eval harness 15 条中文意图 prompt 中仅 3 条 HIT、11 条 MISS、1 条 N/A，准确率 21.4%
- **说明**：eval harness 本身存在且可运行（D10-3 PASS），但 serviceCatalog 路由逻辑对中文意图识别能力不足。此为已知基线问题（与 Hermes 客户端结果一致），非本轮新增缺陷。
- **证据**：`eval/results/eval-run-20260917023237.csv`
