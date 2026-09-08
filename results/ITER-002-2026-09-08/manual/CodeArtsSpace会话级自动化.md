# ITER-002-2026-09-08 CodeArtsSpace 客户端会话级（win120，CDP 自动化）

## 结论：PARTIAL——G1 会话机制 ✅（沙箱/安全策略/配置识别实证），G2 因本机缺 hcloud.exe 阻塞

## 自动化路径

```
用户 RDP 双击"启动CodeArtsSpace-CDP.bat"（--remote-debugging-port=9333）
→ 120 本机 node(内置WebSocket) 连 CDP → 探测壳 DOM（输入框"尽管吩咐，我来帮你搞定… / 调用技能"）
→ Input.insertText + Enter 发送 → 轮询读 thinking/沙箱工具/响应
```

## 会话实证（agent 思考+工具流可见）

- ✅ **安全策略识别**："安全策略确认 List 前缀是只读操作，ECS ListServers 会被允许"
- ✅ **配置感知**："配置已存在（AKSK 模式，区域 cn-north-4）"
- ✅ **沙箱工具真实执行**：PowerShell `Get-ChildItem -Filter hcloud.exe -Recurse` 多次搜索
- ✅ **引用我们安装的插件**："查看 ~/.codeartsdoer/huaweicloud-plugins 目录结构"
- ⏳ **G2 未完成**：agent 路径选择 hcloud CLI，但本机 hcloud.exe 不在标准位置（此前装于 %TEMP% 临时目录，可能已清）→ 搜索循环

## 判定

- **G1 会话机制**：✅（输入/发送/agent 推理/沙箱工具/安全策略/插件目录引用——CodeArts Space 客户端全链路工作）
- **G2 只读调用**：⏳ 环境阻塞（hcloud.exe 缺失；非插件问题；如需完成可在 120 装 hcloud 后重测）
- **PARTIAL（机制全通，结果未出）**

## 附带信息

- CodeArtsSpace 历史任务含 "huaweicloud-devkit安装确认"（21小时前）——该机此前有人安装过
- 多任务并发（Multica issue task 等歷史）——120 是活跃 AI 工作机

## 复现

- win120-cas-run*.py / cas-drive.js / cas-read.js（node WS CDP 驱动，120 本机执行）