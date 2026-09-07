# ITER-001 D7 兼容性（Linux 实测）

> 执行：2026-09-07 ｜ 机器：**zhangshuang**（113.44.143.91，Ubuntu 24.04 ARM64，Node 22.23.2）
> 方法：paramiko SSH 远程执行（复用 remote-hermes-deploy 技能通道）

## 结果：PASS（2 客户端抽样）

| 项 | OpenCode | CodeArts Agent |
|---|---|---|
| CLI | ✅ 1.18.29（npmmirror） | 无需 CLI |
| 插件安装 | ✅ `install --target opencode` | ✅ `install --target codearts` |
| MCP Server | ✅ Installed | ✅ Installed |
| Safety Policy | ✅ Installed | ✅ Installed |
| Skills | ✅ 29 个 | ✅ 29 个 |
| 落点 | ✅ `/root/.config/opencode/huaweicloud-plugins` | ✅ `/root/.codeartsdoer` |
| MCP 源码文件 | ✅ hcloud-cli/detect-framework 等落位 | — |
| SKILL.md 可读 | ✅ frontmatter 解析正常 | — |

## 与 Windows 对照（跨平台一致性）

- 安装流程/技能数量（29）/status 输出与 Windows 完全一致
- Linux 无 Windows 特有路径问题；`spawnSync(shell:false)` 的 bash-shim 测试可正常执行（印证 T1 差异结论）
- CodeArts 沙箱模式提示未触发（非 IDE 环境）

## 备注

- OpenCode 会话级工具调用需模型凭据（未配置）——冒烟止于安装/落点/完整性层（D7-1/2/3 覆盖）
- 机器上 hermes/multica 服务未受影响（测试仅写独立配置目录，未重启任何服务）
- 远程测试目录 `/root/hdk-linux-test` 保留，供后续复用（真云 E2E 等）

## 复现

- test-cases/remote-d7.py（paramiko，密码 hw@… 见记忆管理，勿入文档）