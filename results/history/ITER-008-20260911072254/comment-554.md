## 🔍 复验：main/dev 分支源码核查（2026-09-11）——仍未修复

按 issue 的 triage 结论（"main/dev 两条线需同步修复"，2026-09-08 转派修复 agent），今天对官方仓 main/dev 分支做了源码级核查：

### 1. main 分支（commit `2d09d5b`）— ❌ 未修复

`plugins/huaweicloud-core/src/update-check.mjs` 的 `queryDistTagsSync`：

```js
const result = spawnSync(NPM_BIN, ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
  encoding: 'utf8', timeout: timeoutMs, windowsHide: true, cwd,
});
```

- `NPM_BIN = IS_WINDOWS ? 'npm.cmd' : 'npm'` —— **仍是 npm.cmd**
- 全文件 **`shell:` 出现 0 次** —— 无 `shell: true`
- 无 undici/fetch 直连改造
- 失败仍 `catch { return null }` 静默

→ 与 608b120 复验时形态完全一致，**Windows `spawnSync('npm.cmd')` EINVAL 缺陷原样保留**。

### 2. dev 分支（commit `afa9dca` / 1.1.3-next.4）— ❌ 未修复

同样 `spawnSync(NPM_BIN, ['view', ...], {..., windowsHide: true})` 无 `shell:true`、无 undici 直连；仅新增 `debugLog()`（失败时输出错误消息）——**改善可诊断性，但 EINVAL 核心缺陷未解决**，Windows 上更新检测仍会静默失效。

### 3. 关联 PR — 无

`gh pr list --search "554"` 为空；issue 自 2026-09-08 转派修复 agent 后，**尚无修复 PR 产出**。

### 影响

- 该缺陷是测试矩阵中 **D1-39 / EXP-NR3-09（P0）** 当前唯一 FAIL 项，持续阻断 `TEST_DESIGN_READY`
- 存量用户（1.1.1 ~ 1.1.2-next.4 全部受影响版本）在 Windows 上仍收不到升级提醒，**升级路径等于失效**

### 请求

请修复 agent / 维护者确认：
1. 修复方案是否确定为 triage 建议的 **undici 直连 registry**（或 `shell: true`）？
2. 预计何时提交 PR？main/dev 两条线是否同步？

当前 P0 等待中，期待尽快修复。🙏