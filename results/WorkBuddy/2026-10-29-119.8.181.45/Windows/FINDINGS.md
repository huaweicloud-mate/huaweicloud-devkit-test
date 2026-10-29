# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2）

> **落盘路径**：`results/WorkBuddy/2026-10-29-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-29 21:17:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.12

---

## #1【P0】D2-4 凭证脱敏未覆盖小写 ak=/sk= 格式

- **现象**：`redactSecrets('config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY')` 返回原文，AK/SK 未被脱敏（akLeak=true, skLeak=true）。
- **断言**：`redactSecrets` 对 `ak=<AK> sk=<SK>` 格式的输入必须脱敏为 `ak=*** sk=***`，返回字符串不得包含原始 AK/SK。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` `redactSecrets` 函数的正则表达式未覆盖小写 `ak=`/`sk=` 模式（只匹配 `AK=`/`SK=` 大写格式或 JSON 字段格式）。
- **影响**：攻击者可通过小写 `ak=`/`sk=` 格式绕过脱敏，AK/SK 明文进入 agent 上下文/日志，存在凭证泄漏风险。这是红线用例（D2-4 小写 ak= 脱敏）。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D4-3 KMS DecryptData 未被安全策略拦截（应 deny 实际 allow）

- **现象**：`classifyTextCommand('hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy')` 返回 `decision: 'allow'`，未拦截明文密钥解密操作。
- **断言**：`classifyTextCommand` 对 `hcloud KMS DecryptData` 必须返回 `decision: 'deny'` 或至少 `warn`（按 skill 文档 `huawei-cloud-dew-key-management` 的 BLOCKED 操作表，DecryptData 属于禁止在 agent 上下文中执行的操作）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 缺少 `KMS DecryptData` 的 deny 规则——规则目录中无 `DecryptData`/`decrypt` 相关条目；`risk-rule-engine.mjs` 因此对该操作 fail-open 为 `allow`。
- **影响**：agent 可直接调用 `hcloud KMS DecryptData` 解密密文，明文密钥进入 agent 上下文，违反 DEW key-management skill 的安全契约（"NEVER read or fetch secret values into agent context"）。这是红线用例（D4-3 kms DecryptData 拦截）。
- **证据**：`evidence/D4-3/stdout.log`（decision=allow）+ `evidence/D4-3/probe.mjs`
- **状态**：待提单

## #3【P1】EXP-E01 serviceCatalog 路由未命中"云主机"关键词

- **现象**：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `recommendedServices: ["Run hcloud --help to list available services."]`，未命中 ECS。
- **断言**：`serviceCatalog` 对包含"云主机"的意图必须返回 `recommendedServices` 包含 `"ECS"`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2192-2208` `serviceCatalog` 函数的 ECS routeMap `keywords` 数组包含 `'弹性云服务器'`、`'云服务器'`、`'服务器'`，但缺少 `'云主机'`（"云主机"是华为云文档/用户常用同义词）。
- **影响**：用户用"云主机"提问时路由失败，无法推荐 ECS 服务，导致 serviceCatalog 路由准确率下降（评测集 MISS）。
- **证据**：`evidence/EXP-E01/stdout.log`（verdict=MISS, got=["Run hcloud --help to list available services."]）
- **状态**：待提单

## #4【非产品缺陷】D3-C2 OBS 静态站 E2E 因凭证配置失败

- **现象**：`hcloud OBS mb obs://testbot3-hermes-obs-xxx` 返回 403 `InvalidAccessKeyId`，OBS 操作使用 `credentials.json` 中的 `test_ak_20`（无效占位凭证），而 hcloud CLI 加密配置中的 test001 只读子账号无 OBS 权限。
- **说明**：这是测试环境凭证配置问题（OBS 使用独立凭证存储，需 `huaweicloud_obs_sync_credentials` 同步），非 SUT 代码缺陷。hcloud CLI 的 ECS/VPC 操作通过加密 profile 正常工作（D3-B7 真云只读 PASS），但 OBS 需要单独的 AK/SK 同步。不计入提单。
- **证据**：`evidence/D3-C2/stdout.log`
