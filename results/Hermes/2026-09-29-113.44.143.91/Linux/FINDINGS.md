# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-09-29-113.44.143.91/Linux/FINDINGS.md`
> **生成时间**：2026-09-29 09:20（北京时间）
> **被测版本**：`v1.1.7`（npm latest，gitHead `7456d05`，merge PR #813 release-1.1.7）
> **版本差异**：v1.1.7 与 2026-09-28 完全一致，无代码变更；36+ 支探针 fresh 全量重跑，23 FAIL + 2 SPEC-MISMATCH 全部按根因原样复现，**无新缺陷**，本轮不新开单（详见 HISTORY_LINKS.md）。

## 缺陷清单（25 项，均历史复现）

### P0（3）
1. **D4-5 写操作误判检测** — 现象：`hcloud ecs ChangeServerOsWithoutCloudInit`→`decision=allow risk=unknown_read`（预期 deny/write）。断言：Change* 写操作应判 write/deny。根因：`safety/policy.json` writeOperationPrefixes 缺 `Change`。证据：`evidence/D4-5/stdout.txt`。
2. **D4-16 命令包裹穿透** — 现象：`sh -c "env | grep HW_ACCESS_KEY"`→`allow`（预期 deny）。断言：shell 包裹内层 env-dump 应拦截。根因：`src/safety-policy.mjs:398-428` env-dump 词边界不匹配 `sh -c` 内层，解包未回溯文本规则。证据：`evidence/D4-16/stdout.log`。
3. **D9-12 initialize 握手安全基线** — 现象：未 initialize 先 tools/list 返回 40 工具（预期 -32600）。断言：非法时序应返回 JSON-RPC -32600。根因：`src/mcp-protocol.mjs` dispatch 无 initialize 状态机。证据：`evidence/D9-12/stdout.txt`（probe-d9-1213.mjs）。已提单 #814。

### P1（17）
4. **D1-70 代理配置与 WebSocket 代理** — 根因 `src/proxy/proxy-config.mjs:42-47` no_proxy 仅 hostname 后缀匹配，无 CIDR。
5. **D3-S1 场景-只读查ECS** — 中文「查云主机」未命中 ECS 路由，根因 `tools.mjs` routeMap 英文-only。
6. **D3-S3 场景-沙箱预览出URL** — 沙箱 DevBridge 隧道未建立，公网 URL 不可达。
7. **D4-27 双路径输出脱敏** — 小写 `ak=`/`sk=` 漏脱敏，根因 `src/safety-policy.mjs:45` 大小写敏感无 `/i`。
8. **EXP-C4-14 DMS · D3-C4** — `list_operations` 返回 `unsupported=true`，DMS 服务创建类回归未完整支持。
9. **EXP-C4-18 DEW · D3-C4** — 同上（DEW）。
10-21. **EXP-E01~E14 中文意图路由 miss（11 条）** — `tools.mjs` serviceCatalog routeMap 英文-only，中文意图 fallback `Run hcloud --help`（D10-3 同源）。

### P2（3）
22. **D3-S5 场景-复合意图分层路由** — routeMap 英文-only，全角逗号 `，` 不拆分。
23. **D4-25 Python hook 事件遥测分类** — 写操作落 cli:invoke，根因 `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置捕获组未命中空格分隔操作名。
24. **D4-26 findings 证据脱敏** — 根因 `src/risk-rule-engine.mjs` redactEvidence 不匹配 JSON 带引号 key。

### SPEC-MISMATCH（2）
25. **D1-68 区域环境变量优先级** — `HW_REGION` 优先于 `HUAWEICLOUD_REGION`，根因 `src/auth/credentials.mjs:171,222,352`。
26. **D8-9 安装 ID 与遥测值脱敏** — `sanitizeValue` 未敏感值脱敏，根因 `src/telemetry/telemetry.mjs:189`。