# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-09-28-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-28 05:08:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】D4-2 凭证env打印拦截 — Windows %VAR% 语法与 echo $VAR 未覆盖

- **现象**：`classifyTextCommand("type %HUAWEICLOUD_SECRET_ACCESS_KEY%")` 返回 `decision=allow`（未拦截）；`classifyTextCommand("echo $AWS_SECRET_ACCESS_KEY")` 返回 `decision=allow`；`classifyTextCommand("env | grep -i secret")` 返回 `decision=allow`。而 `classifyTextCommand("printenv HW_ACCESS_KEY")` 正确返回 `decision=deny`。
- **断言**：`classifyTextCommand("type %HUAWEICLOUD_SECRET_ACCESS_KEY%")` 应返回 `decision=deny`（Windows `type` 命令读取华为云凭证 env 变量应被拦截）。
- **根因**：`safety-policy.mjs:419` — 凭证 env 打印规则的正则 `/(?:^|\s)printenv\s+(?:HUAWEICLOUD|HWC|HW|OS)_(?:ACCESS_KEY|SECRET_KEY|SECURITY_TOKEN)/i` 仅匹配 `printenv` 命令 + Unix 风格 + HW/HUAWEICLOUD 前缀。未覆盖：① Windows `type %VAR%` 语法；② `echo $VAR` 形式的凭证 env 打印；③ 通用 `env | grep` dump。
- **影响**：Windows 环境下通过 `type %HUAWEICLOUD_SECRET_ACCESS_KEY%` 可绕过安全策略读取凭证 env 变量值。
- **证据**：`evidence/D4-2/stdout.log`（5 条测试命令，3 条 allow）
- **状态**：待提单

## #2【P0】D4-16 命令包裹穿透 — sh -c/eval 包裹凭证 env 打印未检测

- **现象**：`classifyTextCommand("sh -c \"printenv HW_ACCESS_KEY\"")` 返回 `decision=allow`（未拦截）；`classifyTextCommand("eval \"printenv HUAWEICLOUD_SECRET_KEY\"")` 返回 `decision=allow`。而包裹的凭证文件读取 `sh -c "cat ~/.config/huaweicloud/credentials.json"` 正确返回 `decision=deny`。
- **断言**：`classifyTextCommand("sh -c \"printenv HW_ACCESS_KEY\"")` 应返回 `decision=deny`（包裹的凭证 env 打印应被检测并拦截）。
- **根因**：`safety-policy.mjs:70-71` + `safety-policy.mjs:170-181` — shell wrapper 解包逻辑（`stripExecutable`/`findHcloudCommandSegments`）仅对 hcloud 命令生效（`unwrappedIsHcloud` 检查），不对 `printenv`/`echo` 等非 hcloud 命令做二次解包。包裹的凭证文件读取能命中文件路径规则（独立于解包），但包裹的 env 打印依赖解包后才能匹配 env 规则，故漏检。
- **影响**：通过 `sh -c "printenv HW_ACCESS_KEY"` 或 `eval "printenv HUAWEICLOUD_SECRET_KEY"` 可绕过安全策略读取凭证 env 变量。
- **证据**：`evidence/D4-16/stdout.log`（5 条测试命令，2 条 allow）
- **状态**：待提单

## #3【P1】EXP-E01~E14 serviceCatalog 中文意图路由准确率低（21.4% HIT，11/15 MISS + 1 N/A）

- **现象**：`node eval/harness/run-eval.mjs` 跑 15 条中文自然语言意图调 `serviceCatalog(intent)`，11 条 MISS + 1 条 N/A，未命中的意图返回 fallback "Run hcloud --help to list available services." 而非正确服务路由。仅 E06(DCS)、E09(CCE)、E15(Voucher) 3 条命中。
- **断言**：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 应返回 ECS 服务路由（命中 routeMap 中 ECS 条目），实际返回 "Run hcloud --help to list available services."（未命中）。同理 E02(ECS创建)、E03(OBS静态站→误路由 Sandbox+DevStation)、E04(EIP)、E05(RDS)、E07(CBR)、E08(explain_error诊断)、E10(FunctionGraph)、E11(BSS费用)、E12(CES监控)、E13(ELB证书)、E14(IAM审计) 均未命中。
- **根因**：`tools.mjs:1947` — `serviceCatalog` 函数（`tools.mjs:1815`）的 `routeMap`（`tools.mjs:1817`）未覆盖评测集中 11/15 条中文自然语言意图的模式匹配，导致未命中意图走到 fallback 分支（`tools.mjs:1947` 返回 "Run hcloud --help to list available services."）。
- **影响**：中文用户使用自然语言意图（如"查一下我的云主机"、"创建一台 Ubuntu 云服务器"）时无法被正确路由到对应华为云服务，需改用英文服务名或 hcloud CLI 命令。影响 D10-3 路由准确率基线（当前 21.4% HIT）。
- **证据**：
  - `evidence/EXP-E01/stdout.log`（harness verdict=MISS, expected=ECS, actual="Run hcloud --help..."）
  - `evidence/EXP-E02/stdout.log`（harness verdict=MISS, expected=ECS）
  - `evidence/EXP-E03/stdout.log`（harness verdict=MISS, expected=OBS, actual="Sandbox+DevStation"）
  - `evidence/EXP-E04/stdout.log`（harness verdict=MISS, expected=EIP）
  - `evidence/EXP-E05/stdout.log`（harness verdict=MISS, expected=RDS）
  - `evidence/EXP-E07/stdout.log`（harness verdict=MISS, expected=CBR）
  - `evidence/EXP-E08/stdout.log`（harness verdict=N/A, expected=explain_error）
  - `evidence/EXP-E10/stdout.log`（harness verdict=MISS, expected=FunctionGraph）
  - `evidence/EXP-E11/stdout.log`（harness verdict=MISS, expected=BSS）
  - `evidence/EXP-E12/stdout.log`（harness verdict=MISS, expected=CES）
  - `evidence/EXP-E13/stdout.log`（harness verdict=MISS, expected=ELB）
  - `evidence/EXP-E14/stdout.log`（harness verdict=MISS, expected=IAM）
  - `eval/results/eval-run-20260927210420.csv`（harness 完整结果）
- **状态**：已知基线（21.4% HIT），每日测试追踪路由准确率变化。此为 pre-existing 问题，非新增回归。

## #4【测试侧】EXP-C4-03 OBS 服务矩阵 — hcloud OBS 不可用（OBS 用 obsutil）

- **现象**：`hcloud OBS --help` 返回 "Command failed"，OBS 服务使用 obsutil 而非 hcloud CLI。service-matrix-probe.mjs 的 OBS 测试用例期望 hcloud CLI 可用性。
- **说明**：OBS 服务在 KooCLI 中通过 obsutil 管理，不暴露 `hcloud OBS` 子命令。这是测试侧用例设计问题（应改用 obsutil 或 plan_cli_command 测试 OBS 路由），非产品缺陷。routing 检查在 plan 层面 OK。
- **证据**：`evidence/EXP-C4-03/stdout.log`
