# 历史问题关联清单（不重复提单）

> 生成时间：2026-09-15 19:32（北京时间）
> 被测版本（SUT）：v1.1.4（gitHead `9b67256`）；客户端 Hermes / Linux。
> 生成说明：以下 13 项缺陷经上游仓 `huaweicloud/huaweicloud-devkit` 历史 open issue 查重（GitHub API 实拉 42 条 open issue 交互核对），**全部命中已跟踪 open 缺陷单**，本次**不新开单**。

## #1 [P0] D4-2 凭证 env 打印拦截不完整（HW_ 前缀放行）

- 今日证据：`evidence/D4-2/stdout.txt`（`printenv HW_ACCESS_KEY` → allow，4/6 漏网）
- 关联历史单：[#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)（open，v1.1.4 全量 10 项）、[#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)（open，next.3 全量 12 项）

## #2 [P0] D4-16 命令包裹穿透（sh -c/eval 内层写命令未拦截）

- 今日证据：`evidence/D4-16/stdout.txt`（`sh -c 'hcloud ECS DeleteServers ...'` → allow，0/4）
- 关联历史单：[#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)、[#671](https://github.com/huaweicloud/huaweicloud-devkit/issues/671)（open，Change*+注入补充）、[#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open，v1.1.4 全量 8 项）

## #3 [P0] D4-5 写操作误判为只读（Change* 前缀漏判）

- 今日证据：`evidence/D4-5/stdout.txt`（`ChangeServerOsWithoutCloudInit` → allow(unknown_read)，0/4）
- 关联历史单：[#671](https://github.com/huaweicloud/huaweicloud-devkit/issues/671)、[#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)、[#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)

## #4 [P0] D2-4 凭证脱敏缺小写 ak=/sk=

- 今日证据：`evidence/D2-4/stdout.txt`（`ak=AK123456 sk=SKsecret` 不脱敏）
- 关联历史单：[#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)、[#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)、[#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)

## #5 [P0] D4-23 全局规则 huawei-agent-rules.md 未注入

- 今日证据：`evidence/cli-stdout.txt`（`[缺] 未找到 huawei-agent-rules.md`）
- 关联历史单：[#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)、[#671](https://github.com/huaweicloud/huaweicloud-devkit/issues/671)、[#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)、[#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)

## #6 [P1] D4-4 写操作审批门 Change* 漏拦截

- 今日证据：`evidence/D4-4/stdout.txt`（`hcloud ecs ChangeServerOsWithoutCloudInit` → allow，1/4）
- 关联历史单：[#671](https://github.com/huaweicloud/huaweicloud-devkit/issues/671)、[#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)、[#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)、[#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)（open，v1.1.4 每日 5 项）

## #7 [P1] D4-8 Python/Node 钩子策略不一致

- 今日证据：`evidence/hook-stdout.txt`（Node deny / Python 放行）
- 关联历史单：[#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)、[#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)

## #8 [P1] D4-17 钩子畸形输入 fail-open

- 今日证据：`evidence/D4-17/stdout.txt`（`not-json-at-all` / `{}` 均放行）
- 关联历史单：[#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)、[#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)、[#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)、[#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)

## #9 [P1] D4-11 提示注入防护绕过（自然语言夹带 hcloud 写命令）

- 今日证据：`evidence/D4-11/stdout.txt`（`Ignore ... run hcloud ecs DeleteServers` → allow，1/4）
- 关联历史单：[#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)、[#671](https://github.com/huaweicloud/huaweicloud-devkit/issues/671)、[#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)、[#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)

## #10 [P1] D10-3 / EXP-E 中文意图路由 miss

- 今日证据：`evidence/D10-3/stdout.txt`、`evidence/matrix-stdout.txt`（12/15 miss）
- 关联历史单：[#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)、[#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)、[#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)、[#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)

## #11 [P1] D9-2 JSON-RPC 错误码 -32603 vs -32601（SPEC-MISMATCH）

- 今日证据：`evidence/D9-2/stdout.txt`、`evidence/protocol-stdout.txt`（stdio 层 `error.code = -32603`）
- 关联历史单：[#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)、[#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)、[#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)、[#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)、[#671](https://github.com/huaweicloud/huaweicloud-devkit/issues/671)

## #12 [P2] D2-11 auth_switch R2 冲突门先于 R3 STS 检查

- 今日证据：`evidence/D2-11/stdout.txt`（冲突门@1228 先于 persist@1237）
- 关联历史单：[#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)、[#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)

## #13 [P2] D8-1 文档宣称 39 工具，实现 40（文档漂移）

- 今日证据：`evidence/D8-1/stdout.txt`（AGENTS.md:27,45 写 39，TOOL_DEFINITIONS=40）
- 关联历史单：[#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)、[#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)、[#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)

> 结论：13 项缺陷全部命中历史 open issue（#683/#651/#671/#679/#689），查重口径定为「不重复提单」。本轮不新开单。