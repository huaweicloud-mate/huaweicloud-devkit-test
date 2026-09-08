# ITER-002-2026-09-08 CodeArtsSpace 客户端会话级（win120，CDP 自动化）——G2 闭环终版

## 结论：**G1 全通 ✅ ｜ G2 工具链全通 ✅（数据受沙箱网络限制，环境项）｜ G3 审批框实锤 ✅**

> 更新于 2026-09-08 18:30（CDP 驱动 + 审批放行后 agent 完成全链路查询流程）。此前 PARTIAL 状态（缺 hcloud.exe 阻塞）已解决：**hcloud 稳定安装 `%USERPROFILE%\hcloud\` + 用户 PATH 追加**，agent 搜索到后转向 MCP 工具直调路径。
> 环境处置记录：hcloud.exe 原先仅存在于 `%TEMP%\hcloud\`（易清、路径怪），已复制到用户目录并追加用户 PATH（注册表 HKCU\Environment），120 沙箱 agent 搜索 `$env:USERPROFILE` 即命中。

## 会话完整实证（agent 最终自报，全程零写操作）

| 环节 | MCP 工具 | 结果 |
|---|---|---|
| 1 环境检查 | `huaweicloud_check_cli` | ✅ KooCLI 7.2.12 已安装、已认证 |
| 2 安全策略分类 | `huaweicloud_plan_cli_command` | ✅ `{"decision":"allow","risk":"read_only","safeToRun":true}`（NovaList 命中 readOperationPrefixes） |
| 3 只读查询 | `huaweicloud_run_readonly_command` | ✅ 正确走只读通道（未走 approved 写通道） |
| 4 补充尝试 | IAM KeystoneListRegions / KeystoneListProjectsForUser（只读） | 同样被沙箱网络拦截（合规只读） |

**G3 审批框（会话内权限确认）**：本轮共触发 4 次——`list_directory` / `write`（生成查询脚本）/ `edit`（修正语法）/ `deleteFile`（清理临时脚本）——均可"运行/跳过所有未运行工具"，自动化点击"运行"放行成功，**CodeArts Space 的审批门机制会话内实锤**（与 OpenCode bash-allow 不同的强门禁客户端）。

## 数据未返回的根因（环境项，非插件缺陷）

沙箱网络策略阻止所有华为云 API 出站（agent 遍历实证）：
```
100.125.12.98:443    metadata 服务（hcloud 自动获取 project_id）→ hit restricted
120.46.247.26/246.26:443  华为云公网 API endpoint → unreachable
100.125.236.3:443    内部服务地址 → restricted
报错: 获取项目ID失败 dial tcp ... connectex; [USE_ERROR]缺少必填参数:project_id; Sandbox Network Error
```
- KooCLI 配置 projectId 为空 + 沙箱禁出站 → 无法补全 project_id → 数据拿不到
- **工具链路本身正确**：plan 裁决 read_only → run_readonly 派发，行为完全符合预期
- 同机 SSH 直连 hcloud NovaListServers 可返回 `{"servers":[]}`（SSH 不受沙箱网络策略）→ 证明是沙箱隔离，非凭据/网络问题

## 附带信息

- CodeArtsSpace 会话模型为 GLM-5.2（客户端自带）；agent 推理链完整（先排查 hcloud → 读插件源码 mcp-server.mjs/tools.mjs → 自行构造 callTool 调用脚本 → 遇网络限制 → 自报结论）
- agent 发现 MCP 工具未直接暴露在会话工具清单，自行通过 Node 直调 callTool 完成（**集成差异观察：CodeArtsSpace 的 MCP 工具需源码级直调，会话内无原生工具菜单**）→ 归档为 OBS-8（观察，集成差异）
- 任务产物 __hw_ecs_query.mjs(1.3KB)/__hw_ecs_query2.mjs(2.1KB) 为 agent 生成的临时脚本（已发起 deleteFile 清理）

## 判定

- **G1 会话机制**：✅（输入/发送/agent 推理/沙箱工具/安全策略/源码阅读/工具构造——CodeArts Space 客户端全链路工作）
- **G2 只读调用**：✅ 工具链全通（plan→run_readonly 真实调用 + 正确裁决）；数据层受沙箱网络限制（环境项，非插件问题；网络可达环境即可返回数据）
- **G3 审批框**：✅ 4 次权限确认均可自动化批准/跳过

## 复现

- test-cases/cas-drive3.js（发送提示词+轮询）/ cas-approve.js（点击"运行"放行审批）/ cas-read-all.js（整页会话取证）——经 win120-cas-run3.py / cas-approve-run.py / cas-read-all-run.py 上传执行（120 本机 node22：`set PATH=%LOCALAPPDATA%\hermes\node;%PATH%`）
- 环境修复：win120-install-hcloud-fix.py（hcloud 稳定安装+用户 PATH 幂等追加）