## 测试方复验：dev 分支 @0316e00（v1.1.3-next.4）——部分修复（5 项中 2 项已修）

**判定：部分修复（项②③已修，项①④⑤未动）。** 保持 open，不关单。

- 复验基线：官方仓 dev 分支最新 commit `0316e0076cbd6d1f435432d42fd5aef42d72cd23`（PR #621 合入后，GitHub API 实时态）；本地工作树源码核查。

**已修复**：
- 项②（#607，失败态 dismiss 伪 up_to_date 伪冷却）：`update-check.mjs` `judgeUpdate()` 查询失败（distTags=null）直接返回 `result: 'check_failed'`（L114-116），不再落入 dismiss 冷却分支；`getCachedUpdateInfo` 失败节流（FAIL_THROTTLE_MS）也返回 check_failed。
- 项③（#608，upgradePackage doQuery reject 直抛）：`upgradePackage()` 已对 `doQuery()` 包 try/catch（L368-377），返回可读错误 + 手动升级命令（`npx --yes huaweicloud-devkit@<tag> update --target <target>`）。

**未修复**：
- 项①（#606）：`mcp-protocol.mjs:25` `hintConsumed` 仍为**模块级单例**——同进程会话间升级提示共享消费、remote transport 无会话绑定，问题依旧。
- 项④（#609）：pre 发布线提醒策略文档未入库（`docs/superpowers/specs` 目录为空）。
- 项⑤（#610）：remote 部署约束（无 prewarm / skip 单 HOME 单文件 / 进程级 dist-tags 缓存）未变。

**建议**：项①改为会话级状态（或按 remote 会话 ID 绑定）并补 pre 线策略文档后复核关闭。