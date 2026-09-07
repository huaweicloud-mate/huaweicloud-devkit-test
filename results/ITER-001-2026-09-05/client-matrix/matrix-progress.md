# ITER-001-2026-09-05 客户端矩阵进度（T2 进行中）

> 执行：2026-09-07 ｜ 被测插件：huaweicloud-devkit **1.1.1-next.15**

## 安装进度（2026-09-07 全矩阵完成）

| 客户端 | CLI 版本 | 插件状态 | 配置落点验证 |
|---|---|---|---|
| **CodeArts Agent** | 无需 CLI | ✅ Installed | status 确认 |
| **CodeArts Work** | 无需 CLI | ✅ Installed | ✅ `%USERPROFILE%\.codeartswork\`（README 一致） |
| **WorkBuddy** | 无需 CLI | ✅ Installed | ✅ `~\.workbuddy\` |
| **OpenCode** | ✅ 1.18.29 | ✅ Installed（29 Skills） | ✅ `~\.config\opencode\huaweicloud-plugins` |
| **Codex** | ✅ 0.153.4 | ✅ **installed, enabled 1.1.1-next.15**（C1 修复后） | ✅ `.codex\plugins\cache\…\1.1.1-next.15` + **29 skills 落位** |
| **DSH** | 无需 CLI | ✅ Installed | ✅ `~\.dsh\huaweicloud-plugins` |
| **OfficeAce** | 无需 CLI | ✅ Installed | ✅ `%LOCALAPPDATA%\Programs\OfficeAce\.office-claw\…` |
| **OpenClaw** | 无需 CLI | ✅ Installed | ✅ `~\.agents\huaweicloud-plugins` |
| **AtomCode** | 无需 CLI | ✅ Installed | ✅ `~\.atomcode\huaweicloud-plugins` |
| **Hermes** | — | ✅ Installed（+Safety Hooks） | ✅ hermes-home |

## D5-3 工具枚举（Hermes 代表客户端）

- ✅ dev `tools.mjs` = **37 工具**（PR#498 新增 `auth_switch`/`auth_confirm`）与 Hermes MCP 暴露**完全一致（37/37，0 差异）**
- ✅ 无 description 缺失（schema 粗检）
- 工具清单：check_cli / plan_cli_command / run_readonly_command / list_operations / run_approved_command / show_profile_redacted / hook_check_{command,artifacts,deploy_plan} / service_catalog / explain_error / search_docs / retrieve_skill / list_regions / get_regional_availability / search_marketplace / get_service_icon / detect_framework / setup_obs_config / auth_{status,sync,init,switch,confirm} / sandbox_* ×11 / voucher_{status,claim}
- 复现工具：test-cases/tools-enum.py（可重复执行）

## 关键发现

### C1 Codex 插件安装声称完成但未生效（P 类候选）

- install --target codex 输出"Or mention @huaweicloud-core in Codex"但 `status --target codex` = **Plugin: Not installed**
- `~/.codex/config.toml` 无 huaweicloud-core 注册；`~/.codex/plugins` 无插件文件（递归搜索 0 结果）
- **对照**：其余 5 个 target（含同批安装的 opencode/codearts 系列）全部正常——为 Codex 适配特异性问题
- **影响**：D1-1（安装闭环）/ D5-2（落点）/ D5-1（发现加载）在 Codex 上失败；README"mention @huaweicloud-core"承诺不成立
- **猜测**：Codex CLI 0.153.4 较新（Windows 目录/插件机制变化）或 install 对已有 config.toml 的合并处理缺陷；待进入 Codex 目录深挖 install 日志确认
- **处置**：记录 gaps（P1 候选）；建议跟踪 issue #501 一并或单独上报

## 备注

- @openai/codex 与 opencode-ai 在华为云 npm 镜像不可用/超时 → npmmirror 安装成功（环境事件记录）
- CodeArts 系列无需预装客户端 CLI——`install --target` 直接写配置（README 流程确认）
- Hermes 客户端已于前期就绪（1.1.1-next.15，MCP 工具验证通过）

## 待办

- [ ] Codex 安装根因深挖（install 日志/README codex 适配文档）
- [ ] D5-1 发现加载验证（各客户端配置清单，已装 6 target）
- [ ] D5-3 工具枚举（tools/list 36+ 工具 diff）
- [ ] 长尾客户端（DSH/OfficeAce/OpenClaw/AtomCode/通用 MCP）排入下一批