# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> 落盘路径：`results/Hermes/2026-09-14-113.44.197.147/Linux/FINDINGS.md`
> 生成时间：2026-09-14（北京时间）
> 提单状态：3 项 P0 缺陷已并入上游合并单 huaweicloud/huaweicloud-devkit#650/#651（同 SUT v1.1.4-next.3 回归确认，未重复拆单）；D9-9 为 SPEC-MISMATCH 待产品裁决。
> 被测版本：huaweicloud-devkit@1.1.4-next.3（gitHead 3b6290b，PR #647）

## #1【P0】凭证环境变量打印拦截未覆盖真实 HW_ 前缀

- **现象**：`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY`、`env | grep HW_SECURITY_TOKEN` 三类真实凭证环境变量打印均返回 `allow`（源码级探针实测）；而 `HWC_/HUAWEICLOUD/HCLOUD/OS_` 前缀均被正确 `deny`。
- **断言**：任何真实凭证环境变量（`HW_ACCESS_KEY`/`HW_SECRET_KEY`/`HW_SECURITY_TOKEN`）的 `printenv`/`echo`/`env` dump 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:334-337` `classifyTextCommand()` 的 env-dump 分支正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖实际凭证环境变量前缀 `HW_`（凭证变量名定义于 `src/auth/credentials.mjs:101-104` `resolveCredentials`）。Python hook 同缺陷：`hooks/huaweicloud-safety.py` `ENV_DUMP_RE` 使用同一前缀集。
- **影响**：凭证环境变量可经命令打印进入 agent 上下文，泄露 AK/SK。
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：已提单 huaweicloud/huaweicloud-devkit#650/#651（同 SUT v1.1.4-next.3 回归确认，未重复拆单）

## #2【P0】命令包裹穿透未拦截内层写命令

- **现象**：`sh -c 'hcloud ecs DeleteServers --servers i-1'` 返回 `allow`，内层 hcloud 写命令未被拦截（源码级探针实测）。
- **断言**：任意 shell 包裹（`sh -c`/`bash -c`）内的 hcloud 写命令应被识别并返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:313-319` `splitSimpleCommand()` 将引号内层折叠为单个不透明 token，使 `classifyTextCommand()` 首 token 为 `sh`（非 `hcloud`），不进入 `classifyHcloudArgs()` 写操作分类；`src/risk-rule-engine.mjs` 命令规则亦不匹配内层 `DeleteServers`。Python hook `hooks/huaweicloud-safety.py` `WRITE_OPERATION_RE` 同段落失配。
- **影响**：恶意/误操作可通过 shell 包裹绕过写操作审批门禁。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：已提单 huaweicloud/huaweicloud-devkit#650/#651（同 SUT v1.1.4-next.3 回归确认，未重复拆单）

## #3【P0】全局规则 huawei-agent-rules.mdc 未注入任何安装目标

- **现象**：`rules/huawei-agent-rules.mdc`（3840B）文件存在，但全仓代码 grep `huawei-agent-rules|\.mdc` 0 命中注入引用（唯一命中为 `docs/audit-report-2026-08-20.md` 历史审计文档）；11 个安装目标均无该规则加载逻辑，文件为孤儿。
- **断言**：安装后每个目标应向系统提示/规则注入 `huawei-agent-rules.mdc`，grep 应命中对应加载/复制引用（如 copyFileSync 复制 rules 文件、或安装器注入引用）。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs` 的 `copyFileSync` 仅复制 skill-tracker.js / telemetry / hook-plugin.mjs，无任何 agent-rules 注入逻辑；`rules/huawei-agent-rules.mdc` 无消费方。
- **影响**：全局安全规则（如禁直连 csms/kms、红线约束）未在 agent 会话生效，安全约束形同虚设。
- **证据**：`evidence/D4-23/stdout.log`
- **状态**：已提单 huaweicloud/huaweicloud-devkit#650/#651（此前 iter-002 已提 #563，同 SUT 回归确认）

## #4【P1】tools/call 超时/取消协议能力缺失（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities:{tools:{}}`，未通告 `capabilities.cancellation`；`tools/call` 无服务端超时计时器，挂起的工具调用无法通过取消通知中止，也不会返回 `{code:-32000, message含'timeout'}`。
- **断言**：设计契约要求超时返回 `{code:-32000, message 含 'timeout'}`；取消能力按 capabilities 实测（实测不存在 → 标注 SPEC-MISMATCH 而非假定）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:46-89` `dispatch()` 对 `tools/call` 直接 `await callTool()` 无超时/取消处理、`mcp-server.mjs:156-174` `handleMessage` 无计时器；`mcp-protocol.mjs:61-71` `initialize` 的 capabilities 仅返回 `{tools:{}}`。
- **影响**：工具长耗时/卡死时客户端无法超时或取消，会话可能被挂起。
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：待提单（SPEC-MISMATCH，待裁决）