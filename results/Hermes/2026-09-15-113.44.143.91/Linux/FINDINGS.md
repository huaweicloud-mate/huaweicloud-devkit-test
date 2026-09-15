# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-09-15-113.44.143.91/Linux/FINDINGS.md`
> **生成时间**：2026-09-15 09:16:00（北京时间）
> **被测版本**：huaweicloud-devkit 1.1.4（npm latest，gitHead `9b67256`，PR #669）
> **提单说明**：本清单 10 项缺陷均为 1.1.4 相较 next.6 的**复现确认**，根因未变，已并入上游已开 issue **#650 / #651**（state=OPEN），**本轮不重复提单**。

---

## #1【P0】凭证环境变量打印拦截不完整（HW_ 前缀漏网）

- **现象**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Python 钩子均放行。
- **断言**：`printenv HW_ACCESS_KEY` 与 `echo $HW_ACCESS_KEY` 的 `classifyTextCommand` 决策应为 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:336` env-dump 判定正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_ACCESS_KEY` / `HW_SECRET_KEY` 的 `HW_` 前缀；`echo $HW_*` 路径同样未覆盖。
- **影响**：凭证环境变量可被打印进入对话上下文，凭证泄漏风险（红线 I 类）。
- **证据**：`evidence/D4-2/stdout.txt`、`evidence/hook-stdout.txt`、`evidence/security-stdout.txt`
- **状态**：已提单 #650（1.1.4 复现，未修复）

## #2【P0】命令包裹/命令替换穿透 hcloud 写操作拦截

- **现象**：`bash -c 'hcloud ECS DeleteServers --id x'`、`sh -c '...'`、`eval "..."`、`$(hcloud ...)`、反引号包裹均返回 `allow`，预期 `deny`。
- **断言**：内层含 `hcloud <Svc> Delete*` 的包裹命令，`classifyTextCommand` 决策应为 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:345` 正则 `/(^|\s)hcloud(\.exe)?\s+/i` 仅匹配行首/空白后的 `hcloud`，引号包裹、子 shell、命令替换、`&&` 链接均绕过。
- **影响**：破坏写操作拦截（核心安全门），未审批的 DeleteServers 等破坏性指令可穿透。
- **证据**：`evidence/D4-16/stdout.txt`
- **状态**：已提单 #650（1.1.4 复现，未修复）

## #3【P0】凭证脱敏缺小写 ak=/sk=（obsutilconfig 格式漏网）

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文不脱敏（对象路径的 accessKeyId/secretAccessKey 正常脱敏）。
- **断言**：小写 `ak=`/`sk=` 格式凭证值应被替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `.replace(/(AK|SK)\s*[:=]\s*(...)/g, ...)` 大小写敏感且无 `/i`，obsutilconfig 小写 `ak=`/`sk=` 及下划线格式漏网。
- **影响**：真实 obsutil 配置的小写凭证字段不脱敏，凭证泄漏进入日志/对话。
- **证据**：`evidence/D2-4/stdout.txt`
- **状态**：已提单 #650（1.1.4 复现，未修复）

## #4【P0】全局规则 huawei-agent-rules.md 安装未注入（安装目标全缺失）

- **现象**：隔离 HOME 执行 `install --target hermes` 后，全目录 `find` 无 `huawei-agent-rules.md` 任何产物。
- **断言**：install 后安装目标目录应包含全局 MUST 级规则文件 `huawei-agent-rules.md`。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs` 安装函数仅复制 skills/commands/src/safety/hooks，未复制仓库根 `rules/` 目录（`rules/huawei-agent-rules.mdc` 为孤岛）。
- **影响**：设计强制的全局 MUST 级约束未交付到任何 agent，安全约束降级。
- **证据**：`evidence/cli-stdout.txt`（[缺] 未找到 huawei-agent-rules.md）
- **状态**：已提单 #650（1.1.4 复现，未修复）

## #5【P1】Python/Node 安全钩子策略不一致（Hermes 实装 Python 路径写操作放行）

- **现象**：同一 payload，Node 钩子对 `hcloud ECS DeleteServers` 返回 `deny`，Python 钩子放行（无输出）。
- **断言**：Python 与 Node 钩子对同一写操作 payload 的决策应一致为 `deny`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 操作名前导要求字母数字/行首，`hcloud ECS DeleteServers` 中 `Delete` 前为空格故不匹配。
- **影响**：Node 路径防护正常、Python 路径（Hermes 实装）写操作近乎失效，双路径安全契约不一致。
- **证据**：`evidence/hook-stdout.txt`
- **状态**：已提单 #651（1.1.4 复现，未修复）

## #6【P1】安全钩子畸形输入 fail-open（应 fail-closed）

