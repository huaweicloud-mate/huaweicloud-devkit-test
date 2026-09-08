## OBS-9 追加（2026-09-08）：WorkBuddy 会话内 MCP 写命令无可见审批即执行——approvedByUser 为模型自填参数

> ✅ 已提交：https://github.com/huaweicloud/huaweicloud-devkit/issues/501#issuecomment-5587517035

### 现象（真云实测，资源已用后立删）
WorkBuddy 5.5.3 会话内发送"创建 VPC test-g3-20260908，请直接执行"：
- **无 mcp-approvals.json 新增记录**（文件最新条目为历史会话 15:50），CDP 侧零人工授权点击
- **云上 VPC 真实创建成功**（ListVpcs 确认 ACTIVE，ID df04893a-...；已 DeleteVpc 复核归零）
- 同会话 shell find 命令却触发客户端审批框（"检测到受保护文件修改"3 选项：允许/始终允许/拒绝），**点拒绝后命令未执行**——证明 WorkBuddy 有审批机制，但仅作用于 shell/browser 类操作

### 根因（源码级 1.1.1）
1. `planHcloudCommand`（hcloud-cli.mjs:158）**plan 阶段无条件签发 approvalToken**（5min TTL 内存 Map），与用户是否批准无关
2. `runApprovedCommand`（tools.mjs:1513）仅校验 `approvedByUser !== true` 抛错 + token 有效 + args 精确比对——**approvedByUser 是模型（agent）自填布尔参数**，MCP server（mcp-server.mjs:192-203）纯中继，无任何外部"用户已确认"信号
3. WorkBuddy 连接器**未对 MCP 写工具套用审批策略**（shell 有、MCP 无）

### 影响
会话级写操作安全完全依赖"模型自律 + 客户端连接器策略"双保险，WorkBuddy 侧第二道缺失 → **任何能操纵该 agent 会话的输入（提示注入/恶意 skill 引导）可直接创建/修改/删除云资源**，无审计记录（mcp-approvals 无痕）。

### 对照（客户端门禁差异）
| 客户端 | MCP 写工具门禁 | 证据 |
|---|---|---|
| Hermes | ✅ wrapper deny 兜底 | P0-1 同链 |
| CodeArtsSpace | ✅ 每工具权限确认框 | 4 次审批框实锤 |
| DSH | ✅ approval=ask fails-closed | OBS-7 |
| OpenCode | ⚠️ bash-allow 直连 | OBS-1（同族） |
| **WorkBuddy** | ❌ **无门禁** | **本证据（OBS-9）** |

### 修复建议
1. **客户端侧（工作量大头）**：WorkBuddy/OfficeAce 连接器对 `huaweicloud_run_approved_command`（及全部 MCP 写工具）强制与 shell 同级的审批确认
2. **插件侧加固（可选）**：`runApprovedCommand` 增加会话绑定——token 派生加入 host 注入的会话标识（如 MCP initialize clientInfo 指纹），防跨会话/跨客户端复用；并在工具 description 强调"仅当用户在客户端界面明确批准后调用"

### 严重度建议
P1（会话级安全缺口，无审计写操作）；插件侧属"设计妥协需文档声明"，客户端侧属"连接器策略缺失"。