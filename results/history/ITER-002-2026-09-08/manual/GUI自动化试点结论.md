# ITER-002-2026-09-08 桌面 GUI 自动化试点结论（WorkBuddy/CEF）

## 尝试：用 pywinauto(UIA) 驱动本机桌面客户端执行 GUI 会话

| 步骤 | 结果 |
|---|---|
| 定位客户端 exe | ✅ WorkBuddy.exe / OfficeAce.exe 找到 |
| 启动 WorkBuddy | ✅（pid 可管理） |
| UIA 顶层窗口枚举 | ✅ `Chrome_WidgetWin_1`（Chromium/CEF）可见 |
| 控件树（输入框定位） | ❌ **仅 1 个 `Document`(Chrome_RenderWidgetHostHWND)**——CEF 应用 UI 全在内部 DOM，**UIA 不暴露聊天输入框/按钮** |
| 结论 | ❌ **CEF/Electron 系客户端（WorkBuddy/OfficeAce/OpenClaw 大概率同类）无法用 UIA 可靠驱动**（需 CDP（重启带 remote-debugging-port，影响登录态/不稳定）或键盘盲打（脆弱）） |

## 最终判定

- **A 项（7 客户端 GUI 会话清单）维持人工执行**（v2 清单已备）——GUI 层自动化对 Chromium 系应用**不可行（可靠性不足）**
- **可自动化的一切已全部自动化**：插件安装/协议层/工具调用层（10/10 无头验证）、真云只读（6 台机器）、doctor、更新检测、OBS 托管（SDK 直连）——**人工仅剩"点开客户端 UI 会话内确认 5 项"**（本質是 GUI 会话语义的最后 10%）

## 留档

- test-cases/ui-drive-probe.py / ui-drive-step2.py（试点脚本，供未来 CDP 方案复用）
- 若未来想自动化：CEF 应用走 **CDP（--remote-debugging-port + websocket DOM 驱动）** 是正确路径（本次未实施：需重启应用有风险）