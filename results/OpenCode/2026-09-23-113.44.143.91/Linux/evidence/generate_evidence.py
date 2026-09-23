# -*- coding: utf-8 -*-
"""OpenCode Linux 每日测试证据落盘 + stdout.log 生成（机器可读 JSON，供 backfill_daily.py 回填）。

每个用例写 evidence/<case-id>/stdout.log，含 { status, why, executedAt }。
执行自: run-all.sh 源码级探针 fresh 重跑 + 真云 E2E + eval harness。
"""
import os, json, datetime

EVID = "/home/zhangshuang/devkit-test/OpenCode/huaweicloud-devkit-test/results/OpenCode/2026-09-23-113.44.143.91/Linux/evidence"
TS = "20260923174400"

# design 级最终判定（基于 fresh 重跑证据）
DESIGN = {
    # D1
    "D1-3": ("PASS", "doctor 10 pass 0 warn 0 fail (fresh-cli.txt)"),
    "D1-4": ("PASS", "status/update 幂等：二次 update 后 MCP config unchanged (fresh-cli.txt)"),
    "D1-26": ("PASS", "TOOL_DEFINITIONS 含 check_update+upgrade, inputSchema=object (fresh-remaining.txt)"),
    "D1-27": ("PASS", "judgeUpdate 当前=latest -> up_to_date (fresh-remaining.txt)"),
    "D1-28": ("PASS", "judgeUpdate 有新版本 -> update_available (fresh-remaining.txt)"),
    "D1-30": ("PASS", "semverCompare 7/7 组正确 (fresh-remaining.txt)"),
    "D1-31": ("PASS", "冷却期内 dismissed (fresh-remaining.txt)"),
    "D1-33": ("PASS", "skip 文件 dismissedVersion 写读一致 (fresh-remaining.txt)"),
    "D1-39": ("NOT_RUN", "Windows 专属升级检测链 OS 用例，本机 Linux 无法复现；Linux 侧由展开级通用断言覆盖"),
    "D1-40": ("PASS", "update-check.mjs 含 judgeUpdate 语义 (fresh-security.txt)"),
    "D1-41": ("PASS", "check_update MCP 返回 {currentVersion=1.1.6, result=up_to_date,...} (fresh-d1-41.txt)"),
    "D1-42": ("PASS", "dismiss 落盘读回跨调用仍 dismissed (fresh-d1-41.txt)"),
    "D1-45": ("PASS", "mcp-protocol.mjs consumedBySession 单次消费 (fresh-remaining.txt)"),
    "D1-65": ("PASS", "update-check.mjs HUAWEICLOUD_DEVKIT_DEBUG 门控存在 (fresh-newcases.txt)"),
    "D1-66": ("PASS", "遥测 off 关闭/未设开启 + ENDPOINT 回退 DEFAULT_ENDPOINT (fresh-newcases.txt)"),
    "D1-67": ("PASS", "AGENT_TOOLKIT_MODE 注入+HCLOUD_BIN in REQUIRED_ENV_KEYS+SKIP_DSH 跳过 (fresh-hookchain.txt)"),
    "D1-68": ("SPEC-MISMATCH", "HW_REGION 优先于 HUAWEICLOUD_REGION (credentials.mjs:133)，契约漂移"),
    "D1-69": ("PASS", "help 子命令输出帮助且退出码 0 (fresh-hookchain.txt)"),
    "D1-70": ("FAIL", "no_proxy CIDR 10.0.0.0/8 未匹配，getProxySettings 仍返回代理 (proxy/proxy-config.mjs:42-47 shouldBypassProxy 无 CIDR 匹配)"),
    # D2
    "D2-1": ("PASS", "三端同步 S1/S2/S3 全落位 + validateIamCredentials valid=true (fresh-auth.txt)"),
    "D2-2": ("PASS", "auth_status 结构化字段 credentialsConfigured/kooCliInstalled/obsConfigured=true (fresh-remaining.txt)"),
    "D2-4": ("FAIL", "redactSecrets 小写 ak=/sk= 不脱敏 (safety-policy.mjs:45 大小写敏感缺 /i)"),
    "D2-5": ("PASS", "HDKIT_CRED_MISSING + HW_ACCESS_KEY 指引存在 (fresh-remaining.txt)"),
    "D2-10": ("PASS", "reconcile current 档 + fingerprint 存在 (fresh-remaining.txt)"),
    "D2-11": ("FAIL", "persist 带 token 时 R2 needs_confirmation 先于 R3 STS 拒绝 (tools.mjs:1214-1228 先于 1237)"),
    "D2-12": ("PASS", "R10 auto-sync suppressed (fresh-remaining.txt)"),
    "D2-13": ("PASS", "R9 configuredBySession 优先 env (fresh-remaining.txt)"),
    "D2-16": ("PASS", "import creds-import.json 读后无条件擦除 (fresh-auth.txt)"),
    "D2-26": ("PASS", "备份+恢复闭环 4/4 断言通过 (fresh-d2-26.txt)"),
    "D2-27": ("PASS", "parseHcloudVersion/compareVersion/downloadBase 正确 (fresh-newcases.txt)"),
    # D3
    "D3-A1": ("PASS", "retrieve_skill huawei-ecs ok refs=5 (fresh-tools.txt)"),
    "D3-B1": ("PASS", "list_operations 返回规范操作名 (fresh-c4.txt: ListCloudServers/ListAddressGroup...)"),
    "D3-B3": ("PASS", "run_readonly_command ok exitCode=0 count=0 实例 (fresh-tools.txt)"),
    "D3-B5": ("PASS", "detect_framework 识别 Next.js (fresh-final.txt)"),
    "D3-C4": ("FAIL", "22 服务矩阵 20/22 只读冒烟 PASS；DMS/DEW list_operations unsupported (营销聚合名无单一 KooCLI 服务标识)"),
    "D3-C5": ("PASS", "5 工具冒烟 5/5 通过 (fresh-final.txt)"),
    "D3-C13": ("PASS", "OBS 静态网站 get/set/delete 全 ok，无 indexDocument set 报错，桶已删归零 (fresh-realcloud-newcases.txt)"),
    "D3-C14": ("PASS", "hdkitCredentials 缺参 throw；hwlink.getCredentials{ak,sk,securitytoken} (fresh-newcases.txt)"),
    "D3-S1": ("FAIL", "serviceCatalog 中文「查云主机」路由 miss→Run hcloud --help；run_readonly 正常 (tools.mjs serviceCatalog 英文-only)"),
    "D3-S2": ("PASS", "删 VPC 先确认：未确认前仍在+确认后归零 (fresh-d3-s2.txt)"),
    "D3-S3": ("FAIL", "沙箱预览 deploy_check tunnel_url_accessible=false publicUrl=undefined (DevBridge 隧道未建)"),
    "D3-S4": ("PASS", "voucher status→claim→status 闭环 claimed=true (fresh-realcloud-newcases.txt)"),
    "D3-S5": ("FAIL", "中文复合意图分层路由 miss (tools.mjs serviceCatalog 英文-only)"),
    "D3-S6": ("PASS", "FunctionGraph 建函数+定时触发器+URN 核对+删除归零 (fresh-d3-s6.txt)"),
    "D3-S7": ("NOT_RUN", "真云跨服务编排需建 RDS(单次 10~20 分钟+按需计费)，单轮时间窗无法建删归零闭环；建议独立补测轮"),
    "D3-S8": ("PASS", "explainError 存在且含分类+可执行下一步 (fresh-newcases.txt)"),
    # D4
    "D4-1": ("PASS", "凭证文件读取路径均 deny、普通文件 allow (fresh-security.txt)"),
    "D4-2": ("PASS", "6/6 env 打印泄露路径 deny (fresh-security.txt)"),
    "D4-3": ("PASS", "ShowSecretVersion/GetSecretValue deny、ShowSecret 元数据 allow (fresh-security.txt)"),
    "D4-4": ("FAIL", "审批门 Change* 写动词漏拦截 1/4 (safety/policy.json:27-31 缺 Change 前缀)"),
    "D4-5": ("FAIL", "Change* 写操作误判只读 0/4 拦截 (safety/policy.json:27-31 缺 Change)"),
    "D4-6": ("PASS", "adminPass=<redacted> 脱敏 + 写操作 deny (fresh-remaining.txt)"),
    "D4-7": ("PASS", "三 hook 工具注册 + rm -rf / deny (fresh-remaining.txt)"),
    "D4-8": ("FAIL", "Python 钩子对 configure show/Delete 放行，Node deny，策略不一致 (hooks/huaweicloud-safety.py:46)"),
    "D4-9": ("PASS", "公网管理端口/force 删除 deny (fresh-security.txt)"),
    "D4-10": ("PASS", "规则库加载 16 规则 (fresh-remaining.txt)"),
    "D4-11": ("FAIL", "自然语言夹带写命令未拦截 1/4；编码载荷 deny (safety-policy.mjs:428 仅识别前导 hcloud)"),
    "D4-12": ("PASS", "postinstall 无恶意 + 依赖锁定 undici (fresh-remaining.txt)"),
    "D4-13": ("PASS", "只读子账号 IAM valid + 只读可用 + 写被 IAM 拒绝 (fresh-d4-13.txt)"),
    "D4-14": ("PASS", "VPC 建删归零 + CTS 审计含 CreateVpc+本次 vpcId (fresh-realcloud-s3-d414.txt)"),
    "D4-15": ("PASS", "大小写/复数/force/URL 编码变体 5/5 拦截 (fresh-security.txt)"),
    "D4-16": ("FAIL", "sh/bash/eval/$() 包裹 0/4 拦截 (safety-policy.mjs:428 shell-wrap 解包未前移)"),
    "D4-17": ("FAIL", "畸形/空 tool_input fail-open 放行 (hooks JSON.parse catch return)"),
    "D4-18": ("PASS", "写操作 deny+risk=write+approvalToken 签发 (fresh-approval.txt)"),
    "D4-19": ("PASS", "允许写放行+危险规则仍 deny (fresh-security.txt / fresh-approval.txt)"),
    "D4-20": ("PASS", "拒绝后零执行零资源变更；Invalid approval token 拦截 (fresh-remaining.txt)"),
    "D4-21": ("PASS", "broad IAM 策略 deny + hwc-iam-admin-policy (fresh-security.txt)"),
    "D4-22": ("PASS", "FunctionGraph 公网无认证 warn + hwc-functiongraph-public-no-auth (fresh-security.txt)"),
    "D4-23": ("FAIL", "隔离 HOME install 后无 huawei-agent-rules.md (setup-cli.mjs 未复制 rules/)"),
    "D4-24": ("PASS", "confirmToken 过期/未找到拦截 (fresh-remaining.txt)"),
    "D4-25": ("FAIL", "Python hook 写操作落 cli:invoke、configure show 落 cli:read (huaweicloud-safety.py WRITE_OPERATION_RE)"),
    "D4-26": ("FAIL", "findings.evidence 明文泄漏 AK/SK (risk-rule-engine.mjs:97 excerpt 未脱敏)"),
    "D4-27": ("FAIL", "双路径脱敏缺小写 ak=/sk= 与裸 token= (6 断言 3 FAIL；safety-policy.mjs:42-45)"),
    "D4-28": ("PASS", "hooks.json 走 node hook；command/cmd/script 提取+高危 deny (fresh-hookchain.txt)"),
    "D4-29": ("PASS", "classifyRawCommand=classifyTextCommand 包装+分类断言 (fresh-newcases.txt)"),
    # D5
    "D5-1": ("PASS", "OpenCode 清单发现加载：install 产物 skills/commands/MCP 全落位 (fresh-cli.txt)"),
    "D5-3": ("PASS", "tools/list=40 全量可达 schema 完整 (fresh-protocol.txt)"),
    # D6
    "D6-1": ("PASS", "skill 检索 4ms <2000ms ok=true (fresh-final.txt)"),
    "D6-3": ("PASS", "MCP 冷启 543ms <2000ms (fresh-supplement.txt)"),
    "D6-4": ("PASS", "3 并发 tools/call content 正确 243ms (fresh-final.txt)"),
    "D6-9": ("PASS", "clearIconCache/clearMarketCache/invalidateUpdateCache 三入口可调用 (fresh-newcases.txt)"),
    # D8
    "D8-1": ("PASS", "文档与能力一致：README/SKILL frontmatter 实测存在且命令可用 (doctor 10 pass)"),
    "D8-4": ("PASS", "引导步骤可机械执行：install/doctor 步骤逐条可执行 (fresh-cli.txt)"),
    "D8-6": ("PASS", "README.md 与 README.zh-CN.md 并存 (fresh-remaining.txt)"),
    "D8-7": ("PASS", "6 meta 技能 frontmatter name 正确 (fresh-remaining.txt)"),
    "D8-9": ("SPEC-MISMATCH", "sanitizeValue 未脱敏敏感值 ak=/sk=/token= (telemetry.mjs:189)，契约漂移"),
    "D8-10": ("PASS", "mergeCommandStyle/ArgsStyle/File + extractUserDelta 应用幂等 (fresh-newcases.txt)"),
    # D9
    "D9-1": ("PASS", "tools/list=40 合法 (fresh-protocol.txt)"),
    "D9-2": ("PASS", "未知方法错误码 -32601 Method not found (fresh-protocol.txt)"),
    "D9-3": ("PASS", "tools/call content[0].type=text isError=false (fresh-protocol.txt)"),
    "D9-4": ("PASS", "initialize serverInfo name/version 正确 (fresh-protocol.txt)"),
    "D9-5": ("PASS", "stdio 30 并发全部正确响应 (fresh-final.txt)"),
    "D9-6": ("PASS", "stdio 互通 + 多客户端 manifest (fresh-remaining.txt)"),
    "D9-7": ("PASS", "协议版本协商回显 2024-11-05 (fresh-protocol.txt)"),
    "D9-8": ("PASS", "inputSchema type=object (fresh-protocol.txt)"),
    "D9-9": ("PASS", "tools/call 超时受控返回 196ms 未挂死 (fresh-supplement.txt)"),
    "D9-10": ("PASS", "remote 9528 默认端口; initialize/tools/list=40/call/-32601 全通过 (fresh-d9-10.txt)"),
    "D9-11": ("PASS", "WS 隧道 attach/ready/close 生命周期正确 (fresh-newcases.txt)"),
    # D10
    "D10-3": ("FAIL", "serviceCatalog 中文意图路由准确率 21.4% (HIT=3 MISS=11 N/A=1) <90% (tools.mjs routeMap 英文-only)"),
    "D10-4": ("PASS", "静态规则层 5 类高危 deny/deny/... 全部拦截 (fresh-final.txt)"),
}

