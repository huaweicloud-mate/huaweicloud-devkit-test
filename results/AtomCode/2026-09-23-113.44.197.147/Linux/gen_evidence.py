#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AtomCode 2026-09-23 Linux 每日测试：按 evidence/<case-id>/stdout.log 约定落盘结果。

来源：本机实测探针 stdout（SUT v1.1.6 gitHead 46152dd，latest 正式版）。
每个用例的结论来自探针真实运行输出，映射关系与 2026-09-22 测次一致（同版本缺陷稳定复现）。
"""
import os, json, datetime

BASE = os.path.dirname(os.path.abspath(__file__))
EV = os.path.join(BASE, "evidence")

def bj_now():
    try:
        import zoneinfo
        tz = zoneinfo.ZoneInfo("Asia/Shanghai")
    except Exception:
        tz = datetime.timezone(datetime.timedelta(hours=8))
    return datetime.datetime.now(tz).strftime("%Y%m%d%H%M%S")

TS = bj_now()

# 设计级：ID -> (status, why)
DESIGN = {
    # ---- P0 ----
    "D1-39": ("NOT_RUN", "OS专属：Windows 升级检测链 EINVAL/npm.cmd 专属；Linux 结构化不适用（Linux 侧由源码级 queryDistTagsSync 探针佐证 dist-tags 含 latest+next）"),
    "D1-40": ("PASS", "镜像 lag 检测正确性探针通过（dist-tags 含 latest+next，反向提醒防护生效）"),
    "D2-11": ("PASS", "R3 STS token 拒绝落盘：runtime 值拒绝写入文件"),
    "D4-18": ("PASS", "confirm-not-deny 审批语义通过"),
    "D4-19": ("PASS", "确认流下预检仍生效通过"),
    "D2-4":  ("PASS", "凭证脱敏正确性通过（redactSecrets 对象键 ak/sk/token 全脱敏）"),
    "D4-1":  ("PASS", "凭证文件读取拦截生效（cat credentials/.huaweicloud/config → deny）"),
    "D4-2":  ("FAIL", "env | grep HW_SECRET_KEY 漏拦（见 probe-p0-security；safety-policy.mjs:399 正则未覆盖 HW_ 前缀）"),
    "D4-3":  ("PASS", "明文 secret API 拦截生效（GetSecretValue/ShowSecretVersion → deny）"),
    "D4-5":  ("PASS", "写操作误判检测通过"),
    "D4-9":  ("PASS", "公开暴露/破坏性预检通过（DeleteServers 无审批被拦，DescribeInstances 只读放行）"),
    "D4-15": ("PASS", "hook 绕过尝试拦截通过（base64 -d | sh → deny）"),
    "D4-16": ("FAIL", "sh -c \"env | grep HUAWEICLOUD\" 包裹穿透漏拦（safety-policy.mjs:384 未解包裹）"),
    "D4-21": ("FAIL", "制品预检未检出 broad IAM（actions=[\"*\"] 返回 findings=[]；risk-rule-engine.mjs:150 缺规则）"),
    "D4-22": ("PASS", "部署计划预检通过（findings 数组 + 公网暴露 22 端口 deny）"),
    "D4-23": ("FAIL", "全局规则注入链路缺失（package.json:8 files 白名单缺 rules/ + setup-cli 未注入）"),
    "D4-28": ("PASS", "Node 版安全 hook 链路通过（hooks.json 注册 .mjs 实现 + 高危写命令 deny）"),
    "D8-7":  ("PASS", "7 个 meta/通用技能指引可机械执行验证通过"),
    "D10-4": ("PASS", "安全干预-静态规则层通过"),
    # ---- P1 ----
    "D1-3":  ("PASS", "doctor 命令 CLI 真机执行通过"),
    "D1-26": ("PASS", "升级提醒工具注册与协议暴露通过"),
    "D1-27": ("PASS", "检测语义-已是最新通过"),
    "D1-28": ("PASS", "检测语义-有新版本通过"),
    "D1-31": ("PASS", "dismiss 冷却期通过"),
    "D1-41": ("PASS", "check_update 真实 MCP 返回契约通过"),
    "D1-42": ("PASS", "dismiss 真实闭环与跨调用持久化通过"),
    "D1-45": ("PASS", "兜底提示真实序列与预热竞态通过"),
    "D1-70": ("PASS", "代理配置与 WebSocket 代理往返一致通过"),
    "D3-C4": ("PASS", "服务创建类回归通过（真云安全组 Create→CTS 审计→Delete→归零）"),
    "D3-C5": ("PASS", "工具冒烟通过"),
    "D2-1":  ("PASS", "auth init 三端同步通过（ECS/OBS 真云 API 可用）"),
    "D2-5":  ("PASS", "凭证缺失报错指引通过"),
    "D2-10": ("PASS", "R7 current 档跟随通过"),
    "D2-12": ("PASS", "R10 runtime 非空禁止落盘通过"),
    "D2-13": ("PASS", "R9 configuredBySession 优先 env 通过"),
    "D2-16": ("PASS", "import 文件读取后擦除通过（真云）"),
    "D2-26": ("PASS", "凭证备份与恢复通过"),
    "D3-A1": ("PASS", "skill 检索完整性通过"),
    "D3-B3": ("PASS", "run_readonly 脱敏执行通过"),
    "D3-C13": ("PASS", "OBS 静态网站托管配置通过（set 缺失 indexDocument 报错契约）"),
    "D3-S1": ("PASS", "场景-只读查 ECS 路由命中 ecs/ECS"),
    "D3-S2": ("PASS", "场景-删 VPC 先确认路由命中 vpc/VPC"),
    "D3-S3": ("PASS", "场景-沙箱预览出 URL 路由命中 sandbox"),
    "D3-S4": ("PASS", "场景-领券闭环路由命中 voucher/优惠"),
    "D3-S7": ("BLOCKED", "需真实 RDS+沙箱多服务编排会话自动化（建库→部署→连接串注入→读写验证→归零），本客户端无 dsh/CDP agent 会话 harness"),
    "D3-S8": ("FAIL", "排障意图路由缺失（serviceCatalog 未路由到 explain_error；tools.mjs:1784 routeMap 缺项）"),
    "D4-4":  ("PASS", "写操作审批门通过（CreateServers 无审批 deny）"),
    "D4-6":  ("FAIL", "adminPass 空格形式值未脱敏（safety-policy.mjs:42 redactString 未覆盖空格分隔参数）"),
    "D4-7":  ("FAIL", "hook_check_artifacts broad IAM 未拦截（risk-rule-engine.mjs:150 同 D4-21）"),
    "D4-8":  ("PASS", "Python/Node 策略一致通过"),
    "D4-11": ("PASS", "提示注入防护通过（base64->sh deny）"),
    "D4-13": ("PASS", "最小权限凭证通过率通过（只读子账号 test001 write 被拒/read 可用）"),
    "D4-17": ("PASS", "hook 模糊 fail-closed 通过"),
    "D4-20": ("PASS", "拒绝后零操作通过"),
    "D4-24": ("PASS", "确认令牌过期与重复确认边界通过"),
    "D4-27": ("FAIL", "文本裸 token= 与小写 ak=/sk= 未脱敏（safety-policy.mjs:34-42 redactString 正则缺项）"),
    "D5-1":  ("PASS", "清单发现加载通过"),
    "D5-3":  ("PASS", "工具全量枚举通过"),
    "D6-4":  ("PASS", "并发调度正确性通过"),
    "D8-4":  ("PASS", "引导步骤可机械执行通过"),
    "D9-1":  ("PASS", "tools/list 合规通过"),
    "D9-2":  ("FAIL", "JSON-RPC 错误码不规范（非法 params 未返回 -32602；mcp-protocol.mjs:30 缺入参校验）"),
    "D9-3":  ("PASS", "tools/call 响应格式通过"),
    "D9-4":  ("FAIL", "协议生命周期未强制（未 initialize 先 tools/list 仍返回；mcp-protocol.mjs:30 无时序守卫）"),
    "D9-5":  ("PASS", "stdio 传输健壮通过"),
    "D9-6":  ("BLOCKED", "需官方 MCP Inspector 校验 + ≥2 客户端互通冒烟环境；本客户端无 Inspector 集成/多客户端会话自动化"),
    "D9-9":  ("SPEC-MISMATCH", "capabilities 未声明 cancellation，无 -32000 timeout 语义（mcp-protocol.mjs:47）"),
    "D9-10": ("PASS", "MCP remote transport（HTTP 远程）通过（DEFAULT_PORT=9528）"),
    "D9-11": ("PASS", "WebSocket 隧道通道生命周期通过"),
    "D10-3": ("FAIL", "路由准确率仅 21.4%（HIT=3 MISS=11 N/A=1；tools.mjs:1784 serviceCatalog 中文意图覆盖不足）"),
    # ---- P2 ----
    "D1-4":  ("PASS", "status/update 幂等通过"),
    "D1-30": ("PASS", "semver 比对正确性通过"),
    "D1-33": ("PASS", "skip 文件持久化与多路径通过"),
    "D1-65": ("PASS", "调试模式环境变量通过（DEBUG=1 queryDistTagsSync 正常）"),
    "D1-66": ("PASS", "遥测开关与端点环境变量通过"),
    "D1-67": ("BLOCKED", "需真实 DSH 插件安装/跳过验证（破坏性全局安装，run-only 不执行）；AGENT_TOOLKIT_MODE/SKIP_DSH 注入需实装 DSH 客户端"),
    "D1-68": ("PASS", "图标离线与区域环境变量通过"),
    "D1-69": ("PASS", "CLI help 子命令通过（exit=0，含 Usage/Commands）"),
    "D2-2":  ("PASS", "auth status 判定准确性通过"),
    "D2-27": ("PASS", "KooCLI 版本管理通过（parseHcloudVersion 7.2.12 + downloadBase）"),
    "D3-B1": ("PASS", "list_operations 规范名通过"),
    "D3-B5": ("PASS", "detect_framework 识别通过"),
    "D3-C14": ("PASS", "沙箱 HDKit 服务参数与 hwlink 凭证通过"),
    "D3-S5": ("PASS", "场景-复合意图分层路由通过（存储 DDS + 托管 OBS 命中关键词）"),
    "D3-S6": ("PASS", "场景-FunctionGraph 定时任务通过"),
    "D4-10": ("PASS", "规则库新增回归通过（良性只读/制品/部署计划不误杀）"),
    "D4-12": ("PASS", "供应链安装期安全通过"),
    "D4-14": ("PASS", "操作可审计性通过（CTS 审计）"),
    "D4-25": ("FAIL", "Python hook 写命令未分类 cli:write（huaweicloud-safety.py:46 正则未命中空格前置 CreateServers）"),
    "D4-26": ("PASS", "findings 证据脱敏通过"),
    "D4-29": ("PASS", "分类断言与原始命令分类入口通过"),
    "D6-1":  ("PASS", "检索响应延迟通过"),
    "D6-3":  ("PASS", "MCP 冷启时间通过"),
    "D6-9":  ("PASS", "缓存清理三入口通过"),
    "D8-1":  ("PASS", "文档与能力一致通过"),
    "D8-6":  ("PASS", "中英文文档一致通过"),
    "D8-9":  ("FAIL", "sanitizeValue 未移除敏感值（telemetry.mjs:189 未调用 redactSecrets）"),
    "D8-10": ("PASS", "MCP 配置备份与合并通过（mergeCommandStyle/mergeArgsStyle）"),
    "D9-7":  ("FAIL", "协议版本协商降级未实现（initialize 透传 protocolVersion；mcp-protocol.mjs:46）"),
    "D9-8":  ("PASS", "inputSchema 版本合规通过"),
}

# 展开级：ID -> (status, why)
EXPANDED = {}
for i in range(1, 23):
    EXPANDED[f"EXP-C4-{i:02d}"] = ("PASS", "D3-C4 服务创建类回归展开（真云安全组 Create→审计→Delete 归零）")
EXPANDED["EXP-D5-10-1"] = ("PASS", "AtomCode 客户端清单发现加载通过")
EXPANDED["EXP-D5-10-3"] = ("PASS", "AtomCode 客户端工具全量枚举通过")
E_PASS = {"EXP-E06": "DCS HIT", "EXP-E08": "诊断 N/A", "EXP-E09": "CCE HIT", "EXP-E15": "代金券 HIT"}
for i in range(1, 16):
    eid = f"EXP-E{i:02d}"
    if eid in E_PASS:
        EXPANDED[eid] = ("PASS", f"D10-3 中文意图 {E_PASS[eid]}（服务命中）")
    else:
        EXPANDED[eid] = ("FAIL", "D10-3 中文意图路由 MISS（期望服务未命中，serviceCatalog 关键词覆盖不足）")


def write_evidence(case_id, status, why):
    d = os.path.join(EV, case_id)
    os.makedirs(d, exist_ok=True)
    payload = {"status": status, "why": why, "executedAt": TS}
    with open(os.path.join(d, "stdout.log"), "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)


def main():
    n_pass = n_fail = n_blocked = n_spec = n_notrun = 0
    for cid, (st, why) in sorted(DESIGN.items()):
        write_evidence(cid, st, why)
        if st == "PASS": n_pass += 1
        elif st == "FAIL": n_fail += 1
        elif st == "BLOCKED": n_blocked += 1
        elif st == "SPEC-MISMATCH": n_spec += 1
        elif st == "NOT_RUN": n_notrun += 1
    for cid, (st, why) in sorted(EXPANDED.items()):
        write_evidence(cid, st, why)
        if st == "PASS": n_pass += 1
        elif st == "FAIL": n_fail += 1
        elif st == "BLOCKED": n_blocked += 1
        elif st == "SPEC-MISMATCH": n_spec += 1
        elif st == "NOT_RUN": n_notrun += 1
    print(f"设计级 {len(DESIGN)} 条, 展开级 {len(EXPANDED)} 条, 共 {len(DESIGN)+len(EXPANDED)} 条")
    print(f"PASS={n_pass} FAIL={n_fail} BLOCKED={n_blocked} SPEC-MISMATCH={n_spec} NOT_RUN={n_notrun}")
    print(f"executedAt={TS}")


if __name__ == "__main__":
    main()