# FINDINGS — 缺陷发现清单（OpenCode）

> **落盘路径**：`results/OpenCode/2026-10-07-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-10-07 05:30:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.8-next.1（gitHead ffd7b47）

---

## #1【P1】D2-12 R10 runtime非空禁止落盘 — 设计预期拒绝，实际返回 needs_confirmation

- **现象**：runtime 凭证非空时调用 `auth_switch persist` 传入新 AK/SK，设计预期返回 `ok:false + auto-sync suppressed (R10)`，实际返回 `{status:"needs_confirmation", confirmToken:"switch-...", options:[s1, newImported]}`（R2 冲突确认流）。S1 未被写入（R10 部分生效）。
- **断言**：runtime 非空时 persist 应返回 `{status:error, scope:rejected}` 或 `{ok:false, suppressed:true}`，不进入确认流
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1199-1271` — `case 'huaweicloud_auth_switch'` handler 中，runtime 非空时走 R2 冲突确认流（`status: 'needs_confirmation'`），而非 R10 直接拒绝
- **影响**：R10 设计契约漂移，runtime 凭证非空时未按预期拒绝落盘，走了冲突确认流。S1 未被写入，安全底线仍部分生效
- **证据**：`evidence/D2-12/stdout.log`
- **状态**：待提单

## #2【P0】D4-3 明文secret API拦截 — csms show-secret/download-secret 未被 deny

- **现象**：`hcloud csms download-secret --secret-id 123` 和 `hcloud csms show-secret --secret-name mysecret` 被 `classifyTextCommand` 分类为 `read_only`/`unknown_read`，decision=`allow`。`agent-rules.md` 规定 `MUST NOT call hcloud csms download-secret/show-secret`
- **断言**：`csms download-secret` 和 `csms show-secret` 应被 `classifyTextCommand` 判 `deny`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:489` — `classifyTextCommand()` 未将 `csms download-secret`/`csms show-secret`/`kms decrypt` 列入 deny 规则，仅按 hcloud 命令前缀分类为 read_only
- **影响**：明文 secret API 可被 agent 直接调用，凭证泄露风险。agent-rules.md 规定不得直接调用，但 safety-policy 未强制拦截
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #3【P1】D8-9 安装 ID 与遥测值脱敏 — sanitizeValue 不脱敏 AK/SK

- **现象**：`sanitizeValue('AKABCDEFGHIJKLMNOP')` 返回原值 `AKABCDEFGHIJKLMNOP`，未脱敏。`sanitizeValue` 仅做 `replace(/[\r\n\t]+/g, ' ').trim()` + 长度截断，不识别/脱敏 AK/SK/token 等敏感值
- **断言**：`sanitizeValue` 输入 AK/SK/token 应返回 `<redacted>` 或脱敏值，不改变合法值
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-196` — `sanitizeValue()` 仅 replace 空白 + slice 截断，无敏感字段识别/脱敏逻辑
- **影响**：遥测事件可能包含未脱敏的 AK/SK/token，凭证泄露风险
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #4【P1】EXP-E01 serviceCatalog 路由未命中 — "查一下云主机"未路由到 ECS

- **现象**：serviceCatalog 接收意图 `"帮我查一下我账号在华北北京四有哪些云主机"`，期望路由到 ECS，实际返回 `"Run hcloud --help to list available services."`（未命中）
- **断言**：意图含"云主机"应路由到 ECS 服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:360`（注册）、`src/tools.mjs:1152/2217`（dispatch 与 fallback）— `huaweicloud_service_catalog` 的 intent 路由未覆盖"云主机"关键词（仅有"云服务器"等），查询类意图落到 fallback
- **影响**：用户查询 ECS 实例时无法自动路由，需手动指定服务名
- **证据**：`evidence/EXP-E01/stdout.log`，eval harness 基线 MISS 率 7.1%（1/14）
- **状态**：待提单