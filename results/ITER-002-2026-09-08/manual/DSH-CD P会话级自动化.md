# ITER-002-2026-09-08 DSH 客户端会话级——浏览器自动化（成功取证）

## 结论：G1 ✅（技能注入实锤）｜ G2 ⏳（approval 策略阻塞，发现 OBS-7）

## 自动化路径（浏览器工具，非 CDP）

```
dsh --profile web --port 8090 --no-open（后台服务，HTTP 200）
browser_navigate → 点新建会话 → 选工作区(Documents) → 输入"选择工作区"路径
→ 出现输入框"描述你想要构建的内容" → 输入提示词 → Enter 发送 → 轨迹页取证
```

## 会话证据（轨迹页抓取）

- ✅ **上下文注入 skill-catalog：`<available_skills> huawei-apig / huawei-billing / ...（29 项 huawei 技能全部注入）`** —— **G1 技能加载实锤**（DSH 会话自动带 devkit 技能）
- ✅ 上下文注入 @deepseek-ai/dsh-system-prompt + Request#1 + CONTEXT（runtime 策略）
- ✅ 消息成功发送、会话创建（"Documents/新会话"树）
- ⚠️ **CONTEXT 安全策略**："Approval policy: **ask**…without an available answerer, the request **fails closed**"——agent 处理长时间未完成，指向**工具调用需应用内批准、无人应答即失败**

## OBS-7 观察（DSH 会话级安全设计）

- DSH 默认 **approval=ask 且无 answerer 时工具调用 fails closed**——安全（写操作强门禁）但**自动化会话中工具调用被阻塞**（需人工在 UI 批准/配置 answerer）
- 与 WorkBuddy/OfficeAce（连接器激活/离线）不同：DSH 是"工具可用但需批准"——**四条集成路径各不相同**（OpenCode/Hermes 即用、WorkBuddy 需激活、OfficeAce 离线、DSH 需批准通道）

## 判定

- **DSH 会话级 = PARTIAL**：G1 ✅（29 技能注入）｜ G2 ⏳（审批通道未提供→待人工批准复测可完成）
- 浏览器自动化路径成功（DSH 服务+UI 全自动可达）——该客户端无需人工摸索（UI 已可导航，批准按钮可人工点）

## 复现

- test-cases：dsh 服务启动（dsh --profile web --port 8090 --no-open）+ 浏览器导航/输入/轨迹读取（browser_* 流程，本记录为操作序列）