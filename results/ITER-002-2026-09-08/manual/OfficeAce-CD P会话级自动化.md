# ITER-002-2026-09-08 OfficeAce 客户端会话级——G5 多轮 + OBS-11 写操作无审批执行（本机 CDP 实测）

## 结论：**G1 ❌（连接器已断开，本机无插件目录）｜ G2 ⚠️（agent 回退 CLI 真实执行了 OBS 写操作）｜ G3 ❌ 无审批框 ｜ G5 ⚠️ 多轮排队机制（任务队列）｜ OBS-11 第三例无门禁写操作（P1，独立 issue）**

> 2026-09-08 23:40 本机实测（OfficeAce 5.5.x，CDP 9224）。注意：**本机 OfficeAce 的 huaweicloud-devkit 插件已于 09/02 卸载**（历史会话留痕：mcp_connectors 1 行/注册工具 30 行/线程绑定 1 行被删），`.office-claw\huaweicloud-plugins` 目录不存在；连接器面板显示"huaweicloud-devkit 已断开"。

## 前置环境（实测事实）

- 本机 `%LOCALAPPDATA%\Programs\OfficeAce\OfficeAce.exe` 存在，CDP 9224 可开
- `.office-claw\` 顶层**无 huaweicloud-plugins**（09/02 卸载后目录未复原）；`mcp-connectors.sqlite` 不在 `%APPDATA%\OfficeAce\data\`（预期位置未找到）
- 历史会话明确留痕：09/02 安装（9 pass）→ 连接失败（connection_failed/连接清理失败）→ 卸载（3 表清理）→ 本机处于"连接器已断开"态
- **但 hcloud CLI（7.2.12）+ 凭据 + 29 skills 可用**（hist 显示曾安装，KooCLI 独立于插件）

## G5 多轮（任务队列机制，⏳ PARTIAL）

- 发送 Q1（自我介绍）→ agent 进入"任务执行中（已调用 N 个工具）"状态，**无最终回复输出**（一直在工具调用循环：搜索工具→加载 skill→配置 OBS 凭证→创建 OBS 桶→验证）
- 发送 Q2（追问）→ 显示"**待执行任务(1)**"——OfficeAce 采用**任务队列**模型，Q2 排队等 Q1 完成；**上下文延续性未能在本轮验证**（Q1 未结束）
- 结论：G5 机制存在（队列+多工具链）但会话完成前无法确认跨轮引用——**PARTIAL，待正常会话复核**

## ⚠️ OBS-11 安全观察（P1，无审批即执行）

### 现象（真云实测，桶已用后立删）
Q1 提示词含"用 huaweicloud_devkit 创建一个 OBS 桶 test-g3-oa-20260908（cn-north-4）"：
- agent 自述"huaweicloud_devkit 工具不存在，将使用 huawei-obs 技能" → **回退链**：设置 OBS 凭证配置 → 创建 OBS 桶 → 验证桶创建结果
- **云上 OBS 桶真实创建成功**（`obs://test-g3-oa-20260908`，cn-north-4，OBJECT；`hcloud OBS ls` 实证 Bucket number: 1）
- **全程无审批框、无确认弹窗**（CDP 轮询 20 轮零审批按钮；与 WorkBuddy shell 审批对照，OfficeAce 连 shell 类都无审批表现）
- ✅ 已清理：`hcloud OBS rm obs://test-g3-oa-20260908 -f` → "Delete bucket successfully" → `hcloud OBS ls` 复核 **Bucket number: 0**

### 定级
**P1（同 OBS-9/OBS-10 缺陷族第三例，客户端无写操作门禁）**。本次特殊性：**客户端连 MCP 插件都没有（连接器断开），agent 用技能+本地 CLI 回退链直接执行**——比 WorkBuddy/DSH 更彻底的"无 MCP 门禁"形态：任何能触发回退链的提示词都可直接写云资源，无任何审批/审计界面。

### 修复建议（客户端侧）
1. OfficeAce 连接器对**技能回退链中的写命令**同样应套用审批（当前连接器断开时 agent 的 CLI 操作完全裸奔）
2. 连接器断开状态应有更强的提示/限制（当前 agent 仍能通过本地 CLI 真实操作华为云）

## 判定表

