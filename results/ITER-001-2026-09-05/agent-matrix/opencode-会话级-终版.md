# ITER-001-2026-09-05 OpenCode 会话级测试（zhangshuang）终版——真实云数据闭环

## 结论：✅ OpenCode 会话级完整可用（跨客户端会话级 2/10）

## 最终会话实录（真实云数据，非模拟）

```
> build · deepseek-v4-pro-0813（默认模型，opengw 网关）
⚙ huaweicloud_run_readonly_command {"args":["ECS","NovaListServers","--cli-region=cn-north-4"]}
⚙ huaweicloud_run_readonly_command {"args":["ECS","ListFlavors","--cli-region=cn-north-4","--limit=2"]}
→ agent 汇报（exitCode 0）：
  1) 无云服务器：servers: []
  2) 2 个规格：ac7.12xlarge.2 (48C/96GB) / ac7.12xlarge.4 (48C/192GB) + next_marker
```

## 排障与启用过程（全记录）

| 步骤 | 现象 | 处置 |
|---|---|---|
| 1 | auth.json 位置错 → key missing | 复制 `~/.local/share/opencode/`（0600）+ env 兜底 |
| 2 | MCP server failed（node 不在 PATH） | mcp.command 改绝对路径 `/opt/node22/bin/node` |
| 3 | `run "prompt"` 静默退出 | 改标准管道模式 `echo ... \| opencode run` |
| 4 | 引导 agent 自主 auth_switch（import persist）→ agent 长时间探索（pip SDK 绕道）超时 | 预配三端凭证（S1/S2/hcloud），会话只做查询 |
| 5 | **最终** | 只读查询会话 1 次通过，真实数据返回 |

## 会话级观察（OBS-1，低严重度）

- **OpenCode agent 对 `auth_switch`（凭证导入）工具的使用引导性不足**：提示词点名工具名时 agent 未调用（探索 25+ 步后转向 pip 安装华为云 SDK 绕道，而非用 MCP 的 huaweicloud_auth_switch）——会话级工具发现/选择行为的真实观察；只读查询类工具（run_readonly/retrieve_skill/search_docs/check_cli/auth_status）被 agent 稳定选用。
- **含义**：MCP 工具在 OpenCode 会话内可用且权限放行（permission allow），但**写类/凭证类工具的 agent 自主调用意愿低**——建议工具描述强化 use-case 引导（D10-1 工具描述可选性在会话级的佐证）。

## 当前 zhangshuang 环境（留存）

- opencode 1.18.29 + 默认模型 deepseek/deepseek-v4-pro-0813（4 模型可用）
- huaweicloud MCP enabled（绝对路径 node）+ 10 个 huaweicloud 插件
- KooCLI 已装（/usr/local/bin/hcloud，从 devkit 官方 baseUrl 获取 arm64 包）+ 三端凭证就绪
- 后续可直接 `opencode` 交互使用；或 `opencode run` 管道自动化