# 展开级 39 条
EXPANDED = {}
# D5 客户端矩阵 OpenCode (2)
EXPANDED["EXP-D5-1-1"] = ("PASS", "OpenCode 清单发现加载：~/.config/opencode/ skills/commands/MCP 全落位 (fresh-cli.txt)")
EXPANDED["EXP-D5-1-3"] = ("PASS", "OpenCode tools/list=40 全量可达 (fresh-protocol.txt)")
# D3-C4 服务矩阵 22 条
C4_PASS = ["01","02","03","04","05","06","07","08","09","10","11","12","13","15","16","17","19","20","21","22"]
C4_FAIL = {"14": "DMS", "18": "DEW"}
for n in C4_PASS:
    EXPANDED[f"EXP-C4-{n}"] = ("PASS", "list_operations 可路由 + plan 只读 allow (fresh-c4.txt)")
for n, svc in C4_FAIL.items():
    EXPANDED[f"EXP-C4-{n}"] = ("FAIL", f"{svc} list_operations unsupported（营销聚合名无单一 KooCLI 服务标识，测试侧/改用例）")
# D10 评测集 EXP-E 15 条
E_HIT = {"06": "DCS", "09": "CCE", "15": "Incentive Voucher"}
E_MISS = {"01": "ECS", "02": "ECS", "03": "OBS", "04": "EIP", "05": "RDS", "07": "CBR", "08": "(诊断)", "10": "FunctionGraph", "11": "BSS", "12": "CES", "13": "ELB", "14": "IAM"}
for n, svc in E_HIT.items():
    EXPANDED[f"EXP-E{n}"] = ("PASS", f"中文意图路由命中 {svc} (eval-harness.txt)")
for n, svc in E_MISS.items():
    EXPANDED[f"EXP-E{n}"] = ("FAIL", f"中文意图路由 miss（期望 {svc}，实际 Run hcloud --help；tools.mjs serviceCatalog 英文-only）")

def write_stdout(cid, status, why):
    d = os.path.join(EVID, cid)
    os.makedirs(d, exist_ok=True)
    p = os.path.join(d, "stdout.log")
    obj = {"status": status, "why": why, "executedAt": TS}
    with open(p, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False)

n = 0
for cid, (st, why) in list(DESIGN.items()) + list(EXPANDED.items()):
    write_stdout(cid, st, why)
    n += 1
print(f"written stdout.log for {n} cases (design={len(DESIGN)}, expanded={len(EXPANDED)})")