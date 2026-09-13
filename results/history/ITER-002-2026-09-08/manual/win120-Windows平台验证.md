# ITER-002-2026-09-08 Windows 测试机平台验证（120.46.40.202）

## 结果：✅ 第二台 Windows 独立机（双 target 安装全链通过）

| 项 | 结果 |
|---|---|
| SSH 通道 | ✅（OpenSSH 修复后：旧 sshd 防火墙规则冲突→Remove 重建→Running） |
| 主机 | **ECS-HD-AI-WORK-**（华为云 AI 工作机；此前 CTS 审计 PromptCenter 轮询 source_ip 吻合——确认该机活跃使用中） |
| Node | v20.18.0（系统）+ v22.23.1（hermes 自带） |
| devkit 1.1.1 | ✅（Node22 官方 registry，11s） |
| install opencode | ✅ Skills/MCP/Safety/node_modules 落位 + 重启提示 |
| install codearts | ✅ 含 codearts 特有 `mcp/mcp_settings.json` 更新 |
| status (opencode) | ✅ MCP Installed ｜ Safety Installed ｜ **Skills 29** ｜ Configured |
| 客户端存量 | Hermes-home + opencode + codearts（无 workbuddy/dsh） |

## OBS-5 观察：Node 版本前置校验为 npm warn（非阻塞）

- Node 20 环境下 `npx huaweicloud-devkit@1.1.1 install` → npm 输出 **EBADENGINE warn**（required node>=22 / current v20.18.0）——**校验存在但仅警告、不阻止安装**（install 继续执行）
- 含义：Node20 用户可装上但可能运行异常；建议 devkit 在 install 时对 Node<22 **显式报错/提示**（而非仅 npm warn）——P3 建议项

## 意义

- D7 Windows 平台多机验证：188 + 120 两台独立 Windows 全部通过（本机为第三台 Windows 对照）
- 120 为"活跃 AI 工作机"实锤（CTS 轮询来源）——**测试未干扰其运行**（只装插件未动服务）

## 机器画像更新

| 机器 | 环境 | 状态 |
|---|---|---|
| 188.239.14.150 | Windows VECTOR-PUBLIC-F + WorkBuddy | ✅ devkit 1.1.1 + workbuddy 插件 |
| 120.46.40.202 | Windows ECS-HD-AI-WORK-（Hermes/opencode/codearts） | ✅ devkit 1.1.1 + opencode/codearts 插件 |

## 复现

- test-cases/win120-connect.py / win120-devkit.py / win120-install.py