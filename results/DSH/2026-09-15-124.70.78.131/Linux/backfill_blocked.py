# -*- coding: utf-8 -*-
"""补测回填：消解 2026-09-15 设计级 22 条 BLOCKED 中的 11 条假阻塞，11 条真外部依赖补齐四要素 blockedReason。"""
import csv, datetime, os

PACK = os.path.dirname(os.path.abspath(__file__))
DESIGN = os.path.join(PACK, "用例矩阵-设计级.csv")
TS = datetime.datetime.now().strftime("%Y%m%d%H%M%S")

# 假阻塞 → 已执行回填（执行状态 / 证据目录）
UNBLOCK = {
    "D1-39": ("FAIL", "evidence/update"),           # Windows shell:true 根因仍在(已知 #554)，源码级确认
    "D1-41": ("PASS", "evidence/update"),           # judgeUpdate 四态契约直调
    "D1-42": ("PASS", "evidence/update"),           # dismiss 持久化(写/读 skip + 3天冷却)直调
    "D1-45": ("PASS", "evidence/update"),           # applyUpdateHint 一次性注入规则直调
    "D2-2":  ("PASS", "evidence/auth"),             # getAuthStatus/computeOnboarding 直调
    "D4-8":  ("PASS", "evidence/security"),         # Node 路径策略一致 + 共享规则库(源)
    "D4-10": ("PASS", "evidence/security"),         # 规则库新增注入回归无误杀直调
    "D4-11": ("PASS", "evidence/security"),         # 注入串被风险引擎 deny + search_docs 只读(源)
    "D8-4":  ("PASS", "evidence/doc"),              # 29 份 SKILL.md 静态评审无含糊标记
    "D9-5":  ("PASS", "evidence/protocol"),         # stdio 大 payload/并发/无协议污染实测
    "D9-9":  ("SPEC-MISMATCH", "evidence/protocol"),# capabilities.cancellation 未声明 + 未实现 -32000
}

# 真·外部依赖 → 保留 BLOCKED，blockedReason 四要素：实测时间 | 缺什么资源 | 影响 | 解除条件
T = "2026-09-15T21:45+08:00"
BLOCKED = {
    "D1-5": (f"实:{T}｜缺:多客户端残留矩阵(本机共享环境已装 Hermes/CodeArts/Codex，真实全局 uninstall 会破坏其它客户端)+Windows 文件锁环境(本机 Linux)｜影响:无法带证据断言「各客户端卸载后无功能残留」，DSH 单客户端 uninstall 全链残留未 E2E 实测｜解除:独立测试机(含 Windows VM)或隔离多客户端 fixtures"),
    "D4-12": (f"实:{T}｜缺:SBOM 产出工具链(cyclonedx/syft 等)｜影响:SBOM 产出环节无法实测(postinstall 审计与 pack 一致性可源码级做但不在本单)｜解除:装配 SBOM 工具链"),
    "D4-13": (f"实:{T}｜缺:只读 IAM 子账号凭证 ~/.config/huaweicloud/credentials.readonly.json(本机仅管理员 hw018619646)｜影响:D3 只读用例在最小权限下通过率/写越权识别无法实测｜解除:下发 credentials.readonly.json(test001)"),
    "D4-14": (f"实:{T}｜缺:真云写操作(建删资源)以查 CTS 审计日志并区分 agent/人工｜影响:操作可审计性(每次命令可追溯)无法实测｜解除:真云写操作执行 + CTS 查询权限"),
    "D4-18": (f"实:{T}｜缺:真云写操作 + 交互确认对话框(headless 无 UI / PTY)｜影响:confirm-not-deny 审批语义无法实测｜解除:交互客户端(PTY) + 真云写操作"),
    "D4-19": (f"实:{T}｜缺:真云确认流 + preflight 观察环境｜影响:确认流中风险预检仍生效无法实测｜解除:真云写操作 + 交互确认流"),
    "D4-20": (f"实:{T}｜缺:真云确认流选拒绝后核查资源变更/执行痕迹｜影响:拒绝后零操作无法实测｜解除:真云 + 交互确认流 + 资源前后快照"),
    "D4-24": (f"实:{T}｜缺:真云写操作(建最小规格 ECS) + 可注入时钟(令牌 TTL 60s 加速)｜影响:CONFIRM_TOKEN_EXPIRED/already_processed 边界无法实测｜解除:真云写操作 + 时钟注入夹具"),
    "D7-4": (f"实:{T}｜缺:国内网络 + 华为云 npm 镜像源(registry 可达)｜影响:镜像路径安装验证无法实测(本机默认官方源且网络不可控)｜解除:国内网络/镜像可达环境"),
    "D9-6": (f"实:{T}｜缺:MCP Inspector + ≥3 真实客户端(本机仅 DSH)｜影响:跨客户端协议互通冒烟无法实测｜解除:≥3 客户端 + Inspector 环境"),
    "D10-4": (f"实:{T}｜缺:真实 Agent 会话评测(LLM harness，run-eval.mjs 无法代理的行为层)｜影响:高危请求是否走 plan→审批流无法观测(DSH 自身即被测 Agent)｜解除:真实 Agent 会话 CDP/LLM harness 观测"),
}

assert set(UNBLOCK) | set(BLOCKED) == set(["D1-5","D1-39","D1-41","D1-42","D1-45","D2-2","D4-8","D4-10","D4-11","D4-12","D4-13","D4-14","D4-18","D4-19","D4-20","D4-24","D7-4","D8-4","D9-5","D9-6","D9-9","D10-4"]), "case set mismatch"

with open(DESIGN, encoding="utf-8-sig") as f:
    rows = list(csv.DictReader(f))
fields = list(rows[0].keys())

changed = 0
for r in rows:
    cid = (r.get("ID") or "").strip()
    if cid in UNBLOCK:
        st, ev = UNBLOCK[cid]
        r["执行状态"] = st
        r["执行时间"] = TS
        r["evidencePath"] = ev
        r["blockedReason"] = ""
        changed += 1
    elif cid in BLOCKED:
        r["执行状态"] = "BLOCKED"
        r["执行时间"] = TS
        r["evidencePath"] = ""
        r["blockedReason"] = BLOCKED[cid]
        changed += 1

with open(DESIGN, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(rows)

# 统计
from collections import Counter
c = Counter((r["执行状态"] or "").strip() for r in rows)
print("回填完成:", changed, "条")
print("设计级状态分布:", dict(c))
print("时间戳:", TS)