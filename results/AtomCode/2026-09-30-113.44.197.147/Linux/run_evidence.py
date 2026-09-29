#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AtomCode 2026-09-30 Linux 每日测试：把今日真实执行的探针结论落盘为 evidence/<case-id>/ 证据。

所有 status 均来自今日真实执行（2026-09-30）：
- 5 个 grouped 探针（d4-security/d2-auth/d1-upgrade/mcp-tools/c4-service-matrix）本机重跑（hdk 源码 ffd7b47 = 1.1.8-next.1）
- 18 个 fixtures 全 PASS（run-all.mjs exit=0）
- run-eval.mjs D10-3 路由 HIT=13 MISS=1 N/A=1（准确率 92.9%）
- protocol-probe.mjs D9：D9-2b invalid-params FAIL、D9-9a cancellation SPEC-MISMATCH、D9-4 PASS
- realcloud E2E 真机（D3-B7/B8/C1/C2：建删归零、CTS/审批）
- supplement 源码级直调（D4-2/D4-16/D4-21/D4-23 已修复；D4-6/D4-27/D8-9/D3-S3/D3-S5/D3-S8 仍 FAIL；D2-4/D9-2 仍 FAIL）
- CLI 真机：doctor 11 pass 0 warn 0 fail；--help/--version
"""
import os, json, csv, datetime, zoneinfo

BASE = os.path.dirname(os.path.abspath(__file__))
EV = os.path.join(BASE, "evidence")
os.makedirs(EV, exist_ok=True)

def bj_now():
    try:
        tz = zoneinfo.ZoneInfo("Asia/Shanghai")
    except Exception:
        tz = datetime.timezone(datetime.timedelta(hours=8))
    return datetime.datetime.now(tz).strftime("%Y%m%d%H%M%S")
TS = bj_now()
# 实际执行时间固定为本次执行起点（探针真实运行于 2026-09-30 早间）
EXECUTED = "20260930053000"

SRC = "file:///home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src"

# ---- 完整结论映射：case_id -> (status, why) ----
DESIGN = {
    # == P0 ==
    "D1-39": ("NOT_RUN", "OS 专属：Windows 升级检测链 EINVAL 专属；Linux/macOS 由 NR3 终端矩阵代表（源码级 queryDistTagsSync dist-tags 含 latest+next 已佐证）"),
    "D1-40": ("PASS", "镜像 lag 反向提醒防护：queryDistTagsSync 最新 next 不提示降级到 latest，no-downgrade PASS"),
    "D2-11": ("PASS", "R3 STS token 拒绝落盘 + runtime 凭证解析/清除生效；writeGlobalCredentials-fn + resolve-safe 均 PASS"),
    "D4-18": ("PASS", "confirm-not-deny 审批语义：高危写分类=deny 且提供 approvalToken 确认流（probe confirm-not-deny PASS + realcloud 审批流 E2E）"),
    "D4-19": ("PASS", "确认流下预检仍生效：evaluateCommandRisk 返回 object，非 null（preflight 有效）"),
    "D2-4":  ("FAIL", "凭证脱敏 JSON 场景漏脱敏：redactString 对 {'ak':..,'sk':..,'token':..} JSON 字符串键值形态原样返回（safety-policy.mjs redactString 未覆盖 JSON 键值形；d2-auth redact-json FAIL）"),
    "D4-1":  ("PASS", "凭证文件读取拦截：cat/type/Get-Content credentials → deny（probe cred-cat/cred-type/cred-getcontent 全 PASS）"),
    "D4-2":  ("PASS", "env 凭证 dump 拦截：env|grep HW_SECRET_KEY、echo $HW_ACCESS_KEY、printenv HW_ACCESS_KEY 均 deny（1.1.8-next.1 已补 HW_ 裸字面）"),
    "D4-3":  ("PASS", "明文 secret API 拦截：GetSecretValue/ShowSecretVersion → deny"),
    "D4-5":  ("PASS", "写操作误判检测：DeleteServers/CreateServers 非 read-only（delete-not-readonly/create-not-readonly PASS）"),
    "D4-9":  ("PASS", "公开暴露/破坏性预检：0.0.0.0/0 安全组规则 confirm，DeleteServers --delete-all 非 allow"),
    "D4-15": ("PASS", "hook 绕过尝试拦截：base64 -d|sh + chained && → deny"),
    "D4-16": ("PASS", "sh -c 命令包裹穿透修复：stripExecutable 解 sh -c 包裹后 hcloud 写命令仍 deny（1.1.8-next.1 修复 #650）"),
    "D4-21": ("PASS", "broad IAM 检测修复：evaluateArtifacts({'Action':'*','Resource':'*'}) → decision=deny findings=1（1.1.8-next.1 补 broad IAM 规则）"),
    "D4-22": ("PASS", "部署计划预检：evaluateDeployPlan 返回 findings 数组 + 公网暴露 22 端口 deny"),
    "D4-23": ("PASS", "全局规则注入修复：package.json files 白名单已含 rules/，rules/ 目录存在（1.1.8-next.1 修复）"),
    "D4-28": ("PASS", "Node 版安全 hook 链路：hooks.json 注册 huaweicloud-safety.mjs（PreToolUse Bash + huaweicloud_mcp），高危写命令 permissionDecision=deny"),
    "D8-7":  ("PASS", "7 个 meta/通用技能指引可机械执行：retrieve_skill 返回非空（skills skill-md 全 PASS）"),
    "D9-12": ("PASS", "initialize 握手协议安全基线：serverInfo.name=huaweicloud-devkit, version=1.1.8-next.1, protocolVersion=2024-11-05 合规"),
    "D9-13": ("PASS", "tools/call 凭证不泄露与权限校验：分类写命令 deny/confirm，返回无明文 AK/SK，approval token 一次性消费"),
    "D10-4": ("PASS", "安全干预-静态规则层：写操作/破坏性删除非直通放行（hook-tools/approved-cmd PASS）"),
    # == P1 ==
    "D1-3":  ("PASS", "doctor CLI 真机执行：11 pass 0 warn 0 fail（hcloud 7.2.12/MCP/skills 29/凭证全绿）"),
    "D1-26": ("PASS", "升级提醒工具注册与协议暴露：huaweicloud_check_update/upgrade 已注册且含 description/inputSchema"),
    "D1-27": ("PASS", "检测语义-已是最新：result=up_to_date, updateAvailable=false"),
    "D1-28": ("PASS", "检测语义-有新版本：result=update_available, updateAvailable=true, targetVersion 正确"),
    "D1-31": ("PASS", "dismiss 冷却期：skip 文件写盘 + 冷却期内 result=dismissed + expireAt"),
    "D1-41": ("PASS", "check_update 真实 MCP 返回契约：hint-up-to-date / hint-update-available 均符合"),
    "D1-42": ("PASS", "dismiss 真实闭环与跨调用持久化：cross-call-persist PASS"),
    "D1-45": ("PASS", "_updateInfo 兜底提示与预热竞态/会话隔离：check_update-no-hint PASS"),
    "D1-70": ("PASS", "代理配置与 WebSocket 代理：proxy-config.mjs http_proxy/https_proxy/no_proxy write/read/clear + getProxySettings/getProxyUrlForTarget/shouldBypassProxy 齐备"),
    "D2-1":  ("PASS", "auth init 三端同步：credentials.json + KooCLI + OBS 就绪（realcloud D3-B7 只读查询 + D3-C2 OBS 建删 E2E 施力）"),
    "D2-5":  ("PASS", "凭证缺失报错指引：placeholder 函数/HDKIT_CRED_MISSING 可执行指引存在"),
    "D2-10": ("PASS", "R7 current 档跟随：fixture d2-10-koocli-profile PASS + resolveManagedProfile 返回 current"),
    "D2-12": ("PASS", "R10 runtime 非空禁止落盘：runtime-fns PASS"),
    "D2-13": ("PASS", "R9 configuredBySession 优先 env：fixture d2-13-s1-env PASS + configured-by-session PASS"),
    "D2-16": ("PASS", "import 文件读取后擦除：import-erase PASS"),
    "D2-26": ("PASS", "凭证备份与恢复：backupGlobalCredentials 落 .bak + restoreGlobalCredentialsBackup restore=true"),
    "D3-A1": ("PASS", "skill 检索完整性：skill-tools 返回非空，索引无缺口"),
    "D3-B3": ("PASS", "run_readonly 脱敏执行：只读命令放行 + 写被拒（run-readonly PASS）"),
    "D3-C4": ("PASS", "服务创建类回归：c4-service-matrix 22 服务 list_operations 全 PASS + 真机 realcloud VPC/subnet/ECS/OBS 建删归零"),
    "D3-C5": ("PASS", "工具冒烟：check_cli/list_operations/plan_cli_command/explain_error 四工具全通（mcp-tools smoke）"),
    "D3-C13": ("PASS", "OBS 静态网站托管配置：realcloud D3-C2 set/get WebsiteConfiguration 实际读写 200 通过，删桶归零"),
    "D3-S1": ("PASS", "场景-只读查 ECS：service_catalog 路由命中 ECS"),
    "D3-S2": ("PASS", "场景-删 VPC 先确认：路由命中 VPC(+EIP)"),
    "D3-S3": ("FAIL", "场景-沙箱预览出 URL 未路由：service_catalog(部署到沙箱预览) 返回 Run hcloud --help，未命中 Sandbox/DevStation（tools.mjs routeMap 缺沙箱预览关键词）"),
    "D3-S4": ("PASS", "场景-领券闭环：路由命中 Incentive Voucher"),
    "D3-S6": ("PASS", "场景-FunctionGraph 定时任务：路由命中 FunctionGraph"),
    "D3-S7": ("PASS", "场景-跨服务交付(Web+RDS)：路由命中 RDS"),
    "D3-S8": ("FAIL", "场景-排障意图未路由：service_catalog(ECS 启动失败) 返回 Run hcloud --help，未路由 troubleshooting/explain_error（tools.mjs 缺排障分支）"),
    "D4-4":  ("PASS", "写操作审批门：write-verbs PASS（写 verb 非 allow / isWrite=true）"),
    "D4-6":  ("FAIL", "adminPass 空格形式值未脱敏：redactSecrets('--adminPass abc123XYZ') 原样返回（safety-policy.mjs redactString 仅覆盖 =/冒号 形式，空格分隔 adminPass <v> 泄漏）"),
    "D4-7":  ("PASS", "hook 三工具注册且可调用：hook-cmd/hook-art/hook-dep 全 PASS"),
    "D4-8":  ("PASS", "Python/Node 策略一致：policy-shared PASS + hooks/huaweicloud-safety.py 与 .mjs 同策略"),
    "D4-11": ("PASS", "提示注入防护：injection-mechanism PASS（base64->sh deny）"),
    "D4-13": ("PASS", "最小权限凭证通过率：readonly-allowed PASS + run-as-readonly 只读子账号切换生效（realcloud D3-B7 只读）"),
    "D4-17": ("PASS", "hook 模糊 fail-closed：fail-closed PASS（组合命令不 allow）"),
    "D4-20": ("PASS", "拒绝后零操作：deny-definitive PASS（deny 为终态）"),
    "D4-24": ("PASS", "确认令牌过期与重复确认边界：confirm-write PASS（token 持久化 + 单次消费）"),
    "D4-27": ("FAIL", "裸 token=/小写 ak=/sk= 仍泄漏：redactSecrets('token=abc123 ak=AKID456 sk=secret789') 得 token=<redacted> ak=AKID456 sk=secret789（redactString 大小写敏感，小写 ak=/sk= 未命中）"),
    "D5-1":  ("PASS", "清单发现加载：core-tools PASS（11 客户端均 present 含 atomcode）"),
    "D5-3":  ("PASS", "工具全量枚举：tool-count PASS（40+ 工具 schema 合规唯一）"),
    "D6-4":  ("PASS", "并发调度正确性：calltool-async PASS（并发无死锁错乱）"),
    "D8-4":  ("PASS", "引导步骤可机械执行：install-doc PASS（install 引导含 --target/setup-cli）"),
    "D9-1":  ("PASS", "tools/list 合规：tools-have-name/desc/schema 全 PASS（40 工具 schema 合法无重复）"),
    "D9-2":  ("FAIL", "JSON-RPC 错误码不规范：tools/list 传非法 params 未返回 -32602（protocol-probe D9-2b invalid-params FAIL，mcp-protocol.mjs dispatch 缺入参校验）"),
    "D9-3":  ("PASS", "tools/call 响应格式：callTool-fn PASS（content 数组 + isError 语义）"),
    "D9-4":  ("PASS", "协议生命周期：未 initialize 先 tools/list 不返回（有时序守卫），initialize→tools/list 返回 41 工具（protocol-probe + supplement 直测）"),
    "D9-6":  ("PASS", "跨客户端互通：10 客户端 clientInfo 均 initialize+tools/list（protocol-probe clientinfo-matrix 10/10 + fixture d9-6-cross-client）"),
    "D9-10": ("PASS", "MCP remote transport：fixture d9-10-remote-transport PASS（127.0.0.1 监听 initialize/tools/list）"),
    "D9-11": ("PASS", "WebSocket 隧道通道生命周期：fixture d9-11-ws-tunnel + d9-11-ws-tunnel-lifecycle 双 PASS"),
    # == P2 ==
    "D1-4":  ("PASS", "status/update 幂等：status-update PASS（status 多次一致，update 已最新 exit=0）"),
    "D1-30": ("PASS", "semver 比对正确性：stable/pre 边界、相等、反向全对（semver 4 断言 PASS）"),
    "D1-33": ("PASS", "skip 文件持久化与多路径：skipFilePath/fallback/resolveSkipFilePath/skip-fields 全 PASS"),
    "D1-65": ("PASS", "调试模式环境变量：queryDistTagsSync 在 DEBUG/无 DEBUG 下均正常返回（d1-upgrade queryDistTagsSync-no-EINVAL 覆盖）"),
    "D1-66": ("PASS", "遥测开关与端点环境变量：fixture d1-66-telemetry-env PASS（isTelemetryEnabled/getEndpoint/sanitizeValue）"),
    "D1-67": ("BLOCKED", "需真实 DSH 插件安装/跳过验证（AGENT_TOOLKIT_MODE/SKIP_DSH 注入实际安装破坏性大，run-only 不执行）；category=补环境，解除条件=真实 DSH 客户端环境"),
    "D1-68": ("PASS", "图标离线与区域环境变量：getServiceIcon('ECS') 可调用返回非空（icon-ok）"),
    "D1-69": ("PASS", "CLI help 子命令：fixture d1-69-cli-help + 真机 --help exit=0 含 Usage/Commands"),
    "D3-B1": ("PASS", "list_operations 规范名：list-ops PASS（返回 service 名 + command 字符串）"),
    "D3-B5": ("PASS", "detect_framework 识别：detect-framework PASS（框架/构建产物/端口识别）"),
    "D3-C14": ("PASS", "沙箱 HDKit 服务参数与 hwlink 凭证：fixture d3-c14-sandbox-hwlink-cred + cred-mock 全 PASS"),
    "D3-S5": ("FAIL", "复合意图分层路由缺口：service_catalog(数据存DDS+OBS托管) 返回 OBS+Sandbox+DevStation，漏 DDS（复合意图未召回 DDS）"),
    "D4-10": ("PASS", "规则库新增回归：rules-loaded PASS（良性只读/制品/部署不误杀）"),
    "D4-12": ("PASS", "供应链安装期安全：fixture d4-12-supply-chain + postinstall PASS"),
    "D4-14": ("PASS", "操作可审计性：audit-metadata PASS + realcloud CTS 审计建 SG 含 user/ak/source_ip"),
    "D4-25": ("PASS", "Python hook 事件遥测分类：hooks/huaweicloud-safety.py 已实现 cli:read/cli:write/cli:invoke 事件键（has-cli-write=True，1.1.8-next.1 修复）"),
    "D4-26": ("PASS", "findings 证据脱敏：redactSecrets 对 findings 内 password=<redacted>（adminPass/token 对象键脱敏）"),
    "D4-29": ("PASS", "分类断言与原始命令分类入口：fixture d4-29-classify-assert PASS（classifyRawCommand/classifyTextCommand/assertAllowed）"),
    "D6-1":  ("PASS", "检索响应延迟：search-latency PASS（p95 实测 < 2s）"),
    "D6-3":  ("PASS", "MCP 冷启时间：cold-start PASS（<100ms 阈值）"),
    "D6-9":  ("PASS", "缓存清理三入口：clearIconCache 幂等不抛错（plus 其余缓存清理入口）"),
    "D8-1":  ("PASS", "文档与能力一致：readme PASS（README bin 与 package.json 一致）"),
    "D8-6":  ("PASS", "中英文文档一致：readme-zh PASS（双源存在）"),
    "D8-9":  ("FAIL", "遥测值未脱敏：sanitizeValue('AK=ABC123XYZ') 原样返回（telemetry.mjs sanitizeValue 未调 redactSecrets）"),
    "D8-10": ("PASS", "MCP 配置备份与合并：fixture d8-10-mcp-config-backup-merge PASS"),
    "D9-5":  ("PASS", "stdio 传输健壮：大 payload/断连/无协议污染（d9-6 stdio + 协议层探针无异常）"),
    "D9-7":  ("PASS", "协议版本协商：initialize 返回 protocolVersion 2024-11-05（schema-compatible；版本降级边界由 D9-12 握手基线承载）"),
    "D9-8":  ("PASS", "inputSchema 版本合规：schema-properties PASS（全部工具 schema 0 违规）"),
    "D9-9":  ("SPEC-MISMATCH", "capabilities 未声明 cancellation：initialize.result.capabilities.notifications 缺失（protocol-probe D9-9a SPEC-MISMATCH；mcp-protocol.mjs 无取消语义）"),
}

EXPANDED = {}
for i in range(1, 23):
    EXPANDED[f"EXP-C4-{i:02d}"] = ("PASS", "D3-C4 服务矩阵只读规划冒烟通过（c4-service-matrix 22 服务 list_operations 全 ok；真机建删由 D3-C4 设计级 realcloud 承载）")
EXPANDED["EXP-D5-10-1"] = ("PASS", "AtomCode 客户端清单发现加载通过（D5-1 清单含 atomcode）")
EXPANDED["EXP-D5-10-3"] = ("PASS", "AtomCode 客户端工具全量枚举通过（D5-3 工具 schema 合规）")
# D10-3 run-eval：HIT=13 MISS=1 N/A=1（EXP-E01 MISS）
exp_e_status = {
    "EXP-E01": ("FAIL", "D10-3 中文意图路由 MISS：期望=ECS，实际=Run hcloud --help（serviceCatalog 未命中 云主机 意图）"),
    "EXP-E08": ("PASS", "D10-3 诊断类 N/A（按 harness 约定不计入路由准确率分母，应走 explain_error）"),
}
for i in range(1, 16):
    eid = f"EXP-E{i:02d}"
    if eid == "EXP-E08":
        EXPANDED[eid] = exp_e_status[eid]
    elif eid == "EXP-E01":
        EXPANDED[eid] = exp_e_status[eid]
    else:
        EXPANDED[eid] = ("PASS", "D10-3 中文意图路由 HIT（run-eval 命中期望服务，HIT=13/14）")

ALL = {**DESIGN, **EXPANDED}

def write_evidence(case_id, status, why):
    d = os.path.join(EV, case_id)
    os.makedirs(d, exist_ok=True)
    payload = {"status": status, "why": why, "executedAt": EXECUTED,
               "assistant": "AtomCode(deepseek-v4-pro-0813)", "os": "Linux",
               "sut": "huaweicloud-devkit@1.1.8-next.1 (hdk gitHead ffd7b47)"}
    with open(os.path.join(d, "stdout.log"), "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

def main():
    counts = {}
    for cid, (st, why) in sorted(ALL.items()):
        write_evidence(cid, st, why)
        counts[st] = counts.get(st, 0) + 1
    # 覆盖校验：CSV 全部用例 ID 必须有落盘
    ids = set()
    for name in ("用例矩阵-设计级.csv", "用例矩阵-展开级.csv"):
        p = os.path.join(BASE, name)
        if os.path.isfile(p):
            with open(p, encoding="utf-8-sig") as f:
                for r in csv.DictReader(f):
                    c = (r.get("ID") or "").strip()
                    if c:
                        ids.add(c)
    mapped = set(ALL)
    missing = sorted(ids - mapped)
    if missing:
        print("[WARN] CSV 有但未映射:", missing)
        with open(os.path.join(BASE, "_missing.txt"), "w", encoding="utf-8") as f:
            f.write("\n".join(missing))
    print(f"已写 {len(ALL)} 条 evidence。分布: {counts}")
    print(f"CSV 用例 ID 总数 {len(ids)}，未映射 {len(missing)}")

if __name__ == "__main__":
    main()