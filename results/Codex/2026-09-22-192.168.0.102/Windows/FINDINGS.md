# FINDINGS — Codex-Windows

生成时间：2026-09-22（北京时间）
被测版本：huaweicloud-devkit@1.1.6-next.1，源码 `10e5243`

## #1【P0】D4-16 命令包裹穿透

- **描述（现象）**：`sh -c` 包裹的 hcloud 写命令经 MCP `hook_check_command` 返回 `allow`。
- **断言**：包含 Huawei Cloud 写操作的 `sh -c` 包裹命令必须返回 `deny` 或 `confirm`，不得返回 `allow`。
- **根因（文件:行号）**：`plugins/huaweicloud-core/src/safety-policy.mjs:384-429`；文本入口对 wrapper 解包路径覆盖不完整。
- **证据**：`evidence/D4-16/stdout.log`、`evidence/d4-security/stdout.log`、`evidence/mcp-tools/stdout.log`。

## #2【P0】D2-4/D4-27 字符串化 JSON 凭证未脱敏

- **描述（现象）**：`redactSecrets()` 对字符串化 JSON `{"ak":"...","sk":"..."}` 返回原始凭证值。
- **断言**：任意输出脱敏路径不得保留字符串化 JSON 中的 `ak`、`sk` 或 `token` 原值。
- **根因（文件:行号）**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-62`；字符串正则未覆盖引号键 JSON 形式，字符串路径未先解析或匹配 JSON 键。
- **证据**：`evidence/D2-4/stdout.log`、`evidence/D4-27/stdout.log`、`evidence/d2-auth/stdout.log`。

## #3【P1】Codex 插件发现清单不完整

- **描述（现象）**：`EXP-D5-2-1` fixture 实测 2/5 PASS；manifest 文件、MCP server 注册和 Codex bundle manifest 断言失败。
- **断言**：Codex 宿主存在时必须能发现插件 manifest、注册 `huaweicloud-devkit` MCP server，并识别 bundle 格式。
- **根因（文件:行号）**：Codex 专属 fixture 在当前 `CODEX_HOME/config.toml`/插件目录中未发现预期 manifest 与注册项；待定位安装/注册流程。
- **证据**：`evidence/EXP-D5-2-1/stdout.log` 及 `eval/harness/fixtures/exp-d5-2-1-codex-discovery.mjs` 实测输出。

## #4【P1】D10-3 服务路由命中率不足

- **描述（现象）**：确定性评测 `EXP-E01~E05/E07/E10~E14` 共 11 条 MISS；仅 E06/E09/E15 HIT，E08 为 N/A。
- **断言**：除 N/A 外的评测意图必须命中预期服务路由。
- **根因（文件:行号）**：`plugins/huaweicloud-core/src/tools.mjs:1815-1905`；固定关键词路由未覆盖评测集同义表达。
- **证据**：`evidence/EXP-E01/stdout.log` 至 `evidence/EXP-E15/stdout.log`、`eval/results/eval-run-20260922072545.csv`。

## #5【P1】D9-2b MCP 无效参数错误契约

- **描述（现象）**：协议探针对 invalid params 未返回 JSON-RPC `-32602` error 对象。
- **断言**：无效参数请求必须返回 `-32602`。
- **根因（文件:行号）**：协议处理路径需进一步定位；探针已复现。
- **证据**：`eval/results/protocol-probe-20260922072556.json`。
