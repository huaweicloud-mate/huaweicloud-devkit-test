# FINDINGS — 缺陷发现清单（CodeArtsSpace-GLM-5.2）

> **落盘路径**：`results/CodeArtsSpace/2026-10-13-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-10-13 11:30:00（北京时间）
> **本清单是统一提单脚本的解析输入**

---

## #1【P0】D4-16 命令包裹穿透

- **现象**：hook_check_command 对通过 MCP 工具包裹的 hcloud 命令未检测穿透，返回 `{"ok":true,"decision":"allow","findings":[],"nextStep":"No Huawei Cloud hook ris..."}` 而非 deny
- **断言**：hook_check_command 对包裹形式的 hcloud 命令应返回 `decision=deny`，实际返回 `decision=allow`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` 命令分类逻辑未覆盖 MCP 工具调用包裹的 hcloud 命令形式，仅检测直接 hcloud CLI 调用
- **影响**：攻击者可通过 MCP 工具包裹绕过安全 hook 检查，执行未授权的华为云操作
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #2【P1】D4-27 双路径输出脱敏

- **现象**：双路径输出中 AK/SK/token 明文泄露，实际输出 `{"ak":"AKID123","sk":"SK1234567890abcdef","token":"STSTOKEN1..."}` 未脱敏
- **断言**：所有输出路径的 AK/SK/token 应被脱敏为 `***` 或 `<redacted>`，实际明文输出
- **根因**：`plugins/huaweicloud-core/src/redact.mjs` 脱敏逻辑未覆盖双路径输出场景（如同时 stdout+file 或 stdout+MCP response）
- **影响**：凭证可能在日志/响应中明文泄露，存在安全风险
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #3【P1】EXP-E01~E05,E07,E10~E14 serviceCatalog 路由 MISS（11条）

- **现象**：serviceCatalog 对 11 条中文意图评测集返回 MISS（未命中正确服务），涉及 EXP-E01,E02,E03,E04,E05,E07,E10,E11,E12,E13,E14
- **断言**：serviceCatalog 应对评测集中所有 15 条中文意图命中正确服务路由，实际 11/15 MISS（命中率 26.7%，基线 21.4% MISS）
- **根因**：`plugins/huaweicloud-core/src/service-catalog.mjs` 路由匹配逻辑对中文意图关键词覆盖不足，部分意图无法映射到正确的华为云服务
- **影响**：用户通过中文意图请求华为云服务时可能被路由到错误服务或无法路由，影响用户体验
- **证据**：`evidence/EXP-E01/stdout.log` 等 11 个证据目录
- **状态**：待提单

## #4【非产品缺陷】真云凭证过期导致 9 条 E2E 用例 BLOCKED

- **现象**：credentials.json 包含占位符 AK/SK（AK=AKRT, 4字符），STS token 空（0字符），所有云 API 调用返回 APIGW.0301 Unauthorized
- **说明**：此为环境问题（凭证过期/占位符），非产品缺陷。需刷新 ~/.config/huaweicloud/credentials.json 为账号 hw018619646 的真实永久 AK/SK。涉及 D3-C1,C2,C3,C13,C14,S1,S2,S3,S7 共 9 条用例。
