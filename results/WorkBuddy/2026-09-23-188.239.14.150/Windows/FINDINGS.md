# FINDINGS — 缺陷发现清单（WorkBuddy-GLM-5.2）

> **落盘路径**：`results/WorkBuddy/2026-09-23-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-23 17:45:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。
> **被测版本**：v1.1.7-next.0（gitHead 0790e92a）

---

## #1【P0】D1-39 Windows 升级检测链失效（parseDistTagsOutput 丢弃 npm 数组输出致 check_update 恒 check_failed）

- **现象**：MCP `huaweicloud_check_update` 恒返回 `{"result":"check_failed","latestStable":null,"latestNext":null,"targetVersion":null,"updateAvailable":false,"note":"检测失败，不影响使用"}`。直调 `queryDistTagsSync()` 返回 `null`；但同一环境执行 `npm view huaweicloud-devkit dist-tags --json` 正常返回 `[{"next":"1.1.7-next.0","latest":"1.1.6"}]`；`parseDistTagsOutput('[{"next":"1.1.7-next.0","latest":"1.1.6"}]')` 实测返回 `null`。
- **断言**：Windows/任意平台下 `parseDistTagsOutput` 应正确解析 `npm view --json` 输出，`queryDistTagsSync()` 返回 `{latest:"1.1.6", next:"1.1.7-next.0"}`，`judgeUpdate` 据此返回 `update_available`；不得静默返回 `check_failed`。
- **根因**：`src/update-check.mjs:86` — `parseDistTagsOutput` 中 `if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;` 直接拒绝数组；而 `npm view <pkg> dist-tags --json` 的标准输出为数组 `[{...}]`，故解析恒 null → `judgeUpdate` 命中 `!distTags` 分支返回 `check_failed`（`update-check.mjs:115-117`）。
- **影响**：升级提醒 / 版本检测链从源头失效，全平台（Windows/Linux）用户均收不到升级提示；D1-39（Windows 升级检测链可用性，P0）不达标。
- **证据**：`evidence/D1-39/stdout.log`（含 MCP 响应、queryDistTagsSync=null、parseDistTagsOutput=null、npm 原始输出）
- **状态**：待提单

## #2【P0】D4-23 huawei-agent-rules.md 全局规则文件缺失

- **现象**：在 hdk 源码插件目录 `plugins/huaweicloud-core/` 及已安装 npm 包中均无 `huawei-agent-rules.md`；全仓（含 .mjs/.js/.json/.md）搜索 `agent-rules` 仅命中 `docs/audit-report-2026-08-20.md`（文档提及，无实现文件），无任何安装目标注入逻辑引用该文件。
- **断言**：安装后插件目录应存在 `huawei-agent-rules.md`，含 MUST 约束（如禁止直连 csms/kms），11 个安装目标均注入且约束可执行，无孤儿文件。
- **根因**：`plugins/huaweicloud-core/` 目录下无 `huawei-agent-rules.md` 文件（源码与已安装包均缺失），插件内也无引用/注入代码，功能未实现或已被移除。
- **影响**：全局安全规则未注入 Agent 系统提示/规则，MUST 约束（禁止直连 csms/kms 等）无法生效；P0 安全用例不达标。
- **证据**：`evidence/D4-23/stdout.log`
- **状态**：待提单

## #3【P1】D1-42 dismiss 真实闭环不成立（同源 parse 缺陷致 targetVersion 恒 null）

- **现象**：调用 `huaweicloud_check_update{dismiss:true,dismissVersion:"9.9.9"}` 后返回 `dismissed=false`；再次调用 `check_update` 仍 `dismissed=false`。因检测恒 `check_failed`（`targetVersion=null`），dismiss 无可记录版本，skip 冷却文件不生效，跨调用/进程重启均无持久化。
- **断言**：`check_update` 确认 `update_available` 后调用 `dismiss`，应写入正确 agent/plugin 路径的 skip 文件，字段完整且 `expireAt = dismissedAt + 3 天`；同版本冷却期内及进程重启后返回 `dismissed=true`。
- **根因**：`src/update-check.mjs:86`（同 #1）致 `distTags` 恒 null，`judgeUpdate` 永不进入 `update_available` 分支，`dismiss` 无 target 可写入；闭环从首个环节断裂。
- **影响**：升级提醒的「忽略本次」交互完全失效（与 #1 同源）；D1-42（P1）不达标。
- **证据**：`evidence/D1-42/stdout.log`
- **状态**：待提单

## #4【P1】EXP-E01~E14 / D10-3 serviceCatalog 中文意图路由准确率仅 21.4%

- **现象**：eval harness（`run-eval.mjs`，真实 `tools/call huaweicloud_service_catalog`）对 15 条中文意图经 MCP 实测：仅 3 条 HIT（DCS、CCE、Incentive Voucher），11 条 MISS（返回兜底 "Run hcloud --help to list available services."），1 条 N/A（诊断）。准确率 21.4%（3/14）。MISS：EXP-E01/02(期望 ECS)、E03(OBS，实际 Sandbox+DevStation)、E04(EIP)、E05(RDS)、E07(CBR)、E10(FunctionGraph)、E11(BSS)、E12(CES)、E13(ELB)、E14(IAM)。
- **断言**：`huaweicloud_service_catalog(intent)` 应将中文意图正确路由到对应服务（ECS/VPC/OBS/RDS/EIP/CBR/FunctionGraph/BSS/CES/ELB/IAM），准确率显著高于 21.4%，而非返回兜底提示。
- **根因**：`src/tools.mjs:1815` `serviceCatalog` 的中文意图匹配词表覆盖不全（"云主机"/"云服务器"/"弹性公网IP"/"云数据库"/"函数"/"费用"/"用户权限"等未命中），回落至 `Run hcloud --help` 兜底分支。
- **影响**：Agent 无法将中文用户意图路由到对应华为云服务，中文交互需用户手动指定服务，体验显著下降；覆盖全部中文使用场景。
- **证据**：`evidence/D10-3/stdout.log`、`evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E14/stdout.log`；harness 结果：`eval/results/eval-run-20260923092452.csv`
- **状态**：待提单

## #5【P1】D4-27 redactSecrets 未脱敏 accessKeyId 字段名

- **现象**：`redactSecrets('accessKeyId: AKNABCD123456789')` 返回原值 `accessKeyId: AKNABCD123456789`（未脱敏）；而 `redactSecrets('secretAccessKey: abc123def456')` 返回 `secretAccessKey: <redacted>`（正常）。同一函数对 `AK:` 前缀格式可脱敏，对 `accessKeyId:` 字段名格式不脱敏。
- **断言**：`redactSecrets`（策略正则路径）与 `redactOutput`（CLI 输出路径）均应把 `accessKeyId`/`AK`/`access_key` 等所有凭证字段名变体的明文值替换为 `<redacted>`，且不误伤非敏感字段。
- **根因**：`src/safety-policy.mjs:49` `redactSecrets` 的字段名正则仅覆盖 `AK:` 等前缀形式，未覆盖 `accessKeyId`（以及 `access_key`/`SecretAccessKey`）等字段名变体，导致双路径脱敏不一致。
- **影响**：以 `accessKeyId:` 形式出现的凭证值可明文泄露到 Agent 上下文与工具输出；D4-27（P1）不达标。
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #6【P1】EXP-C4-14/18 DMS/DEW list_operations 静默失败

- **现象**：`huaweicloud_list_operations{service:"DMS"}` 返回 `command:"hcloud DMS --help"`、`exitCode:0`；实机执行 `hcloud DMS --help` 输出 `[USE_ERROR]不支持的服务名称:DMS`（DEW 同理）。工具把 KooCLI 的「服务名不支持」错误当作成功（exitCode=0）返回，未暴露错误。
- **断言**：`list_operations` 应对 KooCLI 不支持的服务名显式报错（非 0 退出/`ok:false` + 明确错误），或返回该服务在 KooCLI 中的正确服务名；不得以 exitCode=0 静默返回错误 help。
- **根因**：`src/tools.mjs:1753` `listOperations` 未校验 `service` 是否为 KooCLI 支持的服务名，也未检查 hcloud 输出中的 `[USE_ERROR]`；KooCLI 7.2.12 服务列表含 `Kafka`（DMS）/`KMS`/`CSMS`（DEW），无 `DMS`/`DEW` 顶层名。
- **影响**：服务矩阵中 DMS/DEW 路由不可执行且错误被吞，Agent 会基于错误 command 继续规划，误导用户。
- **证据**：`evidence/EXP-C4-14/stdout.log`、`evidence/EXP-C4-18/stdout.log`
- **状态**：待提单

## #7【P2】D8-9 sanitizeValue 未移除 AK/SK/token 敏感值

- **现象**：`sanitizeValue('accessKeyId: AKNABCD123456789 secretAccessKey: abc123')` 原样返回 `"accessKeyId: AKNABCD123456789 secretAccessKey: abc123"`（凭证未脱敏）；`sanitizeValue('a\u0000b\u0007c')` 仍保留 NUL/BEL 控制字符。`generateOrRecoverInstallId()` 两次调用稳定（installId 持久化正常）。
- **断言**：`sanitizeValue` 应移除 AK/SK/token 等敏感值并清理非法/控制字符，同时不改变合法值；installId 生成/恢复稳定持久。
- **根因**：`src/telemetry/telemetry.mjs:189` `sanitizeValue` 仅做换行/制表折叠、trim 与长度截断，无敏感值占位替换，也未过滤 NUL/BEL 等控制字符。
- **影响**：遥测事件 value 若携带凭证形态文本，将原样上报，存在凭证外泄风险。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #8【非产品缺陷】D9-9 协议 capabilities 未声明 notifications.cancellation

- **现象**：`initialize.result.capabilities = {"tools":{}}`，未声明 `notifications.cancellation`；protocol-probe 判 SPEC-MISMATCH。
- **说明**：现行 MCP 规范中 `notifications/cancellation` 属基础能力、无需在 capabilities 显式声明（capabilities 仅列有开关的 capability）。tools/call 正常，取消语义不受影响。判定为「实现与旧版设计契约漂移」，非产品缺陷，不计入缺陷单，仅记录以驱动用例预期更新。
- **证据**：`evidence/D9-9/stdout.log`
