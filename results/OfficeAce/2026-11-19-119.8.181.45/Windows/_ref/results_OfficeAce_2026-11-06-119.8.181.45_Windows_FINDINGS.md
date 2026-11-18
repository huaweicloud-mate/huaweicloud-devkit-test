# FINDINGS — 缺陷发现清单（OfficeAce-testbot4）

> **落盘路径**：`results/OfficeAce/2026-11-06-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-11-06 05:20:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。
>
> 本轮 3 项 FAIL 均命中上游仓历史单（D2-4、D4-3、EXP-E01 连续复现，历史单 #1065/#1055/#980），按「全量测完统一提单、历史命中不重复开单」约定，标记为【非产品缺陷/历史问题】，不进入新提单。

## #1【非产品缺陷】D2-4 小写 ak=/sk= 凭证明文泄漏（历史问题连续复现）

- **现象**：`redactSecrets` 处理 `config: ak=TESTAK... sk=TESTSK...` 后 `akLeak=true skLeak=true`，返回样本仍含 ak=/sk= 明文
- **断言**：凭证值（ak=/sk=）应被脱敏为 `<redacted>`，`akLeak`/`skLeak` 应为 false
- **根因**：`safety-policy.mjs:45` `redactString` 中 AK/SK 正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 未加 `i` 忽略大小写，小写 `ak=`/`sk=` 绕过脱敏
- **影响**：真实 AKSK 小写形式可进入 agent 上下文/输出，凭证泄漏风险（红线 I 类）
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：历史问题，不重复提单（见 HISTORY_LINKS.md #1065/#1055/#980）

## #2【非产品缺陷】D4-3 KMS DecryptData 未拦截（历史问题连续复现）

- **现象**：`classifyTextCommand` 对 KMS `DecryptData` 返回 `decision=allow`
- **断言**：KMS `DecryptData`（返回明文密钥料）应返回 `deny`
- **根因**：`safety/policy.json` `blockedSecretOperations` 未含 `DecryptData`；`safety-policy.mjs:249` 拦截仅按该列表匹配 action，导致返回明文 secret 的 API 被放行
- **影响**：明文 secret 读取 API 可被放行，密钥料直接进入 agent 上下文
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：历史问题，不重复提单（见 HISTORY_LINKS.md #1065/#1055）

## #3【非产品缺陷】EXP-E01 serviceCatalog 中文「云主机」未路由 ECS（历史问题连续复现）

- **现象**：prompt「帮我查一下我账号在华北北京四有哪些云主机」返回 `Run hcloud --help to list available services.`，未命中 ECS（verdict=MISS expect=[ECS]），realCall=true 真实直调 MCP
- **断言**：该 prompt 应命中 `ECS` 服务路由
- **根因**：`tools.mjs:2287` ECS 路由 `serviceCatalog` routeMap 的 keywords 仅含「云服务器」，缺「云主机」
- **影响**：中文自然语言服务路由识别不完整，降低可用性（非安全影响）
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：历史问题，不重复提单（见 HISTORY_LINKS.md #1055）

## #4【非产品缺陷】沙箱/E2E 用例环境阻塞（5 例 BLOCKED）

- **现象**：`D1-67`、`D3-C3`、`D3-C14`、`D3-S3`、`D3-S7` 本轮无法执行
- **说明**：D1-67 为 DSH 客户端专属（`AGENT_TOOLKIT_MODE=local`）；其余 4 例需 DevStation 上游网络连接的真实沙箱环境，本轮不可用。非产品缺陷，不计入提单。