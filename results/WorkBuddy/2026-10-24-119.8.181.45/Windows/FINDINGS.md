# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2）

> **落盘路径**：`results/WorkBuddy/2026-10-24-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-24 05:15:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.12

---

## #1【P0】D2-4 凭证脱敏对缩写 key ak/sk 失效

- **现象**：`redactSecrets(JSON.stringify({ak:'AKIDTEST12345678',sk:'SKTEST1234567890abcdef1234',region:'cn-north-4'}))` 返回原样 JSON，ak/sk 值未替换为 `<redacted>`
- **断言**：`redactSecrets` 输入含 `ak`/`sk` key 的 JSON 时，输出不得包含原 ak/sk 值
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:20-30` `isSecretKeyName(key)` 将 key 归一化后匹配 `/access.*key|secret.*key/`，但 `ak` 归一化为 `ak` 不含 `access`/`secret` 子串；`redactString` 的 `(AK|SK)\s*[:=]` 正则只匹配大写且需 `=` 分隔，不匹配 JSON `"ak":"..."`
- **影响**：凭证 JSON 通过 tools/call 响应泄漏明文 AK/SK，属安全红线
- **证据**：`evidence/D2-4/stdout.log` — `akLeak=true skLeak=true`
- **状态**：待提单

## #2【P0】D4-3 KMS DecryptData 明文 secret API 未拦截

- **现象**：`classifyTextCommand('hcloud kms decryptdata --cipher-text test').decision` 返回 `allow`，未被拦截
- **断言**：`classifyTextCommand` 对 `hcloud kms decryptdata` 返回 `decision==='deny'`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:240` secret 拦截正则 `/secret[_-]?string|secret[_-]?binary|showsecretversion|getsecretvalue/i` 未覆盖 `decryptdata` 操作名
- **影响**：KMS DecryptData 返回明文密文解密结果，可绕过安全拦截获取密钥明文
- **证据**：`evidence/D4-3/stdout.log` — `decision=allow`
- **状态**：待提单

## #3【P0】D4-16 sh -c 包装的 env-dump 命令未拦截

- **现象**：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"').decision` 返回 `allow`，sh -c 包装的 env-dump 未被拦截
- **断言**：`classifyTextCommand` 对 `sh -c "printenv HUAWEICLOUD_*"` 返回 `decision==='deny'`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398-419` env-dump 检测正则 `/(^|\s)(env|printenv|...)/i` 匹配命令开头，但 `sh -c "printenv ..."` 开头是 `sh`，`printenv` 在引号内，`(^|\s)` 不匹配引号内位置；classifyTextCommand 入口处先于 hcloud 分支检测，未走 stripExecutable unwrap 路径
- **影响**：攻击者可通过 `sh -c "printenv HW_*"` 绕过 hook 拦截窃取环境变量凭证
- **证据**：`evidence/D4-16/stdout.log` — `actual=allow expected=deny`
- **状态**：待提单

## #4【P0】D9-13 tools/call 凭证不泄露（同 D2-4 根因）

- **现象**：tools/call 响应中含缩写 key `ak`/`sk` 的凭证 JSON 未被 `redactSecrets` 脱敏
- **断言**：tools/call 响应不得包含 AK/SK 明文
- **根因**：同 #1，`plugins/huaweicloud-core/src/safety-policy.mjs:20-30` `isSecretKeyName` 不匹配缩写 key
- **证据**：`evidence/D9-13/stdout.log` — `noLeak=false`
- **状态**：待提单

## #5【P1】D3-C6 沙箱 7 隐式工具部分缺失

- **现象**：`TOOL_DEFINITIONS` 中 `huaweicloud_check_user`/`huaweicloud_credentials`/`huaweicloud_sign_agreement` 等隐式工具未注册
- **断言**：7 个隐式工具（check_user/credentials/sign_agreement/execute/check_result/list_resources/cleanup）均应在 TOOL_DEFINITIONS 注册
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` TOOL_DEFINITIONS 数组未包含部分沙箱隐式工具定义
- **证据**：`evidence/D3-C6/stdout.log` — `missing=huaweicloud_check_user,huaweicloud_credentials,...`
- **状态**：待提单

## #6【P1】D4-27 双路径输出脱敏（同 D2-4 根因）

- **现象**：`redactSecrets` 对含 `ak`+`sk`+`token` 的 JSON 脱敏不完整
- **断言**：`redactSecrets` 输出不含原 sk/token 值
- **根因**：同 #1，`safety-policy.mjs:20-30` isSecretKeyName 不匹配缩写 key
- **证据**：`evidence/D4-27/stdout.log` — `skLeak=true`
- **状态**：待提单

## #7【P1】EXP-C4-14 DMS 服务 list_operations 不支持

- **现象**：`callTool('huaweicloud_list_operations', {service:'DMS'})` 返回 `[USE_ERROR]不支持的服务名称:DMS`
- **断言**：`huaweicloud_list_operations` 对 DMS 服务返回操作列表（opCount>0）
- **根因**：KooCLI 不支持 `DMS` 作为服务名，需用子服务名 `Kafka`/`RocketMQ`/`RabbitMQ`；serviceCatalog 未做 DMS→Kafka 别名映射
- **证据**：`evidence/EXP-C4-14/stdout.log` — `opCount=0`
- **状态**：待提单

## #8【P1】EXP-C4-18 DEW 服务 list_operations 不支持

- **现象**：`callTool('huaweicloud_list_operations', {service:'DEW'})` 返回 `[USE_ERROR]不支持的服务名称:DEW`
- **断言**：`huaweicloud_list_operations` 对 DEW 服务返回操作列表（opCount>0）
- **根因**：KooCLI 不支持 `DEW` 作为服务名，需用子服务名 `KMS`/`CSMS`/`KPS`；serviceCatalog 未做 DEW→KMS 别名映射
- **证据**：`evidence/EXP-C4-18/stdout.log` — `opCount=0`
- **状态**：待提单

## #9【P1】EXP-E01..14 serviceCatalog 路由准确率低（21.4% HIT）

- **现象**：15 条中文意图路由测试，仅 3 条 HIT（E06 DCS、E09 CCE、E15 代金券），11 条 MISS
- **断言**：serviceCatalog 对 15 条评测集意图路由 HIT 率应 ≥ 80%
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层对多数中文意图返回 "Run hcloud --help" 兜底，未做语义匹配
- **证据**：`evidence/EXP-E01/stdout.log` 等 + `eval/results/eval-run-20261023210747.csv`
- **状态**：待提单
