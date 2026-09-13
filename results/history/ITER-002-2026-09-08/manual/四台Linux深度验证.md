# ITER-002-2026-09-08 四台 Linux 深度验证（doctor + 更新检测）

## 结果

| 机器 | doctor（全链自检） | 更新检测（install 触发） | 说明 |
|---|---|---|---|
| zhangshuang | CLI not in PATH（npx 方式使用） | 无提示 ✅ | devkit 全局 CLI 未装（一直用 npx） |
| testbot1 | ✅ **9 pass / 0 warn / 0 fail**（含 Skills 29） | 无提示 ✅（1.1.1=latest，无倒退/无多余提示） | 凭证配置后 8/1 → 9/9 |
| testbot2 | ✅ **9 pass / 0 fail** | 无提示 ✅ | codearts target |
| testbot3 | ✅ **9 pass / 0 fail** | 无提示 ✅ | opencode target |

## 关键验证点

- **doctor `[PASS] MCP server can start`**：3 台装机产物的 MCP server 可启动（协议层由本机对同 npm 包 10/10 覆盖）
- **更新检测 D1-23 实机复验**：1.1.1 已最新 → install 无多余提示（官方 registry 环境无镜像倒退问题）
- node/undici 依赖落位确认（~/node22/bin/node + 插件 node_modules 完整）

## 备注

- MCP 协议探针脚本（python3 -c 嵌套）在远程引号环境多次失败——**放弃该细节调试**（doctor 已覆盖 server 可启动；协议层本机已验）；脚本留档待修
- zhangshuang 使用 npx 方式（无全局 CLI），与 testbot 全局安装差异——功能等价（之前多次 npx 验证全通过）

## 复现

- test-cases/remote-depth.py（4 台 doctor+更新检测）
- test-cases/diag-mcp-tb1.py / diag-mcp-final.py（探针调试留档）