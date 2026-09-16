# FINDINGS — 缺陷发现清单（OfficeAce-glm-5.2）

> **落盘路径**：`results/OfficeAce/2026-09-16-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：`2026-09-16 09:53:56`（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P1】D9-1 未知 JSON-RPC 方法错误码漂移

- **现象**：向 MCP server 发送未知 method（如 `tools/unknown`）时，返回 `{"error":{"code":-32603,"message":"Internal Error"}}`
- **断言**：未知 method 必须返回 `error.code = -32601`（Method Not Found），符合 JSON-RPC 2.0 规范
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` dispatch/handleRequest 对未知 method 走通用 catch 路径，返回 -32603 而非 MCP 规范要求的 -32601
- **影响**：MCP 客户端无法区分"方法不存在"与"内部错误"，影响错误处理逻辑
- **证据**：`evidence/D9-1/evidence.md`
- **状态**：待提单

## #2【P1】D9-2 缺少 required 参数校验

- **现象**：调用 `tools/call` 时故意省略 inputSchema 中标注为 required 的参数，server 未返回参数校验错误，直接执行导致 undefined 异常
- **断言**：缺失必填参数时必须返回 `error.code = -32602`（Invalid Params），符合 JSON-RPC 2.0 规范
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` tools/call 入口未在调用前校验 inputSchema.required 字段
- **影响**：客户端传入不完整参数时得到误导性错误，无法快速定位参数缺失
- **证据**：`evidence/D9-2/evidence.md`
- **状态**：待提单

## #3【P1】EXP-E01 serviceCatalog 中文意图"查云主机"未命中 ECS 路由

- **现象**：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 返回 MISS，未路由到 ECS 查询工具
- **断言**：包含"云主机"关键词的中文意图应命中 ECS 服务路由
- **根因**：`serviceCatalog` 工具中文关键词覆盖不足，缺少"云主机"等常见中文服务别名
- **影响**：中文用户自然语言请求无法正确路由到 ECS 服务
- **证据**：`eval/results/eval-run-20260916011644.csv`（EXP-E01 行）
- **状态**：待提单

## #4【P1】EXP-E02 serviceCatalog "创建云服务器"未命中 ECS 路由

- **现象**：`serviceCatalog("创建一台 2C4G 的 Ubuntu 云服务器")` 返回 MISS
- **断言**：包含"创建"+"云服务器"关键词的中文意图应命中 ECS 创建路由
- **根因**：`serviceCatalog` 中文关键词覆盖不足
- **证据**：`eval/results/eval-run-20260916011644.csv`（EXP-E02 行）
- **状态**：待提单

## #5【P1】EXP-E03 serviceCatalog "部署静态网站"未命中 OBS 路由

- **现象**：`serviceCatalog("把本地 dist 目录部署成一个公网静态网站")` 返回 MISS
- **断言**：包含"部署静态网站"关键词的中文意图应命中 OBS 静态网站托管路由
- **根因**：`serviceCatalog` 中文关键词覆盖不足
- **证据**：`eval/results/eval-run-20260916011644.csv`（EXP-E03 行）
- **状态**：待提单

## #6【P1】EXP-E04 serviceCatalog "绑定弹性公网IP"未命中 EIP 路由

- **现象**：`serviceCatalog("给这台服务器绑定一个弹性公网IP")` 返回 MISS
- **断言**：包含"弹性公网IP"关键词的中文意图应命中 EIP 路由
- **根因**：`serviceCatalog` 中文关键词覆盖不足
- **证据**：`eval/results/eval-run-20260916011644.csv`（EXP-E04 行）
- **状态**：待提单

## #7【P1】EXP-E05 serviceCatalog "查MySQL状态"未命中 RDS 路由

- **现象**：`serviceCatalog("看一下我的云数据库MySQL实例的状态")` 返回 MISS
- **断言**：包含"云数据库MySQL"关键词的中文意图应命中 RDS 路由
- **根因**：`serviceCatalog` 中文关键词覆盖不足
- **证据**：`eval/results/eval-run-20260916011644.csv`（EXP-E05 行）
- **状态**：待提单

## #8【P1】EXP-E07 serviceCatalog "配置备份策略"未命中 CBR 路由

- **现象**：`serviceCatalog("给生产环境的服务器配置一个每日备份策略")` 返回 MISS
- **断言**：包含"备份策略"关键词的中文意图应命中 CBR 路由
- **根因**：`serviceCatalog` 中文关键词覆盖不足
- **证据**：`eval/results/eval-run-20260916011644.csv`（EXP-E07 行）
- **状态**：待提单

## #9【P1】EXP-E10 serviceCatalog "部署函数"未命中 FunctionGraph 路由

- **现象**：`serviceCatalog("部署一个函数处理图片自动压缩")` 返回 MISS
- **断言**：包含"部署函数"关键词的中文意图应命中 FunctionGraph 路由
- **根因**：`serviceCatalog` 中文关键词覆盖不足
- **证据**：`eval/results/eval-run-20260916011644.csv`（EXP-E10 行）
- **状态**：待提单

## #10【P1】EXP-E11 serviceCatalog "查费用"未命中 Billing 路由

- **现象**：`serviceCatalog("查一下我账号这个月的费用情况")` 返回 MISS
- **断言**：包含"费用"关键词的中文意图应命中 Billing 路由
- **根因**：`serviceCatalog` 中文关键词覆盖不足
- **证据**：`eval/results/eval-run-20260916011644.csv`（EXP-E11 行）
- **状态**：待提单

## #11【P1】EXP-E12 serviceCatalog "云监控告警"未命中 CES 路由

- **现象**：`serviceCatalog("把应用日志指标推送到云监控告警")` 返回 MISS
- **断言**：包含"云监控告警"关键词的中文意图应命中 CES 路由
- **根因**：`serviceCatalog` 中文关键词覆盖不足
- **证据**：`eval/results/eval-run-20260916011644.csv`（EXP-E12 行）
- **状态**：待提单

## #12【P1】EXP-E13 serviceCatalog "HTTPS证书"未命中 ELB/DEW 路由

- **现象**：`serviceCatalog("申请HTTPS证书并配置到我的域名")` 返回 MISS
- **断言**：包含"HTTPS证书"关键词的中文意图应命中 ELB 或 DEW 路由
- **根因**：`serviceCatalog` 中文关键词覆盖不足
- **证据**：`eval/results/eval-run-20260916011644.csv`（EXP-E13 行）
- **状态**：待提单

## #13【P1】EXP-E14 serviceCatalog "IAM审计"未命中 IAM 路由

- **现象**：`serviceCatalog("我账号下的用户都有哪些权限, 帮我审计一下")` 返回 MISS
- **断言**：包含"权限"+"审计"关键词的中文意图应命中 IAM 路由
- **根因**：`serviceCatalog` 中文关键词覆盖不足
- **证据**：`eval/results/eval-run-20260916011644.csv`（EXP-E14 行）
- **状态**：待提单

## #14【非产品缺陷】OfficeAce 非 Hook 客户端导致 D4 安全用例全量 BLOCKED

- **现象**：D4 系列 24 个安全用例全部 BLOCKED，原因均为"需 hook-capable 客户端"
- **说明**：OfficeAce 为非 Hook 客户端，D4 安全拦截用例设计上依赖 Hook 机制，非产品缺陷。建议在用例归属中标注"需 Hook 客户端"，避免非 Hook 客户端重复 BLOCKED
