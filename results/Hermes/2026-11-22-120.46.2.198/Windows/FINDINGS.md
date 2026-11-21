# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-11-22-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-11-22（北京时间）
> **被测对象**：huaweicloud-devkit@1.1.15（npm latest，gitHead bf79b643a1941ef8665548a209683435a2b7a2af）

## #1【P1】D3-C13/D3-C2 OBS 静态网站托管配置 STS 签名缺陷（403 InvalidAccessKeyId）

- **现象**：`huaweicloud_obs_set_website_config`（action=get/set）对任意桶返回 `{ok:false, status:403, body:"InvalidAccessKeyId / The security token is invalid"}`。D3-C2 静态站 E2E「建桶→set website→get→删桶归零」因 set/get website 双重 403 无法闭环（建桶 mb、删桶签名 DELETE 归零均成功）。
- **断言**：set/get website 配置应返回 200（或干净的无配置状态），而非 403 签名错误。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:3421`（obsSignedRequest 中 signedHeaders 仅含 `host;x-amz-content-sha256;x-amz-date`，未纳入 `x-amz-security-token`；而 ~3457 行 `if (creds.securityToken) headers['x-amz-security-token'] = creds.securityToken` 把 STS 临时 token 加进了请求头却未参与签名）→ OBS 校验签名时判定 token 无效，返回 403 InvalidAccessKeyId。该缺陷自 2.0.0-next.4 延续至 1.1.15。
- **影响**：OBS 静态网站托管（website config）工具不可用，D3-C2 静态站完整交付流程无法闭环。
- **证据**：`evidence/D3-C13/stdout.log`、`evidence/D3-C2/stdout.log`

## #2【P1】EXP-E01 服务目录路由缺「云主机」同义别名（未命中 ECS）

- **现象**：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 未命中 ECS，返回兜底 `Run hcloud --help to list available services.`；评测 15 条中 1 条 MISS，准确率 92.9%（D10-3 阈值 90% 达线 PASS）。
- **断言**：「云主机」应路由到 ECS（与「云服务器/弹性云服务器/虚拟机」等价）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2574`（serviceCatalog routeMap ECS 关键词含「云服务器/弹性云服务器/服务器/虚拟机/镜像」但缺「云主机」同义别名）。
- **影响**：中文口语高频意图「云主机」路由失败，D10 评测命中率下降。
- **证据**：`evidence/EXP-E01/stdout.log`

## #3【P0】D10-4 安全规则数漂移（实际 19 vs 文档 16）

- **现象**：`loadRiskRules()` 返回规则库 `9 deny + 10 warn = 19` 条，文档/用例断言 `9 deny + 7 warn = 16`。
- **断言**：规则库数量应与文档快照一致（或文档同步至实际数量）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json`（规则库扩展至 19 条，规则快照文档未同步）。
- **影响**：安全规则覆盖文档与实际漂移，审计口径不一致。
- **证据**：`evidence/D10-4/stdout.log`

## #4【P2】D8-9 telemetry sanitizeValue 未脱敏凭证明文

- **现象**：`sanitizeValue('AKID-abc\nSK-xyz password=hunter2')` 返回 `"AKID-abc SK-xyz password=hunter2"`（仅清洗控制字符 + 长度截断），AK/SK/password 仍以明文保留。
- **断言**：遥测值脱敏函数应对 AK/SK/密码类敏感字段替换为占位符。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190`（sanitizeValue 仅做控制字符清洗 + 截断，脱敏职责仍在 redactSecrets 独立路径，遥测录入链路未接脱敏）。
- **影响**：遥测事件若录入含凭证值，存在明文落盘风险。
- **证据**：`evidence/D8-9/stdout.log`