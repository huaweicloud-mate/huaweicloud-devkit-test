# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-09-14-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-14 07:35:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】Windows 升级检测链 EINVAL 静默失败

- **现象**：在 Windows + Node.js v22.22.2 环境下，`queryDistTagsSync` 和 `queryDistTags` 调用 `spawnSync('npm.cmd', ...)` / `spawn('npm.cmd', ...)` 时触发 `EINVAL` 错误（无 `shell: true`），导致升级检测链静默返回 null，用户无法收到升级提醒。`queryDistTagsFetch`（fetch API 方式）可正常返回 dist-tags。
- **断言**：`spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], { windowsHide: true })` 应返回 status=0 且 stdout 含有效 JSON，不得返回 `error.code === 'EINVAL'`
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs:234` — `spawnSync(NPM_BIN, [...], { encoding, timeout, windowsHide, cwd })` 缺少 `shell: true`。Node.js v18+ 因 CVE-2024-27980 安全修复，禁止无 `shell: true` 直接 spawn `.cmd`/`.bat` 文件，抛出 EINVAL。同样问题存在于 `queryDistTags` 的 `spawn` 调用（line 255）。`getCachedUpdateInfo` 默认使用 `queryDistTags`（spawn 版本），未自动 fallback 到 `queryDistTagsFetch`。
- **影响**：Windows 用户无法收到版本升级提醒；`check_update` MCP 工具在 Windows 上返回 `check_failed`；影响所有 Windows + Node.js v18+ 环境
- **证据**：`evidence/D1-39/stdout.log` — `npm.cmd error: spawnSync npm.cmd EINVAL`，`queryDistTagsSync` 返回 null，`queryDistTagsFetch` 返回 `{"latest":"1.1.3","next":"1.1.4-next.3"}`
- **状态**：待提单
