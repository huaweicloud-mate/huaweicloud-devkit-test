# FINDINGS — 缺陷发现清单（OpenClaw-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenClaw/2026-11-13-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：`2026-11-13`（北京时间）
> **被测对象**：huaweicloud-devkit v2.0.0-next.3（npm `@next`，gitHead `4b718720`）
> **测试类型**：每日测试（daily 精选：设计级 107 + 展开级 39 + 使命 9）

> **汇总**：FAIL 4 个 + SPEC-MISMATCH 0 个，全部为历史延续（相对上一日 v1.1.14-next.2 的历史缺陷在 v2.0.0-next.3 全新 TypeScript 代码基上复现）；BLOCKED 0 项；真云用例全部真机建删归零（ECS/VPC/EIP/OBS/FunctionGraph 均 0 残留）。

> **D1-70 proxy.json 污染（测试侧，非产品缺陷）**：本机 `~/.config/huaweicloud/proxy.json` 残留 `proxy.example:8080` 虚假代理，导致真云探针 `lookup proxy.example` 失败、voucher_status 等工具首次调用报 `Cannot read properties of undefined (reading 'bind')`。已备份移除后所有真云用例恢复正常。此为测试环境残留污染，非 v2 产品缺陷。

---

## #1【P2】D1-65 调试模式环境变量契约漂移（telemetry 域 '1' 不生效）

- **现象**：`update-registry.ts:44` 支持 `DEBUG=1||true`，但 `telemetry/telemetry.ts:168` 仅 `=== 'true'`（`'1'` 不生效）。new-env 语义复现。
- **断言**：DEBUG=1/true 均开启调试日志（更新检查域与遥测域一致）。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.ts:168` 仅 `=== 'true'`，与契约『1/true 均开启』漂移。
- **影响**：遥测域调试开关 `'1'` 无效。
- **证据**：`evidence/D1-65/stdout.log`
- **状态**：历史问题（不重复提单）

## #2【P1】D4-27 双路径输出脱敏缺口（空格分隔形态泄露 AK/SK）

- **现象**：`redactSecrets("--access-key AKIA1234567890 --secret-key sksecret123")` 空格形态未脱敏（`=` 形态正常）。
- **断言**：redactSecrets 与 redactOutput 双路径均应替换明文凭证为占位符（含 `--key value` 空格形态）。
- **根因**：`plugins/huaweicloud-core/src/safety/redact.ts:36` `redactString` 仅匹配 `key[:=]value` 分隔（`["']?\s*[:=]\s*`），不匹配空格分隔形态。
- **影响**：`--key value` 空格分隔形态明文凭证泄露。
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：历史问题（不重复提单）

## #3【P2】D8-9 安装 ID 与遥测值脱敏缺口（sanitizeValue 未脱敏敏感值）

- **现象**：`sanitizeValue("AK=AKID1234567890 token=abc123")` 原样保留 AK/token 敏感值（仅 trim+截断）。
- **断言**：sanitizeValue 移除 AK/SK/token 等敏感值与非法字符，不改变合法值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry-values.ts:27-33` 无敏感值脱敏，仅 `replace(/[\r\n\t]+/g,' ').trim()` + 截断 255。
- **影响**：安装 ID/遥测链路敏感值可原样进入遥测负载。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：历史问题（不重复提单）

## #4【P1】EXP-E01 中文意图『云主机』路由 MISS

- **现象**：评测集中文意图『帮我查一下我账号在华北北京四有哪些云主机』路由返回 `Run hcloud --help`（MISS）。
- **断言**：『云主机』意图应路由命中 ECS。
- **根因**：`plugins/huaweicloud-core/src/capability-catalog.ts:31-40` ECS keywords 缺『云主机』同义词（仅 云服务器/服务器/虚拟机）。
- **影响**：中文同义意图路由未命中，D10-3 评测准确率 92.9%（HIT=13 MISS=1 N/A=1）。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：历史问题（不重复提单）