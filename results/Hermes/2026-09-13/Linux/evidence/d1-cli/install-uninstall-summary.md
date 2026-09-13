# D1 CLI install/uninstall 真机测试摘要（有副作用，只记录结果不自动重放）

执行时间：2026-09-13（Linux aarch64，isolated HOME 尝试无效——CLI 按实际 Hermes 工作区识别安装根）。

## D1-1 全新安装 install --target hermes

- 结果：`Installation complete!`
- 安装落点（hermes-home）：
  - Skills → `hermes-home/skills`（29 个）
  - MCP Server → `hermes-home/huaweicloud-plugins/src`
  - Safety Policy → `huaweicloud-plugins/safety`
  - Safety Hooks / Hook plugin → `huaweicloud-plugins/hooks` + `plugins/huaweicloud-safety`
  - MCP config / Hooks config / Hook allowlist 更新
- 观察项：`MCP Python SDK: Install failed`（提示 `python3 -m pip install mcp`）；但 post-install status 显示 `MCP Python SDK: Ready`（已预置，pip 自动安装失败但不影响就绪态）。

## D1-5 uninstall 干净度 + 还原

- `uninstall --target hermes` 清理：Hooks config removed、Removed hook plugin、Removed 1 hook approval、MCP config removed、Removed 29 skills、Removed MCP server/safety/hooks。
- post-uninstall status：Hermes Agent 全部 `Not installed`（MCP Python SDK 仍 `Ready`，属共享 SDK，`--target hermes` 不删，行为正确）。
- 随后 `install --target hermes` 还原：`Installation complete!`，全部恢复 `Installed`。

## D1-3 doctor（只读）

`Results: 11 pass, 0 warn, 0 fail`（Node>=22 / MCP server / safety policy / hcloud 7.2.12 / credentials configured / 29 skills 等全通过）。
- 观察项：doctor 末尾横幅文案写「请重启 Codex Desktop」——疑似品牌/客户端名硬编码，应显示当前客户端（Hermes），属轻微文案问题。

## D1-4 status（只读）

正确识别各客户端安装态；安装前 `Hermes Agent: Not installed`，安装后 `Installed`（幂等）。
- Environment: Node.js v22.13.0, Platform linux。