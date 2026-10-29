# FINDINGS

## #1【P0】D2-4 凭证脱敏未覆盖小写 ak=/sk= 格式
- **现象**：`redactSecrets` 函数对包含小写 `ak=`/`sk=` 格式的凭证字符串未脱敏，AK/SK 明文泄漏。
- **断言**：`redactSecrets('ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=abc.def.ghi')` 返回值不应包含 `ABCDEFGHijkl0123456789XYZ` 和 `AbCdEfGhIjKlMnOpQrStUv0123456789`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` —— `redactString` 正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 仅匹配大写 `AK`/`SK`，未覆盖小写 `ak=`/`sk=` 模式。
- **影响**：攻击者可通过小写格式绕过脱敏，导致凭证泄漏到日志/错误消息中。
- **证据**：`evidence/D2-4/stdout.log`（akLeak=true, skLeak=true）

## #2【P0】D4-3 KMS DecryptData 未被拦截(decision=allow)
- **现象**：`classifyTextCommand` 对 `hcloud KMS DecryptData` 命令返回 `decision: 'allow'`，未拦截明文密钥解密操作。
- **断言**：`classifyTextCommand('hcloud KMS DecryptData --cli-region=cn-north-4 --cipher_text=xxx')` 返回 `decision` 应为 `'deny'` 或 `'warn'`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` —— 缺少 `KMS DecryptData` deny 规则（该操作返回明文/二进制 secret，应归入 secret 类拦截）。
- **影响**：明文密钥解密操作未被安全 hook 拦截，可能导致 secret 进入 agent 上下文。
- **证据**：`evidence/D4-3/stdout.log`（decision=allow）

## #3【P0】D4-16 `$(hcloud KMS DecryptData)` 命令包裹穿透
- **现象**：`classifyTextCommand` 对 `$(hcloud KMS DecryptData)` 命令替换包裹返回 `decision: 'allow'`，命令包裹穿透未被拦截。
- **断言**：`classifyTextCommand('$(hcloud KMS DecryptData)')` 返回 `decision` 应为 `'deny'`。
- **根因**：与 #2 同根因——`cloud-risk-rules.json` 缺少 `KMS DecryptData` deny 规则。`extractInnerCommand` 的 `$(...)` 提取逻辑（`safety-policy.mjs:440`）本身正确，但内层命令仍判 allow。
- **影响**：攻击者可通过 `$(...)` 命令替换包裹 KMS DecryptData 绕过安全 hook。
- **证据**：`evidence/D4-16/stdout.log`（`$(hcloud KMS DecryptData)` decision=allow；其余 6 条包裹攻击均 deny）

## #4【P1】EXP-E01 serviceCatalog 路由未命中"云主机"关键词
- **现象**：`serviceCatalog` 对中文意图"帮我查一下我账号在华北北京四有哪些云主机"未路由到 ECS 服务。
- **断言**：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `recommendedServices` 应包含 `"ECS"`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2192-2208` —— ECS routeMap keywords 缺少 `'云主机'` 同义词。
- **影响**：中文用户使用"云主机"关键词时无法正确路由到 ECS 服务。
- **证据**：`evidence/EXP-E01/stdout.log`（verdict=MISS）
