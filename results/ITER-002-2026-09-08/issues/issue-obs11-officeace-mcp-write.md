## 现象（真云实测，OBS 桶已用后立删）

> ✅ 已提交独立 issue：https://github.com/huaweicloud/huaweicloud-devkit/issues/559（2026-09-08）

OfficeAce 5.5.x（Windows，CEF）会话发送「用 huaweicloud_devkit 创建一个 OBS 桶 test-g3-oa-20260908（cn-north-4）」：
- **连接器已断开**（本机 huaweicloud-devkit 插件 09/02 曾卸载：mcp_connectors 1 行 / 注册工具 30 行 / 线程绑定 1 行被清；`.office-claw\huaweicloud-plugins` 目录不存在；连接器面板显示「已断开」）
- agent 自述「huaweicloud_devkit 工具不存在，将使用 huawei-obs 技能」→ **回退链**：设置 OBS 凭证配置 → `hcloud OBS mb` 创建桶 → 验证结果
- **云上 OBS 桶真实创建成功**（`obs://test-g3-oa-20260908`，cn-north-4，OBJECT；`hcloud OBS ls` 实证）
- **全程无审批框、无确认弹窗**（CDP 轮询 20 轮零审批类按钮）
- ✅ 已清理：`hcloud OBS rm obs://test-g3-oa-20260908 -f` → 复核 `Bucket number: 0`

## 根因

本客户端连 MCP 插件都未连接（连接器断开），agent 走**技能 + 本地 hcloud CLI 回退链**直接执行写命令——回退链上的 CLI 写操作**无任何审批/确认环节**，且连接器断开状态未限制 agent 的本地 CLI 行为。属 OBS-9（WorkBuddy）/OBS-10（DSH approval 未覆盖 MCP 通道）**同族第三例**，且形态最彻底：无 MCP 门禁、无 shell 审批、无审计界面。

## 对照

| 客户端 | 写操作门禁 | 证据 |
|---|---|---|
| Hermes / CodeArtsSpace | ✅ wrapper deny / 权限确认框 | P0-1 / 4 次审批框 |
| DSH | ❌ approval 未覆盖 MCP 子进程 | OBS-10 (#558) |
| WorkBuddy | ❌ 连接器未对 MCP 写工具设门禁 | OBS-9 (#557) |
| **OfficeAce** | ❌ **回退链裸奔（无 MCP、无 shell 审批）** | **本证据（OBS-11）** |

## 修复建议

1. **客户端侧**：连接器断开时，agent 的技能回退链写命令应套用审批策略（或直接禁用写能力）；回退链 CLI 写操作应记录审计痕迹
2. **插件侧**（同 OBS-9）：写工具 approvedByUser 外部确认 / token 会话绑定

## 严重度

P1（无 MCP 插件的客户端也能通过回退链无审批执行云写操作；连接器断开状态无行为限制）。