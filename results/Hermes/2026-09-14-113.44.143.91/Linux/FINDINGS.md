# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-09-14-113.44.143.91/Linux/FINDINGS.md`
> **生成时间**：2026-09-14 07:26:00（北京时间）
> **被测版本**：huaweicloud-devkit 1.1.4-next.3（gitHead `3b6290b`，PR #647）

---

## #1【P0】凭证环境变量打印拦截不完整（HW_ 前缀漏网）

- **现象**：`env | grep HW_ACCESS_KEY`、`env | grep HW_SECRET_KEY`、`printenv HW_ACCESS_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Python 钩子均放行。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335-336` env-dump 判定正则 `/(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)/i` 配合 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i`，未覆盖 `HW_ACCESS_KEY` / `HW_SECRET_KEY` 的 `HW_` 前缀。
- **影响**：凭证环境变量可被打印进入对话上下文，凭证泄漏风险（红线 I 类）。
- **证据**：`evidence/D4-2/stdout.txt`、`evidence/hook-stdout.txt`
- **状态**：待提单

## #2【P0】命令包裹/命令替换穿透 hcloud 写操作拦截

- **现象**：`bash -c 'hcloud ECS DeleteServers --id x'`、`sh -c 'hcloud ecs DeleteServers'`、`echo ok && hcloud ECS DeleteServers`、`$(hcloud ECS DeleteServers)`、反引号包裹均返回 `allow`，预期 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:345` 正则 `/(^|\s)hcloud(\.exe)?\s+/i` 仅匹配行首/空白后的 `hcloud`，引号包裹、子 shell、命令替换、`&&` 均绕过。
- **影响**：破坏写操作拦截（核心安全门），未审批的 DeleteServers 等破坏性指令可穿透。
- **证据**：`evidence/D4-16/stdout.txt`
- **状态**：待提单

## #3【P0】全局规则 huawei-agent-rules.mdc 安装未注入（11 安装目标全部缺失）

- **现象**：隔离 HOME 执行 `install --target hermes` 后，全目录 `find` 无 `huawei-agent-rules.md`/`*agent-rules*` 任何产物；全源码 `grep` 该文件名零引用。
- **根因**：`rules/huawei-agent-rules.mdc`（仓库根，MUST 级约束）存在但为孤岛；`plugins/huaweicloud-core/src/setup-cli.mjs` 安装函数仅复制 skills/commands/src/safety/hooks，未复制 `rules/` 目录。
- **影响**：设计强制的全局 MUST 级约束未交付到任何 agent，安全约束降级。
- **证据**：`evidence/cli-stdout.txt`（D4-23 段：`[缺] 未找到 huawei-agent-rules.md`）
- **状态**：待提单

## #4【P0】凭证脱敏缺小写 ak=/sk=（obsutilconfig 格式漏网）

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文不脱敏（对象路径脱敏正常）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `.replace(/(AK|SK)\s*[:=]\s*(...)/g, ...)` 大小写敏感且无 `/i`，obsutilconfig 小写 `ak=`/`sk=` 格式漏网；`access_key/secret_key` 等小写加下划线格式也受影响。
- **影响**：真实 obsutil 配置格式的小写凭证字段不脱敏，凭证泄漏进入日志/对话。
- **证据**：`evidence/D2-4/stdout.txt`
- **状态**：待提单

## #5【P1】Python/Node 安全钩子策略不一致（Hermes 实际路径写操作放行）

- **现象**：同一 payload 下，Node 钩子对 `hcloud configure show` 与 `hcloud ECS DeleteServers` 返回 `deny`，Python 钩子均放行（无输出）。Hermes 插件实际接线为 Python 钩子（`hooks.pre_tool_call → python3 huaweicloud-safety.py`）。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE = (^|[A-Za-z0-9])(Create|Delete|...)` 操作名边界要求前导为字母数字或行首，`hcloud ECS DeleteServers` 中 `Delete` 前为空格故不匹配；`:185` 判定依赖此正则，导致 Hermes 实际路径写操作防护失效。
- **影响**：Node 路径防护正常、Python 路径（Hermes 实装）写操作近乎失效，双路径安全契约不一致。
- **证据**：`evidence/hook-stdout.txt`
- **状态**：待提单

## #6【P1】JSON-RPC 错误码契约漂移 -32603 vs -32601（SPEC-MISMATCH）

- **现象**：未知方法 `unknown/method` 返回 JSON-RPC `-32603`（Internal error），规范应为 `-32601`（Method not found）。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:169` 统一硬编码 `code: -32603`；`mcp-server-remote.mjs:63` 同；`mcp-protocol.mjs:95` 抛 `Unsupported method`。
- **影响**：MCP 客户端无法区分"方法不存在"与"内部错误"，协议互操作受影响。
- **证据**：`evidence/protocol-stdout.txt`
- **状态**：待提单（待裁决 SPEC）

