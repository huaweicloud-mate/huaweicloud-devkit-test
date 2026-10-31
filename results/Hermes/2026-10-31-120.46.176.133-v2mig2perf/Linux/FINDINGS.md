# FINDINGS — v2mig2perf D6 性能基准 BLOCKED 补测（testbot3-Hermes · Linux · 120.46.176.133）

被测对象：源码 v2 分支 `fcfe047f`（package 2.0.0，`npm run build` → `plugins/huaweicloud-core/dist/mcp-server.js`，56 tool）。
Node v22.13.0；探针在 `evidence/<case>/probe.mjs`，原始数值在 `evidence/<case>/stdout.log`。

## D6-1【P2】检索响应延迟 —— PASS（MCP 端到端 p95=13.18ms < 2s）
- 口径：单 MCP 会话内连续 100 次 `huaweicloud_search_docs`（20 条中文/英文查询轮转）端到端往返计时；辅口径直调 `searchDocs()` 100 次。
- 数值：MCP 端到端 p95=**13.18ms**（min 8.35 / p50 9.21 / mean 9.93 / max 28.82，100 采样 0 错误 0 空命中）；直调 handler p95=10.08ms。
- 远低于 2s 阈值。
- 证据：evidence/D6-1/stdout.log

## D6-3【P2】MCP 冷启时间 —— PASS（p95=542.19ms < 5s）
- 口径：每次全新 spawn `mcp-server.js` 进程（真冷启），计时到 `initialize` 响应可服务；采样 5 次取 p95。
- 数值：samples=[542.19, 479.97, 481.99, 518.02, 518.64]ms，p95=**542.19ms**（min 479.97 / mean 508.16）。
- 远低于 5s 阈值。
- 证据：evidence/D6-3/stdout.log

## D6-4【P1】并发调度正确性 —— PASS（30 并发无死锁无消息错乱）
- 三层证据：
  - A. MCP JSON-RPC 协议层：单 server 上 30 个并发 `tools/list`，**30/30** 全部返回、id 1:1 对齐（无丢失/无错配），tools 数恒定 56，339.6ms 内全部返回（无死锁）。
  - B. `ws-exec/hwlink-fair-queue` 多路复用：30 通道 × 20 消息并发投递，**600/600** 全量送达，通道内严格 FIFO（无消息错乱），14.13ms 完成（无死锁）。
  - C. `sandbox/session-manager` 30 路并发 `execWithSession`：30 个不同 workspace → 各自独立会话、结果无串扰；同一 workspace 30 路并发复用同一会话（新建 0）结果完整；项目自带基线 `test/session-manager.test.ts` **36/36 pass（exit 0）**。
- 证据：evidence/D6-4/stdout.log（基线经 `node --experimental-strip-types --experimental-test-module-mocks --test` 运行）

## D6-5【P2】大目录/大上传 —— BLOCKED（大目录识别已达阈；大上传被沙箱维护阻塞）
- Part A（本地，真机执行）：构造 2000 子应用 / **102,000 文件**超大工程目录，`detectFramework` 识别：耗时 **767.6ms**（<120s 预算）、峰值 RSS **56.1MB**（<<1536MB 预算）、未超时、内存平稳 → **达标**。
- Part B（沙箱）：`huaweicloud_sandbox_connect` 返回 `HDKIT_SANDBOX_MAINTENANCE: 沙箱功能正在升级优化，暂时无法使用`（服务端维护窗口，非本机可解），无法建立 workspace 会话执行 `sandbox_upload_project`。
- blockedReason：大工程上传依赖的沙箱处于维护窗口，本轮无法真机验证上传行为；大目录边界（10 万文件）识别已验证达阈。
- 证据：evidence/D6-5/stdout.log

## D6-7【P2】长会话稳定性 —— PASS（单会话 400 次调用零错误、内存平稳、hook 不失效）
- Part A（MCP 长会话）：单 `mcp-server.js` 进程内连续 **400** 次只读工具调用（search_docs/retrieve_skill/explain_error/service_catalog/hook_check_command/list_skills/list_regions 轮转，前 60 次 warmup 填缓存）：
  - **零错误**（err=0，hang=0）、时延 p50=2.38ms / p95=114.97ms。
  - RSS 基线 98.96MB → 末 121.84MB，**增长 22.9MB**（≤64MB 预算）、峰值 **121.5MB**（≤700MB）、稳态漂移 **18.5MB**（≤24MB，无泄漏趋势）；tool 数 56→56 恒定（服务能力不退化）。
- Part B（hook 不失效）：会话全程 6 个检查点（iter 0/80/160/240/320/399）各验证 PreToolUse 安全 hook —— 只读命令 **6/6 放行**、写命令 **6/6 拦截 deny**；会话内 `huaweicloud_hook_check_command` 连续各 20 次判定恒定（只读=allow，写=warn）。
- Part C（补充，非判据）：真沙箱 `sandbox_exec_with_session` 长会话因 `HDKIT_SANDBOX_MAINTENANCE` 维护窗口阻塞（服务端，非本机可解）。
- 证据：evidence/D6-7/stdout.log

## D6-9【P2】缓存清理三入口 —— PASS（三入口各自清空且幂等，清理后再查询触发重新拉取）
- 入口 1 `invalidateUpdateCache`：预热后查询 1 次，二次读命中（仍 1），清理后重新拉取（→2），重复清理仍幂等再拉取（→3）。
- 入口 2 `clearIconCache`：预热后 fetch=1，二次读命中（仍 1），清理后 fetch=2（source=live 重新拉取），重复清理后 fetch=3。
- 入口 3 `clearMarketCache`：预热后 index fetch=1，二次读命中（仍 1），清理后 fetch=2，重复清理后 fetch=3。
- 三入口全部：清空生效 + 幂等 + 清理后再查询触发重新拉取。
- 证据：evidence/D6-9/stdout.log