| 项 | 结果 | 证据 |
|---|---|---|
| G1 工具可见 | ❌ 连接器已断开（插件 09/02 卸载残留） | 连接器面板"已断开"、无插件目录 |
| G2 只读调用 | ⚠️ 未单独测（Q1 直接触发写路径） | agent 调用 8-11 个工具（CLI 回退链） |
| G3 审批框 | ❌ **无审批框**（写操作直接执行） | OBS-11 实证 |
| G5 多轮 | ⚠️ PARTIAL（任务队列，Q2 排队） | "待执行任务(1)" |

## 连接失败根因诊断（2026-09-08 23:55，CLOSE_TIMEOUT 定位）

### 结论：不是插件缺陷——OfficeAce 连接器框架的 probe 清理协议与 MCP server 长驻进程不兼容

**决定性日志**（`data/logs/api/api.2026-09-08.1.log`，三次一致：12:26/12:46/15:42）：
```json
{"connectorId":"81f02f61...","operation":"probe","result":"failure","durationMs":1955,
 "errorCode":"CLOSE_TIMEOUT","toolCount":37,
 "probeTool":"huaweicloud_list_regions","probeOutcome":"ok","statusMessage":"连接清理失败"}
```

**证据链**：
1. **server 功能完全正常**：手动 spawn（系统 node v22.23.2 与 OfficeAce 内置 node v24.14.1 均验证）→ initialize 响应 `serverInfo: huaweicloud-devkit 1.1.1-next.15`；probe 工具 `huaweicloud_list_regions` 调用 ok；**37 个工具全部注册成功**（`mcp_connector_tools` 表虽 0 条——那是连接失败后才清理，probe 时 toolCount=37）
2. **失败点**：OfficeAce stdio 连接器在 probe 完成后要求子进程**关闭 stdin/stdout 以确认生命周期收敛**，等待 ~2s 超时（`CLOSE_TIMEOUT`）
3. **机制**：mcp-server.mjs 的 stdin-close 分支——`harness === 'hermes' && win32` 时 keepalive 保活；对 OfficeAce（其他 harness）设计为 `stdin close → exit(0)`。**但 OfficeAce 保持 stdin 管道打开不关闭** → server 不退出 → 框架 CLOSE 超时 → 标记 `connection_failed/连接清理失败` + enabled 归 0
4. **后果链**：状态 failed → 会话 MCP 注入跳过（`[MCP-INJECT] skipped`）→ 工具不可见 → agent 走技能+CLI 回退链（OBS-11 实测即此）

**排除项**：node 版本（v22/v24 均可加载）、插件依赖（node_modules 仅 undici=deps 声明，完整）、mcp-server.mjs 路径（存在）、HCLOUD_BIN（存在）、凭据（hcloud 可用）

**修复方向（OfficeAce 侧 or 插件适配）**：
1. OfficeAce 连接器框架：probe 后清理不强制要求子进程退出（长驻 MCP server 是合法形态），或提供"探活成功即认为连接可用"的判定
2. 插件侧（可选）：对 OfficeAce 的 harness 检测增加"收到 probe 后保持存活且不因 stdin 保持而挂起"的兼容；或与 OfficeAce 约定 stdio 生命周期（如 probe 后由 host 主动 kill）

### 诊断路径记录（可复用）
- 连接器 DB：`%LOCALAPPDATA%\Programs\OfficeAce\data\mcp-connectors.sqlite`（只读模式查；`enabled/status/status_message/last_checked_at`）
- 实时日志：`data\logs\api\api.YYYY-MM-DD.1.log`（搜 `connectorId.*probe` 拿 CLOSE_TIMEOUT/probeOutcome/toolCount）
- 手动探活：node 跑 `mcp-server.mjs` + stdio initialize（thread+readline 方式，勿用阻塞 read/select-on-pipe——Windows 坑）
- 注意：OfficeAce 数据在**安装目录内** `.office-claw`（非用户 `~\.office-claw`）；`.mcp.json` 仅内置连接器

- test-cases/oa-g35.py / oa-g35b.py / oa-g5-final.py（新建会话→选文件夹→发送→轮询）
- 启动：本机 `OfficeAce.exe --remote-debugging-port=9224 --remote-allow-origins=*`（先 taskkill 全进程含 ServiceHost）
- 清理：`hcloud OBS rm obs://<桶> -f` + `hcloud OBS ls` 复核归零