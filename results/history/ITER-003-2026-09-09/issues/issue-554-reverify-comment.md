## Re-verification on 1.1.2-next.4 (608b120): still broken on Windows

补充复验证据（2026-09-09，基线 1.1.2-next.4 / commit 608b120）——**该缺陷在最新 next 发布线仍未修复**。

### 复现（node 直调 update-check.mjs）

```js
// queryDistTagsSync() 现实现: spawnSync(NPM_BIN, ['view','huaweicloud-devkit','dist-tags','--json'], {encoding, timeout, windowsHide, cwd})
// Windows 下 NPM_BIN = 'npm.cmd'，无 shell:true
```

实测结果（Windows 10, Node 22, 官方 registry 可达）：

| 实验 | 结果 |
|---|---|
| [A] 现实现 `spawnSync('npm.cmd', ..., 无 shell:true)` | `status=null, error=EINVAL: spawnSync npm.cmd EINVAL` → 返回 null → 更新检测静默失效 |
| [B] 对照 `spawnSync('npm.cmd', ..., shell:true)` | `status=0`，正确返回 `{"latest":"1.1.1","next":"1.1.2-next.4"}` |
| [C] 网络对照（https 直连 registry.npmjs.org） | 正常（latest=1.1.1, next=1.1.2-next.4）→ 排除网络因素 |

### 结论

- 根因同 triage 定位（`setup-cli.mjs` checkForUpdate 的 `spawnSync('npm.cmd')` 缺 `shell:true` → EINVAL 被静默吞掉），**迁移到 `update-check.mjs` 的 `queryDistTagsSync`（L192）/`queryDistTags`（L209）后仍未修复**——`spawnSync`/`spawn` 均未加 `shell: IS_WINDOWS`。
- 影响：Windows 上 CLI 与会话级（#525）更新提示全部静默失效，"检测到新版本"从未出现。
- 修复建议：`queryDistTagsSync`/`queryDistTags` 的 spawn 调用加 `shell: IS_WINDOWS`（或 npm.cmd → `cmd /c npm ...`）；同步检查 `upgradePackage` 的 `spawnFn(NPX_BIN, ...)`（L353，`npx.cmd` 同样缺 shell）。

复现脚本见测试归档仓库 `results/ITER-003-2026-09-09/evidence/verify-554.mjs` / `verify-554b.mjs`。待上游修复后我们会在下个发布线复测。