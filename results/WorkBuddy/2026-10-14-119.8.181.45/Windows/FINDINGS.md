# FINDINGS — 2026-10-14 WorkBuddy Windows 每日测试

## #1【P0】D2-4 凭证脱敏 — lowercase ak=/sk= 未脱敏

- **现象**：`redactSecrets("ak=AKIDEXAMPLE123456789 sk=SKEXAMPLE987654321")` 返回值仍含明文 AK/SK
- **断言**：`redactSecrets("ak=AKIDEXAMPLE123456789 sk=SKEXAMPLE987654321")` 不应包含明文 AK/SK 值
- **根因**：`safety-policy.mjs:42` — redactString 正则 `/((?:access[_-]?key|secret[_-]?key|...)/gi` 只匹配带下划线的 `access_key`/`secret_key`，不匹配 bare `ak`/`sk`（小写无下划线）。Line 45 的 `/(AK|SK)\s*[:=]\s*/g` 只匹配大写 AK/SK。
- **影响**：凭证泄露风险 — lowercase `ak=`/`sk=` 格式的凭证在日志/输出中不被脱敏
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D4-3 明文secret API拦截 — KMS DecryptData 未拦截

- **现象**：`classifyHcloudArgs(['hcloud','KMS','DecryptData','--secret_id=xxx'])` 返回 `{decision:'allow', risk:'unknown_read'}`，未拦截
- **断言**：`classifyHcloudArgs(['hcloud','KMS','DecryptData','--secret_id=xxx']).decision` 应返回 `deny`
- **根因**：`safety-policy.mjs:249` — `blockedSecretOperations` 列表含 ShowSecret/ShowSecretVersion/GetSecretValue/DownloadSecret，但遗漏 `DecryptData`。DecryptData 返回明文解密数据，等同于 secret 读取。
- **影响**：安全风险 — KMS DecryptData 可泄露明文解密数据进入 agent 上下文
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #3【P0】D4-2 凭证env打印拦截 — env|grep/echo 未拦截

- **现象**：`classifyTextCommand('env | grep AK')` 返回 `{decision:'allow', risk:'not_huaweicloud'}`；`classifyTextCommand('echo HUAWEICLOUD_ACCESS_KEY=AKIDTEST')` 返回 `{decision:'allow'}`
- **断言**：`classifyTextCommand('env | grep AK').decision` 应返回 `deny`；`classifyTextCommand('echo HUAWEICLOUD_ACCESS_KEY=AKIDTEST').decision` 应返回 `deny`
- **根因**：`safety-policy.mjs:489` — `classifyTextCommand` 仅检查 hcloud 命令路径，对非 hcloud 的 shell 命令（env/echo/grep）不做凭证泄露检测
- **影响**：安全风险 — 通过 env/echo 命令可绕过 hook 读取凭证环境变量
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：待提单

## #4【P2】D1-40 镜像lag检测 — parseDistTagsOutput 拒绝数组格式

- **现象**：`npm view --registry=npmmirror` 返回 `[{latest, next}]`（数组格式），`parseDistTagsOutput` 返回 null
- **断言**：`parseDistTagsOutput('[{"latest":"1.1.8","next":"1.1.8-next.3"}]')` 应返回 `{latest: "1.1.8", next: "1.1.8-next.3"}`
- **根因**：`update-check.mjs:86` — `Array.isArray(parsed) return null` 应改为解包 `Array.isArray(parsed) ? parsed[0] : parsed`
- **证据**：`evidence/D1-40/stdout.log`
- **状态**：待提单

## #5【P1】EXP-E01 serviceCatalog 路由 MISS — 查ECS意图未命中

- **现象**：`serviceCatalog(intent="帮我查一下我账号在华北北京四有哪些云主机")` 返回通用 "use huaweicloud-core to route intent"，未命中 ECS
- **断言**：`serviceCatalog(intent="帮我查一下我账号在华北北京四有哪些云主机")` 的 recommendedServices 应包含 ECS
- **根因**：`tools.mjs` serviceCatalog 路由逻辑对中文自然语言意图匹配不足
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #6【P1】EXP-E08 serviceCatalog 路由 MISS — 排障意图未命中

- **现象**：`serviceCatalog(intent="我的ECS启动失败了帮我分析原因")` 返回通用引导，未命中 explain_error
- **断言**：`serviceCatalog(intent="我的ECS启动失败了帮我分析原因")` 的 recommendedServices 应包含 explain_error/troubleshooting
- **根因**：`tools.mjs` serviceCatalog 路由逻辑对故障排查类意图匹配不足
- **证据**：`evidence/EXP-E08/stdout.log`
- **状态**：待提单
