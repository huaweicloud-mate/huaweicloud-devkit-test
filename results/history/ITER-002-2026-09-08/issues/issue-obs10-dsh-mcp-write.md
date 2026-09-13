## 现象（真云实测，资源已用后立删）

DeepSeek Harness（DSH 0.1.1-rc.2）headless 单任务会话发送「用 huaweicloud_devkit 创建一个 VPC test-g3-dsh-20260908，CIDR 192.168.0.0/16，请直接执行」：
- **headless 无 UI 确认通道**（单任务模式），未配置 answerer
- **云上 VPC 真实创建成功**（ID af054a4b-8ff5-485b-8ac1-e78243e5307f，ACTIVE；已 DeleteVpc 复核归零）
- agent 走链：加载 huawei-vpc skill → 查存量无冲突 → `hcloud VPC CreateVpc` → 复查 ACTIVE

## 根因（配置级）

- DSH 组合配置（dump-config）：`approval policy: ask`（默认 workspace-write 权限模式），会话 CONTEXT 声明 "without an available answerer, the request fails closed"
- **但 MCP 客户端（`dsh-mcp-client` → node `huaweicloud-plugins/src/mcp-server.mjs` 子进程）的工具调用不受 DSH approval 服务管辖**——fails-closed 只作用于 DSH 原生工具（bash/pwsh/fs-sandbox）；MCP 写工具（`huaweicloud_run_approved_command`）由插件侧 `approvedByUser` 模型自填参数放行（与 huaweicloud-devkit OBS-9 同根因）
- headless 与 web 共用同一 `cordis.patch.yml` MCP 配置 → web 会话推断同样受影响

## 与 OBS-9（WorkBuddy 案例）的关系

同一缺陷族（MCP 写工具无外部确认通道），但客户端侧根因不同：
- WorkBuddy：连接器本身未对 MCP 写工具设门禁（无审批设计）
- **DSH：有 approval=ask 设计，但 approval 服务未挂接 MCP 子进程通道**（fails-closed 覆盖不到）

## 修复建议

1. **DSH 侧**：MCP 工具调用接入 approval 服务——写工具走 ask→answerer 确认通道；无 answerer 时 fails closed 应有真实拦截（当前未生效）
2. **插件侧（可选加固，同 OBS-9）**：`runApprovedCommand` token 派生加入 host 会话标识绑定，防跨会话/跨客户端复用；`approvedByUser` 建议由宿主确认信号注入而非模型自填

## 严重度建议

P1（会话级安全缺口，无审计写操作在无 UI 通道模式下可执行）；DSH 侧属"审批服务未覆盖 MCP 通道"的集成缺口。