# ITER-002-2026-09-08 OfficeAce 客户端会话级——CDP 自动化（成功）

## 结论：会话级自动化打通 ✅｜G2 通过 ｜ G1 失败（连接器离线）

## 自动化流程（复用 WorkBuddy 套路）
CDP(9224) → 壳层 DOM → 点击"新建会话" → contenteditable 聚焦 → insertText+Enter → 轮询读思维/结果

## 会话真实结果（G2 语义通过——真实多区域查询）

```
cn-east-3   ❌ Token 区域不匹配
cn-south-1  ❌ Token 区域不匹配
cn-north-1  ❌ IAM 用户无权限
结论: 配置项目区域 cn-north-4 下无 ECS 实例；其他区域受 Token 绑定/IAM 权限限制。
     huaweicloud_devkit 节点恢复在线后可直接使用其只读工具。
（全程 14+ 工具调用、零写操作、真实云数据）
```

- **G2 只读调用**：✅ 通过（多区域查询+正确结论+安全只读）
- **G1 工具可见**：❌ **huaweicloud_devkit 连接器在 OfficeAce 显示"节点离线"**——且 09/02 历史会话即报"connection_failed/连接清理失败"→ **OfficeAce 的 MCP 连接器集成存在持续性问题**（非插件缺陷，是客户端连接器管理；建议开发关注"节点离线"提示的用户可操作性）
- **回退链**：✅ 技能→hcloud CLI 全链可用（能处理区域/Token 权限细节）

## OBS-6 扩展（MCP 连接器集成差异面）

| 客户端 | MCP 会话内可用性 |
|---|---|
| OpenCode/Hermes | ✅ 重启即用 |
| WorkBuddy | ⚠️ 需应用内连接器激活（配置写入≠生效） |
| OfficeAce | ❌ **连接器离线/历史 connection_failed**（需连接器管理修复） |

## 复现

- test-cases/cdp-officeace.py / cdp-oa-inspect.py / cdp-oa-send.py / cdp-read-oa.py