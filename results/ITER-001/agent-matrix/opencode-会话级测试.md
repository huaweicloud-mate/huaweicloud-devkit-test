# ITER-001 OpenCode 会话级测试（zhangshuang，2026-09-07）

## 结论：✅ OpenCode 会话级可用（跨客户端会话级第一例）

## 卡点排障链（3 个根因逐一击破）

| # | 现象 | 根因 | 修复 |
|---|---|---|---|
| 1 | `AI_LoadAPIKeyError: DeepSeek API key is missing` | **auth.json 位置错**：opencode 1.18 Linux 读 `~/.local/share/opencode/auth.json`，我们写了 `~/.config/opencode/` | 复制到正确位置（0600）+ `.bashrc` 写 `DEEPSEEK_API_KEY` 兜底 |
| 2 | MCP server unavailable（status=failed）→ agent 用 bash 兜底探查导致超时 | **`node` 不在 PATH**（SSH 非登录 shell 无 `/opt/node22/bin`） | `opencode.json` 的 mcp.command 改绝对路径 `/opt/node22/bin/node` |
| 3 | `opencode run "prompt"` 静默退 | **参数传参方式在管道/CI 环境不生成输出** | 改用标准用法 `echo "prompt" \| opencode run`（管道模式） |

## 会话记录（真实调用轨迹）

```
> build · deepseek-v4-pro-0813（默认模型，网关 opengw）
⚙ huaweicloud-devkit_huaweicloud_retrieve_skill {"name":"huawei-billing"}
⚙ huaweicloud-devkit_huaweicloud_run_readonly_command {"args":["BSS","ShowCustomerAccountBalances","--help","--cli-region=cn-north-1"]}
⚙ huaweicloud-devkit_huaweicloud_check_cli
⚙ huaweicloud-devkit_huaweicloud_auth_status
→ agent 正确分析：hcloud 未装（HCLOUD_NOT_FOUND）+ 凭证未配置，给出 auth init/switch 引导
```

## 测试价值

1. **OpenCode 会话级 = ✅**（模型流 + MCP 工具调用 + 推理/引导闭环）——跨客户端矩阵从 1/10 升到 **2/10 会话级**
2. 证明在**无 hcloud/无凭证**环境下工具体系正确处理（Not Found 友好返回，无崩溃）
3. 排障方法论：日志（opencode.log）+ 环境变量（PATH）+ 用法（管道模式）三查定位

## 环境备注

- zhangshuang 机器上还有 `zhangranran` 用户的 opencode 实例在运行（mcp-server 进程 Sep04 起）——多人共用测试机的正常现象，未干扰
- opencode 配置保留供后续使用：默认 deepseek/deepseek-v4-pro-0813 + 4 个模型 + huaweicloud MCP enabled