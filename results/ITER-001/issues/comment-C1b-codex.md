补充发现（C1b，Windows 实测复现）：

## install --target codex 失败静默 + 误导性成功提示

- `install --target codex` 在 `codex plugin marketplace add` / `codex plugin add` 失败时**静默继续**（`installCodex()` 仅检查 "Access is denied"），并**无条件打印 "Or mention @huaweicloud-core in Codex"** 成功提示；用户需手动 `status --target codex` 才会发现 `Plugin: Not installed`
- **本次根因**（本机实测）：`~/.codex/config.toml` 由 Codex Windows App 生成（含 `%userprofile%` 未展开路径与 Windows 专属键），与 npm 版 `codex-cli 0.153.4` 解析冲突 → `codex plugin list` 报 `failed to load configuration ... invalid type: sequence, expected a boolean (model_catalog_json)` → 插件命令全部失败
- **验证**：备份冲突配置后重装 → `Plugin: Installed`；其余 5 个 target（opencode/codearts/codearts-work/workbuddy/hermes）同批安装全部正常

**建议**：
1. `installCodex` 检查 r1/r2 `status`，失败时输出真实错误与恢复指引（如备份配置/重装步骤），不要无条件打印成功提示
2. README 补充：Windows 上同时存在 Codex App 与 npm CLI 时配置格式冲突的说明与处理方式