## #7【P1】serviceCatalog 中文意图路由未命中（关键词英文-only）

- **现象**：中文意图「帮我查一下我账号在华北北京四的云主机」「看一下我的云数据库MySQL」「创建一台 2C4G 的云服务器」「给这台服务器绑定弹性IP」「我的ECS启动失败」等 12/15 条评测路由片段 miss，返回 `Run hcloud --help to list available services.`；仅 Redis→DCS、K8s→CCE、代金券→voucher 命中。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1741-1802` `serviceCatalog()` routeMap 关键词均为英文（`ecs/server/vm/instance/...`），`String(intent).toLowerCase()` 未做中文意图映射。
- **影响**：中文用户（主要目标群体）意图路由大幅 miss，路由准确率不达标。
- **证据**：`evidence/D10-3/stdout.txt`、`evidence/EXP-E01~E15/stdout.txt`
- **状态**：待提单

## #8【P1】安全钩子畸形输入 fail-open（应 fail-closed）

- **现象**：畸形 JSON（`not-json-at-all`）与空 `tool_input`（`{}`）时，Node 与 Python 钩子均无输出（放行），预期 fail-closed（拒绝或明确决策）。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs:45-48` `try { JSON.parse } catch { return }` 解析失败静默返回（无 deny）；`huaweicloud-safety.py` 同构。
- **影响**：构造畸形输入可绕过钩子防护，违反 fail-closed 设计意图。
- **证据**：`evidence/hook-stdout.txt`、`evidence/D4-17/stdout.txt`
- **状态**：待提单

## #9【P2】auth_switch persist 的 R2 冲突门先于 R3 STS 检查

- **现象**：账号冲突场景下 `persist`（带 `securityToken`）返回 `needs_confirmation`，而非立即 `R3` 拒绝。R3 本身已正确实现（干净环境实测 `status=error, scope=rejected`），仅次序问题。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1176-1198` R2 冲突门先于 `persistCredentials` 的 R3 检查（`:984-989`）。
- **影响**：STS 临时凭证最终仍不被落盘（安全不破），但给出误导性的"切换账号"确认菜单（UX/契约瑕疵）。
- **证据**：`evidence/D2-11/stdout.txt`
- **状态**：待提单（P2 可并入合并单）

## #10【非产品缺陷】真云凭证无效，真云 E2E 无法执行

- **现象**：`run_readonly` 返回 `APIGW.0301 Incorrect IAM authentication information: Unauthorized`；list_regions/list_operations/search_marketplace 返回空。
- **说明**：本机 `~/.config/huaweicloud/credentials.json` 为 session 级（`configuredBySession=True`、`securityToken=''`），凭证无效/过期，非产品缺陷，不计入提单。
- **影响用例**：D3-B3、D3-C4、D4-13、D4-14（BLOCKED）。

## #11【非产品缺陷】install-hcloud 环境残留文件 Permission denied

- **现象**：下载 `huaweicloud-cli-linux-arm64.tar.gz` 到 `/tmp` 报 `Permission denied`。
- **说明**：`/tmp/huaweicloud-cli-linux-arm64.tar.gz` 为预置 root 文件，环境残留，非产品缺陷。
- **影响用例**：D1-6（BLOCKED）。

## #12【非产品缺陷】Windows/macOS 环境缺失

- **现象**：Windows/macOS 专属用例无法在本机 Linux 执行。
- **说明**：本机仅 Linux；Windows 变体（D1-39、EXP-NR3-09）与 macOS/ARM 变体（EXP-NR3-11）无对应环境。
- **影响用例**：D1-39、EXP-NR3-09、EXP-NR3-11（BLOCKED）。