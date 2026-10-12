# FINDINGS — huaweicloud-devkit 每日测试缺陷清单
> 日期：2026-10-12 | 客户端：OfficeAce | OS：Windows | SUT：huaweicloud-devkit@1.1.8-next.2 (gitHead: 681895d)

---

## #1【P0】D2-4 凭证脱敏正确性

- **描述**：redactSecrets 对 JSON 对象中 AK/SK 字段未完全脱敏，凭证明文残留
- **断言**：redactSecrets({ak:"AKIDTEST...", sk:"SKTEST..."}) 所有凭证字段 === "<redacted>"
- **根因**：safety-policy.mjs redactSecrets 函数对嵌套 JSON 对象字段覆盖不全
- **证据**：evidence/D2-4/stdout.log

---

## #2【P0】D4-16 命令包裹穿透

- **描述**：MCP 工具包裹的写命令穿透 hook 安全检查，classifyTextCommand 返回 allow
- **断言**：classifyTextCommand(MCP包裹写命令).decision === "deny"
- **根因**：safety-policy.mjs classifyTextCommand 未检测 MCP 工具包裹的写操作
- **证据**：evidence/D4-16/stdout.log

---

## #3【P0】D9-12 initialize 握手协议安全基线

- **描述**：_decorateResult 返回对象缺少 jsonrpc 字段，不符合 JSON-RPC 2.0 规范
- **断言**：_decorateResult({jsonrpc:"2.0",id:1,result:{}}).jsonrpc === "2.0"
- **根因**：mcp-protocol.mjs _decorateResult 未保留 jsonrpc 字段
- **证据**：evidence/D9-12/stdout.log

---

## #4【P1】D4-27 双路径输出脱敏

- **描述**：stdout+stderr 双路径输出中 AK/SK/token 未被 <redacted> 替换
- **断言**：redactSecrets(双路径输出) 不含 AK/SK/token 明文
- **根因**：safety-policy.mjs redactSecrets 仅覆盖单路径，双路径输出未处理
- **证据**：evidence/D4-27/stdout.log

---

## #5【P2】D3-C14 沙箱 HDKit 凭证回退风险

- **描述**：clearRuntimeCredentials 后 resolveCredentials 回退到文件凭证而非抛 HDKIT_CRED_MISSING，存在凭证泄漏风险
- **断言**：clearRuntimeCredentials(); resolveCredentials() throws HDKIT_CRED_MISSING
- **根因**：credentials.mjs resolveCredentialsWithRuntime 在 runtime 清空后回退到文件凭证
- **证据**：evidence/D3-C14/stdout.log

---

## #6【P2】D8-9 sanitizeValue 未覆盖 AK 格式

- **描述**：sanitizeValue 对 AKID 前缀格式字符串未脱敏，原样返回
- **断言**：sanitizeValue("AKIDTEST1234567890ABCDEF") 不含原始 AK 字符串
- **根因**：telemetry.mjs sanitizeValue 函数未匹配 AKID 前缀脱敏模式
- **证据**：evidence/D8-9/stdout.log

---

## #7【P1】EXP-E01~E14 serviceCatalog 路由 MISS

- **描述**：serviceCatalog 对评测集 15 条中文意图中 11 条路由未命中（MISS），基线 21.4% MISS 实际 73.3%
- **断言**：serviceCatalog(中文意图) 命中对应华为云服务（非 MISS）
- **根因**：tools.mjs serviceCatalog routeMap 对部分中文意图匹配规则覆盖不足
- **证据**：evidence/EXP-E01~E14/stdout.log
- **影响用例**：EXP-E01, EXP-E02, EXP-E03, EXP-E04, EXP-E05, EXP-E07, EXP-E10, EXP-E11, EXP-E12, EXP-E13, EXP-E14
