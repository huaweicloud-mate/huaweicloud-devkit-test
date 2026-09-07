跟进：C1b 已定位为**确定性产品 bug**（跨平台可复现），附实证：

## 根因：插件名硬编码错配

- marketplace 插件名来自 `.codex-plugin/plugin.json` 的 `"name": "huaweicloud-devkit"`
- 但 `installCodex()`（setup-cli.mjs:651）硬编码 `pluginName = 'huaweicloud-core'`
- 执行 `codex plugin add "huaweicloud-core@huaweicloud-devkit"` → **必然失败**（`plugin 'huaweicloud-core' was not found in marketplace 'huaweicloud-devkit'`），且失败静默、仍打印成功提示

**实证（Windows，codex-cli 0.153.4，huaweicloud-devkit 1.1.1-next.15）**：

```
$ codex plugin add "huaweicloud-core@huaweicloud-devkit"
Error: plugin `huaweicloud-core` was not found in marketplace `huaweicloud-devkit`

$ codex plugin add "huaweicloud-devkit@huaweicloud-devkit"
Added plugin `huaweicloud-devkit` from marketplace `huaweicloud-devkit`.
Plugin: installed, enabled, version 1.1.1-next.15
```

## 附带发现 C1c：status 误报

`codexStatus()`（setup-cli.mjs:709）用 `codex plugin list` 输出**包含 'huaweicloud-core' 子串**判断安装状态——但插件安装*路径*恰好含 `plugins/huaweicloud-core`，即使插件 `not installed` 也会误判为 Installed（首次调查时 `status --target codex` 曾显示 Installed 而实际未装）。

**建议**：
1. `installCodex` 从 `PACKAGE_ROOT/plugins/huaweicloud-core/.codex-plugin/plugin.json` 读取实际 `name` 再执行 add（或对 add 失败检查 status 并输出真实错误）
2. `codexStatus` 解析 `codex plugin list` 的插件名/状态列（`installed, enabled`），而非子串匹配路径