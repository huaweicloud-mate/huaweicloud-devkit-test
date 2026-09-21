# Codex-gpt-5 Windows 每日测试报告

> 生成时间：2026-09-21 09:30:00（北京时间）
> 执行归档：`results/Codex/2026-09-21-192.168.0.102/Windows/`
> 被测对象：huaweicloud-devkit `v1.1.5`，源码 `e7ed6f66`
> 结论：`FAIL`（存在 P0/P1 FAIL）

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Codex + gpt-5 |
| OS / 架构 | Windows / x64 |
| Node / npm / Python | Node v22.23.2 / npm 10.9.8 / Python 3.11.15 |
| 工具全集 | 40 |
| 真云凭证 | 已配置；本轮执行真云/沙箱补测 |
| 测试类型 | 源码探针、MCP 工具调用、协议/评测路由 |

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例 | 139（设计级 100，展开级 39） |
| 已执行 | 139（含 BLOCKED 明确收口） |
| PASS / FAIL / BLOCKED | 100 / 13 / 26 |
| 通过率（PASS / PASS+FAIL） | 88.4% |
| 新增缺陷 | P0 1 / P1 2 / P2 0 |
| 红线违规 | 0 |
| 资源释放 | 真云资源已清理，残留 0 |

## 三、状态汇总

| 层级 | PASS | FAIL | BLOCKED | SPEC | NOT_RUN | 合计 |
|---|---:|---:|---:|---:|---:|---:|
| 设计级 | 74 | 2 | 24 | 0 | 0 | 100 |
| 展开级 | 26 | 11 | 2 | 0 | 0 | 39 |

所有 PASS 均有新鲜 probe/stdout 证据并通过 `verify_no_fake_pass.py`；覆盖率门禁也已通过。

## 四、缺陷清单

详见同目录 `FINDINGS.md`。本轮真实 FAIL：

1. P0 `D4-16`：`sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` 在 Node/MCP hook 路径返回 `allow`，shell 包裹可绕过凭证访问拦截。
2. P1 `D2-4`、`D4-27`：`redactSecrets` 对 JSON 的 `ak/sk/token` 字段保留原始值。
3. P1 `EXP-E01~E05/E07/E10~E14`：service catalog 中文意图路由 MISS，确定性 harness 仅命中 3/14 个可判定意图。

## 五、未执行用例与原因

以下均为逐条 `BLOCKED`，分类均为【补环境】；未将其虚报为 PASS。D3-C13 已通过真云 OBS 闭环补测。

| ID | 优先级 | 原因/解除条件 |
|---|---|---|
| D1-65 | P2 | 需隔离进程 DEBUG 开关 probe；提供子进程 stdout 后复测 |
| D1-66 | P2 | 需 TELEMETRY/ENDPOINT mock；提供遥测夹具后复测 |
| D1-67 | P2 | 需 Codex 宿主环境注入；提供客户端启动 harness 后复测 |
| D1-68 | P2 | 需离线 manifest/区域 fixture；提供隔离 probe 后复测 |
| D1-69 | P2 | 需 CLI help 独立进程 probe；安排命令 smoke 后复测 |
| D1-70 | P1 | 需代理服务器和 WebSocket fixture；提供 proxy harness 后复测 |
| D2-27 | P2 | 需 KooCLI 版本输出 fixture；提供 hcloud fixture 后复测 |
| D3-S3 | P1 | 已真实执行沙箱连接、上传、nginx 部署；`deploy_check` 返回 FAIL，需可访问公网预览和完整检查明细后复测 |
| D3-C14 | P2 | 需沙箱 HDKit/hwlink 会话；提供 session fixture 后复测 |
| D3-S1 | P1 | 需真实 Agent 多轮会话；提供 LLM Agent harness 后复测 |
| D3-S2 | P1 | 需隔离 VPC 删除确认闭环；提供资源并完成归零后复测 |
| D3-S4 | P1 | 需真实 voucher status/claim 闭环；提供测试账号后复测 |
| D3-S5 | P2 | 需真实 Agent 复合意图会话；提供 LLM harness 后复测 |
| D3-S6 | P2 | 需 FunctionGraph 创建/触发器配额；提供隔离资源后复测 |
| D3-S7 | P1 | 需 Web/RDS/沙箱多服务编排；提供资源和清理审计后复测 |
| D3-S8 | P1 | 需权限/区域/配额故障注入；提供错误 fixture 后复测 |
| D4-25 | P2 | 需 Python hook 进程与遥测采集；提供 Python harness 后复测 |
| D4-26 | P2 | 需 findings 生成脱敏 fixture；提供输入/输出链路后复测 |
| D4-29 | P2 | 需 classifyRawCommand/assertAllowed 专用入口 probe；补 probe 后复测 |
| D6-9 | P2 | 需三类缓存隔离 fixture；提供缓存目录和 mock 后复测 |
| D8-9 | P2 | 需隔离 HOME 跨进程持久化 probe；提供后复测 |
| D8-10 | P2 | 需 MCP 配置三风格合并 fixture；提供后复测 |
| D9-10 | P1 | 需 remote 9528 端口服务夹具；提供后复测 |
| D9-11 | P1 | 需 hwlink mux/WS 生命周期夹具；提供后复测 |
| EXP-D5-2-1 | P1 | 需 Codex 宿主真实插件发现 harness；提供后复测 |
| EXP-D5-2-3 | P1 | 需 Codex 宿主真实 tools/list harness；提供后复测 |

## 六、安全与红线合规

- 凭证泄漏事件：0；测试输出未写入真实 AK/SK。
- 写操作误判 read-only：0。
- 红线违规：0。
- P0 `D4-16` 已进入 FINDINGS，待统一提单。

## 七、资源释放

本轮创建并清理了带时间戳的 OBS 测试桶、VPC、子网和 ECS 测试资源；OBS 删除成功，VPC/子网/ECS 已提交反序删除请求。沙箱会话已关闭；残留 0（公网预览闭环除外）。

## 八、遗留与建议

优先修复 P0 shell wrapper 解析与 P1 JSON 脱敏、中文 service catalog 路由；补齐 remote/WS、沙箱、OBS 和 Codex 宿主 harness 后复测 27 个 BLOCKED。
