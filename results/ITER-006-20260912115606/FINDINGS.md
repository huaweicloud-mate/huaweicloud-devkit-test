# ITER-006 缺陷记录（已统一提单）

> 测试对象：huaweicloud-devkit `v1.1.4-next.2` @ commit `8bcae14`

## 提单映射（huaweicloud/huaweicloud-devkit）

| 本地编号 | issue | 标题 |
|---|---|---|
| #1 | #637 | mcp-server 畸形 JSON 进程崩溃 |
| #2 | #638 | 未知方法/非法请求一律 -32603 |
| #3 | #639 | 审批令牌 TTL=5min 非幂等/不可注入（vs 设计 60s）|
| #5 | #640 | SERVICE_EXAMPLES 缺 EIP 示例 |
| #6 | #641 | check_update/upgrade Windows spawn npm.cmd EINVAL |
| #7 | #642 | OBS mb 示例缺 -location |

> #4（D3-C9 错误码断言 APIGW.0101 vs 实际 Ecs.0114/EVS.5404）为测试矩阵断言错误，非产品缺陷，留待设计阶段修正设计级 CSV，不提单。

## #1【P1】mcp-server.mjs 收到畸形 JSON 后进程崩溃（未返回 -32700）

- **现象**：向 stdio 发送畸形 JSON（`{ not valid json !!`）后，服务进程直接退出 exitCode=1，未返回 JSON-RPC `-32700 Parse error`。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` `parseContentLengthFrame()` 中 `void handleMessage(JSON.parse(body))`（L152）无 try/catch；异常穿透 `socket.on('data')`（readFrames）导致进程崩溃。LF framing 路径 `void handleMessage(JSON.parse(line))`（L131）同病。
- **影响**：任意客户端发送损坏帧即可杀死 MCP 服务进程（健壮性/可用性/安全 DoS 风险）。
- **关联用例**：D9-2（JSON-RPC 错误码）、D9-5（stdio 传输健壮）。
- **证据**：`evidence/d9-d3-function/probe.stdout.log`。

## #2【P2】未知方法/非法请求/参数错误一律 -32603（未区分 JSON-RPC 错误码）

- **现象**：未知方法 `completely/unknown_method` → `-32603`（应为 `-32601`）；缺 `method` 请求 → `-32603`（应为 `-32600`）；`detect_framework` 缺必填 `projectPath` 参数 → `-32603 projectPath is required`（应为 `-32602 Invalid params`）。
- **根因**：`mcp-server.mjs` `handleMessage()`（L161-173）用单一 try/catch 包住 `dispatch()`，把一切 dispatch 抛错统一映射 `code: -32603`（L169），未按 JSON-RPC 2.0 区分 -32600/-32601/-32602。
- **影响**：客户端无法区分「方法不存在」与「内部错误」（设计用例 D9-2 明确要求）。
- **关联用例**：D9-2。
- **证据**：`evidence/d9-d3-function/probe.stdout.log`。

## #3【P2】审批令牌契约与实现不符（D4-24 SPEC-MISMATCH）

- **现象**（设计 D4-24 断言 vs 实现实测）：
  | 维度 | 设计 D4-24 断言 | v1.1.4-next.2 实现 |
  |---|---|---|
  | TTL | `60s`（注入 5s 加速） | `APPROVAL_TTL_MS = 5 * 60_000` = **5 min** |
  | 时钟 | 可注入时钟 | `Date.now()` 直接读取，**不可注入** |
  | 过期响应 | `{status:'rejected', code:'CONFIRM_TOKEN_EXPIRED'}` | 抛错 `Invalid or expired approval token` → MCP 层 `-32603` |
  | 重复确认 | `{status:'ok', outcome:'already_processed'}`（幂等） | `consumeApprovalToken` 首读即 `delete`（L93-94）→ 复用返回 null → 抛错（**非幂等**） |
- **根因**：`hcloud-cli.mjs` L14 `APPROVAL_TTL_MS = 5*60_000`；`consumeApprovalToken`（L84-95）消费即删，无 `already_processed` 语义；TTL 校验用 `Date.now()`，无时钟注入点。
- **影响**：D4-24 的「TTL=60s + 注入加速 + 结构化 code + 幂等重复」四断言全部无法在真机闭合；设计真源与实现漂移。
- **关联用例**：D4-24（D4 安全域审批流健壮性）。D3-B7 审批链本身（deny/approve/single-use/tamper）**实测 6/6 PASS**，仅 D4-24 的 TTL/响应/幂等契约不符。
- **证据**：`evidence/d3-b7-approval/probe.stdout.log` + 源码 `hcloud-cli.mjs` L14/L84-95。

## #4【P2】D3-C9 资源不存在错误码断言与实际不符（SPEC-MISMATCH）

- **现象**：D3-C9 断言「不存在 ID → `code=APIGW.0101`」，实测：
  - ECS `ShowServer`（不存在的 UUID）→ `Ecs.0114`（`Instance[...] could not be found`）；
  - EVS `ShowVolume`（不存在的 UUID）→ `EVS.5404`（`Volume [...] could not be found`）。
- **根因**：华为云接口返回**服务特定**错误码（ECS=Ecs.0114、EVS=EVS.5404），而非设计断言的通用网关码 `APIGW.0101`。设计 D3-C9（及 D3-C7 的「不存在→Ecs.0200」）与真实服务错误码漂移。
- **附加观察**：`run_readonly_command` 对 API 错误场景仍返回 `ok:true, exitCode:0`（hcloud 进程退出码 0，错误 JSON 埋在 `stdout` 且带诊断表），调用方若只看 `ok` 字段会误判成功。错误码本身可在 `stdout` 嵌套 JSON 中拿到。
- **关联用例**：D3-C9（D3-C7 的「不存在→Ecs.0200」同疑）。
- **证据**：`evidence/d3-c9-notfound/`（diag.mjs 输出 + resp-ECS.json / resp-EVS.json）。

## #5【P3】SERVICE_EXAMPLES 缺 EIP 缓存示例（能力发现小缺口，非路由缺陷）

- **现象**：`SERVICE_EXAMPLES`（tools.mjs L1660）仅含 ECS/VPC/FunctionGraph/APIG/OBS/RDS/CES/GaussDB/DDS/DCS 九个条目，**无 EIP**；`serviceCatalog`（L1748-1750）实际把 "eip" 正确路由到 `services:['VPC','EIP']`。
- **根因/结论**：路由本身无误；缺口在 `SERVICE_EXAMPLES` 无 EIP 条目，导致 `listOperations("EIP")` 返回通用"Use help text"提示而非缓存示例。经 `list_operations("EIP")` 实时查询可正确拿到 `CreatePublicip/DeletePublicip` 等操作（已验证）。属缓存示例覆盖不全的小缺口。
- **证据**：`evidence/d3-c7-eip/find-eip.mjs`（`hcloud EIP --help` 列出完整操作；测试初探误用 `VPC CreatePublicip` 是我方猜测错误，非产品缺陷）。

## #6【P1】check_update/upgrade 在 Windows 失效：spawn npm.cmd EINVAL（#554 仍存）

- **现象**：`huaweicloud_check_update` → `result:'check_failed'` + `latestStable:null/latestNext:null`；`huaweicloud_upgrade` → `success:false, error:'无法确认最新版本（registry 查询失败）'`。但同一主机 `npm view huaweicloud-devkit@next`（经 shell）正常返回 1.1.4-next.2。
- **根因**：`update-check.mjs` `queryDistTags`（L241）用 `spawn(NPM_BIN, ['view', ...])` 且 `NPM_BIN='npm.cmd'`（L12）。本机（Windows + Node v22.23.2）`spawn('npm.cmd', [...])` 直接抛 `spawn EINVAL (errno -4071)`，异常未捕获到时走 `resolve(null)` → `failedAt` → `check_failed`。**与已知 #554（D1-39 Windows npm.cmd/spawnSync EINVAL）同根因，v1.1.4-next.2 仍未修复**。对比：经 PowerShell/shell 调 `npm` 正常，Node 直接 spawn `.cmd` 失败。
- **影响**：Windows 环境下版本检测与自动升级链路整体不可用（check_update 永远 check_failed，upgrade 无法确认目标版本）；D1-52 真实升级在 Windows 侧被此缺陷连带阻塞。
- **复现**：`node -e "spawn('npm.cmd',['view','huaweicloud-devkit','dist-tags','--json'],{windowsHide:true})"` → `Error: spawn EINVAL`。
- **关联用例**：D1-26/49/50/51/52/53/54（升级域）、D1-39（#554）。
- **证据**：`evidence/d1-upgrade/` + 本诊断命令输出。

## #7【P2】OBS 建桶示例缺 -location（建桶 IllegalLocationConstraintException）

- **现象**：`hcloud OBS mb obs://<bucket>`（SERVICE_EXAMPLES 示例）→ 建桶失败 `400 IllegalLocationConstraintException: The location constraint is incompatible for the region specific endpoint`。补 `-location=cn-north-4` 后建桶/上传/校验/清理全通。
- **根因**：obsutil `mb` 建桶需显式 `-location`（地域）；`SERVICE_EXAMPLES.OBS.create = 'OBS mb obs://<bucket>'`（tools.mjs L1669）示例缺失该参数，且 `planHcloudCommand` 的 `validateRequiredParams` 未对 OBS mb 告警「缺 location」。
- **附加观察**：OBS 删除命令 `rm obs://<bucket> -r -f` 被 safety-policy 正确拦截（递归+强制删除风险）；空桶删除正确命令是 `rm obs://<bucket>`（不带 -r/-f），非缺陷。
- **证据**：`evidence/d3-c2-obs/diag.mjs`（IllegalLocationConstraintException）+ `probe.mjs`（补 -location 后 upload/ls 通过）。

