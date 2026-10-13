# FINDINGS — 缺陷发现清单（CodeArtsSpace-GLM-5.2）

> **落盘路径**：`results/CodeArtsSpace/2026-10-13-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-10-13 11:50:00（北京时间）

---

## #1【P0】D4-16 命令包裹穿透

- **现象**：hook_check_command 对通过 MCP 工具包裹的 hcloud 命令未检测穿透，返回 `{"ok":true,"decision":"allow"}` 而非 deny
- **断言**：hook_check_command 对包裹形式的 hcloud 命令应返回 `decision=deny`，实际返回 `decision=allow`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` 命令分类逻辑未覆盖 MCP 工具调用包裹的 hcloud 命令形式
- **影响**：攻击者可通过 MCP 工具包裹绕过安全 hook 检查
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：已提单 #896

## #2【P1】D4-27 双路径输出脱敏

- **现象**：双路径输出中 AK/SK/token 明文泄露
- **断言**：所有输出路径的 AK/SK/token 应被脱敏，实际明文输出
- **根因**：`plugins/huaweicloud-core/src/redact.mjs` 脱敏逻辑未覆盖双路径输出场景
- **影响**：凭证可能在日志/响应中明文泄露
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：已提单 #896

## #3【P1】EXP-E01~E05,E07,E10~E14 serviceCatalog 路由 MISS（11条）

- **现象**：serviceCatalog 对 11 条中文意图评测集返回 MISS
- **断言**：serviceCatalog 应对评测集中所有 15 条中文意图命中正确服务路由，实际 11/15 MISS
- **根因**：`plugins/huaweicloud-core/src/service-catalog.mjs` 路由匹配逻辑对中文意图关键词覆盖不足
- **影响**：用户通过中文意图请求华为云服务时可能被路由到错误服务或无法路由
- **证据**：`evidence/EXP-E01/stdout.log` 等 11 个证据目录
- **状态**：已提单 #896
