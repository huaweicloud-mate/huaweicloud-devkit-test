## Codex-1.1.7-next.0 每日测试报告

> 生成时间：2026-09-23（北京时间）
> 执行归档：`results/Codex/2026-09-23-192.168.0.102/Windows/`
> 被测对象：`huaweicloud-devkit`，源码 commit `0790e92a`
> 结论：`PARTIAL`

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Codex |
| OS / 架构 | Windows |
| Node / npm / Python | Node v22.23.2 / npm 10.9.8 / Python 3.11.15 |
| 被测版本 | `1.1.7-next.0` |
| 工具全集 | 40 |
| 测试类型 | 源码级探针、MCP 协议、服务矩阵、路由评测 |
| daily 基础用例 | 设计级 100 / 展开级 39 |

执行前已运行 `python scripts/prepare_env.py --update`，测试仓库已更新，源码仓库已切换到 npm `next` 对应 commit，并安装对应包。证据由本机探针重新生成，未复用旧 `stdout.log`。

## 二、执行摘要

| 层级 | PASS | FAIL | BLOCKED | SPEC-MISMATCH | NOT_RUN | 合计 |
|---|---:|---:|---:|---:|---:|---:|
| 设计级 | 84 | 5 | 10 | 1 | 0 | 100 |
| 展开级 | 28 | 11 | 0 | 0 | 0 | 39 |

PASS 防伪门禁通过，覆盖率门禁通过：P0 无空状态，NOT_RUN 占比为 0%。结论为 PARTIAL，原因是存在 FAIL/SPEC-MISMATCH。

## 三、缺陷与规格偏差

详见同目录 `FINDINGS.md`。主要失败包括：

- `D2-4`、`D4-27`：双路径输出脱敏断言失败。
- `D4-16`：`sh -c` 包裹的敏感命令返回 `allow`。
- `D8-4`：安装包文档断言失败。
- `D9-2`：JSON-RPC 错误码契约失败。
- `D9-9`：`tools/call` 超时/取消语义与测试契约存在 SPEC-MISMATCH。
- `EXP-E01~E05`、`EXP-E07`、`EXP-E10~E14`：服务路由评测返回 `MISS`，期望 `HIT`。

## 四、BLOCKED 用例与原因

以下 10 条均为源码静态核对无法替代的环境或真实客户端场景，已按指南标记 BLOCKED，未虚报 PASS：`D1-66`、`D1-69`、`D1-70`、`D3-S4`、`D8-9`、`D8-10`、`D9-4`、`D9-5`、`D9-10`、`D9-11`。其中 `D3-S4` 需要真实 CLI，`D9-4/D9-5` 无静态核对依据，其余需要后续真实客户端/安装环境复测。

## 五、安全与资源

- 凭证泄漏：未发现。
- 写操作误判为 read-only：本轮探针未发现。
- 真云资源：本轮未创建资源，无残留。
- 证据目录仅包含探针与脱敏 JSON 日志。

## 六、遗留建议

1. 修复 `sh -c` 内层命令的风险分类与双路径脱敏覆盖。
2. 核对 npm 包文档清单及 JSON-RPC 错误码/取消语义契约。
3. 修复 `serviceCatalog` 路由 MISS 后重新执行 EXP-E01~E15。
4. 补齐真实 CLI、客户端安装和协议场景后复测 10 条 BLOCKED。
