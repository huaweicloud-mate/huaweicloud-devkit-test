# Hermes-deepseek-v4.1-flash v2.0.0 迁移用例 BLOCKED 补测报告（D6 性能基准 · v2mig2perf）

> 落盘：`results/Hermes/2026-10-31-120.46.176.133-v2mig2perf/Linux/`
> 客户端：testbot3-Hermes（Linux · Node v22.13.0 · 120.46.176.133）
> 被测对象：源码 v2 分支 `fcfe047f`（package.json 2.0.0，`npm run build` → `plugins/huaweicloud-core/dist/mcp-server.js`，56 tool）
> 补测范围：v2.0.0 迁移预演中 D6 性能与可靠性维度 6 条 BLOCKED 用例（D6-1/3/4/5/7/9）
> 驱动方式：本地探针直连 v2 MCP server（stdio，LSP Content-Length 帧）+ 源码级 handler 调用 + 子进程度量

## 一、补测结论总览

| 用例 | 标题 | 优先级 | 阈值 | 实测 | 状态 |
|---|---|---|---|---|---|
| D6-1 | 检索响应延迟 | P2 | p95<2s | **p95=13.18ms**（100 次 MCP 端到端，0 错误） | **PASS** |
| D6-3 | MCP 冷启时间 | P2 | 冷启<5s | **p95=542.19ms**（5 次真冷启） | **PASS** |
| D6-4 | 并发调度正确性 | P1 | 无死锁无消息错乱 | 30/30 id 对齐；600/600 FIFO 送达；30 会话隔离；基线 36/36 | **PASS** |
| D6-5 | 大目录/大上传 | P2 | 内存平稳不超时 | 10 万文件识别 767.6ms/峰值 56.1MB（达标）；大上传沙箱维护窗口 | **BLOCKED** |
| D6-7 | 长会话稳定性 | P2 | 无内存泄漏、hook 不失效 | 400 次调用 0 错误；RSS 增长 22.9MB/峰值 121.5MB；hook 6/6+6/6 | **PASS** |
| D6-9 | 缓存清理三入口 | P2 | 各自清空且幂等 + 清理后再拉取 | 三入口全部：清空 + 幂等 + 重新拉取 | **PASS** |

**汇总：PASS=5，FAIL=0，BLOCKED=1。**

## 二、逐条实测数值

### D6-1 检索响应延迟 —— PASS
- 主口径：单会话连续 100 次 `huaweicloud_search_docs`（20 条查询轮转）端到端往返 → **p95=13.18ms**（min 8.35 / p50 9.21 / mean 9.93 / max 28.82），100 采样 0 错误、0 空命中。
- 辅口径：直调 `searchDocs()` handler 100 次 → p95=10.08ms。
- 判定：13.18ms < 2000ms。

### D6-3 MCP 冷启时间 —— PASS
- 每次全新 spawn 进程（真冷启），计时到 `initialize` 响应：samples=[542.19, 479.97, 481.99, 518.02, 518.64]ms → **p95=542.19ms**（mean 508.16）。
- 判定：542.19ms < 5000ms。

### D6-4 并发调度正确性 —— PASS（三层）
- A. MCP 协议层：单 server 30 并发 `tools/list` → **30/30** 返回、id 1:1 对齐、tools 数恒定 56、339.6ms 内全部返回（无死锁）。
- B. `ws-exec/hwlink-fair-queue` 多路复用：30 通道 × 20 消息 → **600/600** 送达、通道内严格 FIFO（无消息错乱）、14.13ms 完成。
- C. `sandbox/session-manager`：30 路并发不同 workspace → 30 独立会话结果无串扰；同 workspace 30 路并发复用同一会话（新建 0）结果完整；项目基线 `test/session-manager.test.ts` **36/36 pass（exit 0）**。

### D6-5 大目录/大上传 —— BLOCKED（部分达标）
- Part A（本地真机）：构造 2000 子应用 / **102,000 文件**目录，`detectFramework` 识别耗时 **767.6ms**、峰值 RSS **56.1MB**、未超时、内存平稳 → 达标。
- Part B（沙箱）：`huaweicloud_sandbox_connect` 返回 `HDKIT_SANDBOX_MAINTENANCE`（沙箱功能升级维护，服务端），无法建立 workspace 会话执行 `sandbox_upload_project`。
- 结论：大目录边界（10 万文件）已真机验证达阈；大工程上传因沙箱维护窗口阻塞，如实标 BLOCKED。

### D6-7 长会话稳定性 —— PASS
- A. 单 MCP 进程内 **400** 次连续调用（前 60 次 warmup）：**零错误**（err=0/hang=0），时延 p50=2.38ms / p95=114.97ms；RSS 基线 98.96MB→末 121.84MB（**增长 22.9MB**，峰值 **121.5MB**，稳态漂移 18.5MB，无泄漏趋势）；tool 数 56→56 恒定。
- B. hook 不失效：会话 6 个检查点（iter 0/80/160/240/320/399）验证 PreToolUse 安全 hook → 只读 **6/6 放行**、写 **6/6 拦截**；会话内 `huaweicloud_hook_check_command` 各 20 次判定恒定（只读=allow / 写=warn）。
- C.（补充，非判据）真沙箱长会话 `sandbox_exec_with_session` 因维护窗口阻塞。

### D6-9 缓存清理三入口 —— PASS
- `invalidateUpdateCache`：查询 1 → 命中(1) → 清理后(2) → 重复清理后(3)。
- `clearIconCache`：fetch 1 → 命中(1) → 清理后(2, source=live) → 重复清理后(3)。
- `clearMarketCache`：index fetch 1 → 命中(1) → 清理后(2) → 重复清理后(3)。
- 三入口均满足「各自清空 + 幂等 + 清理后再查询触发重新拉取」。

## 三、环境与证据

- hdk 源码 checkout `fcfe047f`；`plugins/huaweicloud-core/dist/mcp-server.js`（56 tool）；Node v22.13.0。
- 探针：`evidence/<case-id>/probe.mjs`（+ `mcp-client.mjs`，Content-Length 帧 stdio 客户端）；原始数值 `evidence/<case-id>/stdout.log`。
- 真云红线：本轮全部为只读/本地探针，未创建任何真实云资源；D6-5 构造的 10 万文件目录已在 finally 清理。
- 沙箱依赖：D6-5 Part B、D6-7 Part C 依赖沙箱，命中服务端维护窗口 `HDKIT_SANDBOX_MAINTENANCE`，如实记 BLOCKED。
- 回填：`用例矩阵-设计级.csv` 6 条 D6 行已回填「执行状态/执行时间/evidencePath/blockedReason」；汇总见 `_final_summary.json`，明细见 `FINDINGS.md`。