- **现象**：畸形 JSON（`not-json-at-all`）与空 `tool_input`（`{}`）时，Node 与 Python 钩子均无输出（放行），预期 fail-closed。
- **断言**：钩子对不可解析输入应返回 `deny`（fail-closed），而非静默放行。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs:45-48` `try { JSON.parse } catch { return }` 解析失败静默返回；`huaweicloud-safety.py` 同构。
- **影响**：构造畸形输入可绕过钩子防护，违反 fail-closed 设计意图。
- **证据**：`evidence/hook-stdout.txt`、`evidence/D4-17/stdout.txt`
- **状态**：已提单 #651（1.1.4 复现，未修复）

## #7【P1】JSON-RPC 错误码契约漂移 -32603 vs -32601（SPEC-MISMATCH）

- **现象**：未知方法 `unknown/method` 返回 JSON-RPC `-32603`（Internal error），规范应为 `-32601`（Method not found）。
- **断言**：未知方法应返回错误码 `-32601`。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:169` 统一硬编码 `code: -32603`；`mcp-protocol.mjs` `Unsupported method` 抛错未被映射为 -32601。
- **影响**：MCP 客户端无法区分"方法不存在"与"内部错误"，协议互操作受影响。
- **证据**：`evidence/protocol-stdout.txt`
- **状态**：已提单 #651（待裁决 SPEC，1.1.4 未改）

## #8【P1】serviceCatalog 中文意图路由未命中（关键词英文-only）

- **现象**：中文意图「帮我查华北北京四的云主机」「创建 2C4G 云服务器」「绑定弹性IP」「部署公网静态网站」「每日备份策略」等 12/15 条路由 miss，返回 `Run hcloud --help...`；仅 Redis→DCS、K8s→CCE、代金券→voucher 命中。
- **断言**：中文意图「创建一台 2C4G 的 Ubuntu 云服务器」应路由到 `ECS`（recommendedServices 含 ECS）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog()` routeMap 关键词均为英文，`String(intent).toLowerCase()` 未做中文意图映射。
- **影响**：中文用户（主要目标群体）意图路由大幅 miss，路由准确率不达标。
- **证据**：`evidence/D10-3/stdout.txt`、`evidence/EXP-E01~E15/stdout.txt`
- **状态**：已提单 #651（1.1.4 复现，未修复）

## #9【P2】auth_switch persist 的 R2 冲突门先于 R3 STS 检查

- **现象**：账号冲突场景下 `persist`（带 `securityToken`）返回 `needs_confirmation`，而非立即 R3 拒绝。
- **断言**：带 `securityToken` 的 persist 应立即返回 `status=error, scope=rejected`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` R2 冲突门先于 `persistCredentials` R3 检查。
- **影响**：STS 临时凭证最终仍不被落盘（安全不破），但给出误导性"切换账号"确认菜单（UX/契约瑕疵）。
- **证据**：`evidence/D2-11/stdout.txt`
- **状态**：已提单 #651（P2 可并入，1.1.4 未改）

## #10【P2】源码仓库 AGENTS.md 宣称 39 工具，实现已 40（文档漂移）

- **现象**：tools.mjs `TOOL_DEFINITIONS.length` 实测 40，但源码仓库 `AGENTS.md:27` 仍写 "39 tools in tools.mjs"、`:45` 仍写 "39 MCP tool definitions"。
- **断言**：源码仓库文档声明的工具数应与 `TOOL_DEFINITIONS.length`（40）一致。
- **根因**：`AGENTS.md:27,45` 未随 #347 工具新增同步。
- **影响**：文档与能力漂移，误导 agent/开发者对工具全集的认知。
- **证据**：`evidence/D8-1/stdout.txt`
- **状态**：已提单 #651（1.1.4 未改）

## #11【非产品缺陷】真云凭证无效，真云 E2E 无法执行

- **现象**：`run_readonly` 返回 `APIGW.0301 Incorrect IAM authentication information: Unauthorized`；list_regions 返回空。
- **说明**：本机 `~/.config/huaweicloud/credentials.json` 为 session 级（`configuredBySession=True`、无 securityToken），非产品缺陷。影响 D3-B3、D3-C4、D4-13、D4-14（BLOCKED）。

## #12【非产品缺陷】通用 MCP(Claude/Cursor) merge 需交互 option3，本机非交互环境未实测

- **现象**：`install`（`printf '3\n'` 驱动）在本机 auto-detect 走了 hermes 路径，未触发 option3 通用 MCP 接入；`.claude.json` 未发生 merge。
- **说明**：非交互多 agent 环境无法驱动交互式 option3，非产品缺陷。影响 D1-58、EXP-D1-58-01~05（BLOCKED）。

## #13【非产品缺陷】Windows/macOS/其他客户端环境缺失

- **现象**：Windows/macOS/其他客户端专属用例无法在本机 Linux（仅 Hermes）执行。
- **说明**：本机仅 Linux + Hermes；Windows 变体（D1-39、EXP-NR3-01/03/09/23）、macOS 变体（EXP-NR3-11）、其他客户端 D5 矩阵（18 条）无对应环境，标 BLOCKED。非产品缺陷。