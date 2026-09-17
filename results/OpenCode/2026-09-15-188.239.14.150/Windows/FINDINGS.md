# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-09-15-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-15 22:10（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】凭证 env 打印拦截规则未覆盖实际 HW_ACCESS_KEY/HW_SECRET_ACCESS_KEY 变量名

- **现象**：`hook_check_command("printenv HW_ACCESS_KEY HW_SECRET_ACCESS_KEY")` 返回 `{"ok": true, "decision": "allow"}`，未被拦截。同样 `echo %HUAWEICLOUD_ACCESS_KEY%` 也未被拦截（echo 命令不在检测模式中）。而 `printenv HUAWEICLOUD_ACCESS_KEY`（含 HUAWEICLOUD 关键字）则正确返回 `deny`。
- **断言**：`hook_check_command` 对包含 `HW_ACCESS_KEY`、`HW_SECRET_ACCESS_KEY`、`HW_SECURITY_TOKEN` 的 `printenv`/`env` 命令应返回 `decision=deny`（与 `HUAWEICLOUD_ACCESS_KEY` 一致）
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335-336` + `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:39`
  - safety-policy.mjs 第 336 行关键字正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未包含 `HW_ACCESS_KEY` / `HW_SECRET_ACCESS_KEY` / `HW_SECURITY_TOKEN` 前缀
  - 实际华为云凭证环境变量名（credentials.mjs:130-132 使用 `process.env.HW_ACCESS_KEY` / `process.env.HW_SECRET_ACCESS_KEY` / `process.env.HW_SECURITY_TOKEN`）不匹配上述正则
  - 另外，`echo` 命令不在第 335 行的命令检测模式 `/(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)/i` 中，`echo %HW_ACCESS_KEY%` 也能绕过
- **影响**：Agent 可通过 `printenv HW_ACCESS_KEY` 或 `echo %HW_ACCESS_KEY%` 将真实华为云 AK/SK 环境变量打印到上下文中，绕过安全策略的凭证泄露防护
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：已知历史缺陷，关联 #561 #672 #674 #679 #681 #694（不重复提单，本轮为复核确认缺陷仍存在）

---

## #2【P1】MCP server 未强制 initialize 握手时序，initialize 前可处理 tools/call 请求

- **现象**：新连接未发送 `initialize` 请求时，直接发送 `tools/call` 请求，服务器返回正常结果（非错误）。MCP 规范要求服务器在 `initialize` 握手完成前不得处理除 `initialize` 以外的请求。
- **断言**：`initialize` 前发送 `tools/call` 应返回 JSON-RPC 错误（code=-32000 或 -32600，message 含 'initialize'），而非正常 result
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:156-162`
  - `handleMessage` 函数（第 156 行）仅对 `notifications/initialized` 做了 early return（第 158 行），未检查会话是否已完成 `initialize` 握手
  - 第 162 行 `dispatch(message.method, ...)` 对所有请求无条件分发，无 initialization state guard
- **影响**：违反 MCP 协议时序规范；客户端可在未完成握手时调用工具，可能导致能力协商失效、安全策略未加载等风险
- **证据**：`evidence/D9-4/stdout.log`（initialize前tools/call返回result，时序判定=false）
- **状态**：新发现

---

## #3【P0】serviceCatalog 路由对中文 prompt 大面积 MISS（准确率 21.4%）

- **现象**：D10 评测集 15 条 prompt 中，11 条 MISS（准确率 3/14=21.4%，远低于 90% 阈值）。中文 prompt 如「帮我查一下我账号在华北北京四有哪些云主机」(期望 ECS) 返回 `Run hcloud --help to list available services`（fallback），未路由到正确服务。
- **断言**：`huaweicloud_service_catalog(intent="帮我查一下我账号在华北北京四有哪些云主机")` 的 `recommendedServices` 应包含 `ECS`（同理 E02-E14 各自期望服务）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776-1882`
  - `serviceCatalog` 函数（第 1776 行）的 `routeMap` 关键词以英文为主（`ecs`, `server`, `vm`, `instance`, `rds`, `mysql` 等），缺少中文同义词
  - 第 1884 行 `tokens = new Set(it.split(/[\s,./-]+/))` 对中文分词无效（中文无空格），`云主机`/`云服务器`/`云数据库`/`弹性公网IP`/`备份策略`/`费用`/`监控`/`证书`/`权限`/`函数` 等中文术语不匹配任何 route 的 keywords
  - 第 1887 行匹配逻辑 `route.keywords.some((kw) => (kw.includes(' ') || cjk.test(kw) ? it.includes(kw) : tokens.has(kw)))` 中，`cjk.test(kw)` 对英文 keyword 返回 false，走 `tokens.has(kw)` 分支，中文 token 不匹配英文 keyword
  - 仅 voucher 路由（第 1878 行）和 sandbox 路由（第 1865-1868 行）有少量中文关键词（`领券`/`代金券`/`网站`/`网页`），导致 E03「静态网站」误匹配 sandbox 而非 OBS
- **影响**：中文用户使用 service_catalog 工具时 78.6% 的 prompt 无法路由到正确服务，严重影响中文场景下的能力发现体验
- **证据**：`evidence/D10-3/stdout.log` + `eval/results/eval-run-20260915134456.csv` + `evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E14/stdout.log`
- **状态**：新发现

---

## #4【P2·SPEC-MISMATCH】MCP server 无取消（cancellation）能力支持

- **现象**：`initialize` 响应的 `capabilities` 仅含 `{"tools":{}}`，无取消能力声明。发送 `notifications/cancelled` 后，服务器忽略取消通知，请求正常完成（未中止）。
- **断言**：`initialize` 响应 `capabilities` 应含取消支持字段，或 `notifications/cancelled` 后服务端应在 2s 内中止 in-flight 请求（设计期望）
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:156-159`
  - `handleMessage` 对 `notifications/initialized` 做了 early return（第 158 行），但未处理 `notifications/cancelled`
  - 服务器无 in-flight 请求追踪机制（pending map），无法实现取消中止
- **影响**：客户端无法取消长时间运行的请求，用户体验受限（设计用例 D9-9 期望取消能力）
- **证据**：`evidence/D9-9/stdout.log`（capabilities={tools:{}}，cancel通知后请求正常完成）
- **状态**：新发现（SPEC-MISMATCH — 实现与设计契约漂移，设计期望取消能力但实现未提供）
