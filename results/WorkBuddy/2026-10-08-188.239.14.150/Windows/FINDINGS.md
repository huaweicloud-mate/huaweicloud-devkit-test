# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2）

> **落盘路径**：`results/WorkBuddy/2026-10-08-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-10-08 05:12:28（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

---

## #1【P0】D4-3 风险规则 regex 大小写敏感不匹配 CLI 命令格式

- **现象**：`hcloud csms show-secret --secret-name mysecret` 被判定为 `allow`（只读），未被 deny 拦截。而 `hcloud csms ShowSecret`（camelCase）正确命中 `deny`。
- **断言**：`hcloud csms show-secret` 应返回 `deny`（与 `ShowSecret` 一致），明文 secret API 命令必须被拦截
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json: rule hwc-command-secret-value-read` — match.regex 为 `(ShowSecretVersion|ShowSecret|DownloadSecret|GetSecretValue)`，大小写敏感，不匹配实际 hcloud CLI 格式 `show-secret`（小写连字符）
- **影响**：攻击者可通过 CLI 格式 `show-secret` 绕过明文 secret 读取拦截，获取密钥明文
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #2【P1】EXP-E01 serviceCatalog 路由未命中"云主机"中文意图

- **现象**：中文意图"帮我查一下我账号在华北北京四有哪些云主机"经 `serviceCatalog` 路由后返回 `"Run hcloud --help to list available services."`，未命中 ECS 服务
- **断言**：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 应返回 `ECS` 服务路由
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs: serviceCatalog 路由层` — 未将"云主机"映射到 ECS 服务的中英文同义词表
- **影响**：用户使用中文"云主机"查询时无法自动路由到 ECS 服务，需手动指定服务名
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #3【P2】D8-9 sanitizeValue 未脱敏 AK/SK/token 敏感值

- **现象**：`sanitizeValue('AKTEST123456')` 返回 `'AKTEST123456'`（原样返回），未脱敏
- **断言**：`sanitizeValue` 应移除 AK/SK/token 等敏感值（用例 spec："移除 AK/SK/token 等敏感值与非法字符，不改变合法值"）
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs: sanitizeValue() (line ~189)` — 仅做 `replace(/[\r\n\t]+/g, ' ')` 和 `slice(0, MAX_VALUE_LENGTH)`，无 AK/SK/token 模式检测与脱敏逻辑
- **影响**：遥测事件中可能包含未脱敏的 AK/SK/token 值，存在凭证泄露风险
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单