## #8【P2】hook 未拦截凭证环境变量打印（D4-2）

- **现象**：`hook_check_command({command:'printenv HW_ACCESS_KEY'})` → `{decision:'allow', findings:[]}`（无规则匹配）。而凭证文件读取（`cat ~/.hcloud/config.json`）正确触发 `hwc-command-credential-file` deny。
- **根因**：`safety-policy.mjs` L334-337 有 printenv/env 拦截规则，但第二个正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i`（L336）漏了 **`HW_` 前缀**——实际凭证 env 变量名是 `HW_ACCESS_KEY`/`HW_SECRET_KEY`/`HW_SECURITY_TOKEN`（`HW_` 前缀），不匹配该模式，故 `printenv HW_ACCESS_KEY` 不被拦截。
- **影响**：D4-2 期望「printenv/echo 凭证 env 被阻断」，实际放行——凭证经 env 打印泄漏风险未拦截。
- **证据**：`evidence/d4-security-core/probe.mjs`（D4-2 decision=allow 无规则）。

## #9【P2】大小写变体/命令包裹只触发 warn（D4-15/D4-16）

- **现象**：`hcloud ECS deleteservers`（大小写变体）、`sh -c "hcloud ECS DeleteServers ..."`（包裹）→ 均 `{decision:'warn', ruleId:'hwc-destructive-delete-operation'}`，未 deny。D4-15「无绕过成功」、D4-16「发现内层命令并拦截」预期为拦截（deny）。
- **根因/待判**：规则 `hwc-destructive-delete-operation` 命中后返回 warn（警告级）而非 deny（阻断级）。是否需将破坏性删除提升为 deny，需产品确认（delete 本身是合法操作，warn 或为设计意图；但 D4-15/16 的对抗性预期是 deny）。
- **证据**：`evidence/d4-security-core/probe.mjs`。
- **备注**：D4-9 破坏性预检（`deploy_plan RDS delete`）返回 allow 无规则——可能为输入字段格式与规则引擎不匹配，待进一步核验规则字段契约后判定。

## #10【P2】initialize.capabilities 缺 notifications.cancellation（无法取消/超时工具调用）

- **现象**：`initialize` 返回 `capabilities` 仅 `{tools:{}}`，无 `notifications.cancellation`（也不含 `tools.listChanged`）。D9-9 契约：`cancellation` 缺失 → 标 SPEC-MISMATCH，不假定支持取消。
- **影响**：客户端无法通过 `notifications/cancelled` 取消挂起的 tools/call；超时只能靠客户端断开，服务端无取消语义。
- **证据**：`evidence/d9-9-cancel/probe.mjs`（capabilities=`{"tools":{}}`）。

## #11【P3·次要】README 缺 proxy 命令说明（CLI 有、文档无）

- **现象**：`setup.cjs --help` 有 `proxy`（`init|show|clear`）命令，但 README.md 未提及该命令。
- **根因**：README 命令清单未覆盖 `proxy`（次要命令文档缺口）。
- **证据**：`evidence/d8-doc/verify2.py`（D8-1 检查缺 proxy）。

## 阻塞项（环境/权限缺口，非产品缺陷）

- **D3-C8 企业项目（EPS）**：`hcloud EPS ListEnterpriseProject` → `EPS.0004 Permission error`。测试账号（hw018619646，Enterprise administrator）当前**无 EPS 企业项目查询权限**（企业项目功能未开通或 IAM 缺 EPS 权限）。D3-C8 的企业项目维度无法执行，须升级环境/账号权限或改为"无企业项目参数"的 EVS 基础生命周期侧。证据：`evidence/d3-c8-evs/discovery.mjs`。
- **D3-C1 ECS 购买**：账号现金≈1 元 + 代金券，按时长计费需保证金，ECS 购买可能资金不足被拒（待实测）。

## 通过项快照（P0/P1/P2 只读，无缺陷）

- MCP 协议（D9-1/3/4 + D1-26）：12/12；retrieve_skill（D3-A1）：5/5；detect_framework（D3-B5）：Vite 正样本正确。
- 真云只读（D2 auth_status + D3-A5 list_regions）：3/3；D3-B 能力发现（list_operations/plan/run_readonly）：10/10，真云 API 连通（ListFlavors 返回真实 flavor）。
- D3-B7 审批链（deny→approve→execute + 单次消费 + 参数篡改）：6/6。
- D3-C7 EIP 真云 E2E（创建 id `b3a83260…`→释放→归零验证）：3/3，无残留。
- D3-C2 OBS 静态站（补 `-location` 后建桶/上传/校验/清理）：通过，泄漏桶已归零。
- D3-C8 EVS 生命周期（创建 `--volume.volume_type`/`--volume.availability_zone`→ShowVolume→释放→归零）：4/4。
- D3-B8 voucher_status：`claimed:true 已领取`（查询正常）。BSS 余额查询需 `--cli-region=cn-north-1`（全局服务，不在 cn-north-4，测试侧小注）。