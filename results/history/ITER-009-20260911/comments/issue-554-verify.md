## 测试方复验：dev 分支 @0316e00（v1.1.3-next.4）——部分修复（主检测路径已绕过，同步/升级路径仍复现）

**判定：部分修复。** 主检测入口已不依赖 npm.cmd，但同步查询与升级执行路径在 Windows 上仍 EINVAL 实测复现。**保持 open，不关单。**

- 复验基线：官方仓 dev 分支最新 commit `0316e0076cbd6d1f435432d42fd5aef42d72cd23`（PR #621 合入后，GitHub API 实时态）；本地工作树源码核查 + 本机实测（Windows 10，Node v22.23.2，npm 10.9.8）。

**已修复（#613 合入）**：`checkForUpdate()`（setup-cli.mjs:3273-3283）改走 `queryDistTagsFetch()`（fetch npm registry + 15s 超时 + DEBUG 日志）——CLI 启动检测不再 spawn `npm.cmd`。

**仍存在（实测 EINVAL）**：
- `update-check.mjs:220 queryDistTagsSync()` → `spawnSync('npm.cmd', ['view', …])` **无 shell:true** → 实测 `error=spawnSync npm.cmd EINVAL`
- `update-check.mjs:241 queryDistTags()` → `spawn('npm.cmd', …)` **无 shell:true** → 实测 `error event: spawn EINVAL`（MCP 会话内 `getCachedUpdateInfo` 默认走此路径，即 huaweicloud_check_update 仍失效）
- `update-check.mjs:394 upgradePackage()` → `spawnSync('npx.cmd', ['--yes', …])` **无 shell:true** → 实测 `error=spawnSync npx.cmd EINVAL`（Windows 上升级执行不可达）
- 对照实验：同一命令加 `{shell:true}` 后 status=0，正常返回 `latest: "1.1.3" / next: "1.1.3-next.4"`。

**影响**：受限/常规网络下 CLI 侧检测已通；但 MCP 会话内升级检测与升级执行在 Windows 上仍完全失效（静默失败）。

**建议**：为 `queryDistTagsSync` / `queryDistTags` / `upgradePackage` 三处补 `shell:true`（或统一改 fetch），并补充 Windows 平台回归用例（可参考本地探针 `devkit-test/scripts/probe554.mjs`）。修复进线后可复核关闭。