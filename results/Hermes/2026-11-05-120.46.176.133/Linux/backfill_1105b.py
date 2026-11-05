# -*- coding: utf-8 -*-
"""Hermes Linux 2026-11-05 每日测试（10:xx 重跑轮次）：回填三 CSV（v1.1.13-next.5 / gitHead 4ab34ed2）。"""
import os, csv
from collections import Counter
from datetime import datetime, timezone, timedelta
BASE = os.path.dirname(os.path.abspath(__file__))
EVID = os.path.join(BASE, "evidence")
BJT = timezone(timedelta(hours=8))
TS = datetime.now(BJT).strftime("%Y%m%d%H%M%S")
# ===== 2. 回填 CSV（2026-11-05 10:xx 重跑，按本轮 fresh evidence 重新判定）=====（状态映射：按本轮 2026-11-05 10:xx fresh evidence 判定） =====
PASS_D = [
    "D1-3","D1-4","D1-26","D1-27","D1-28","D1-30","D1-31","D1-33",
    "D1-40","D1-41","D1-42","D1-45","D1-65","D1-66","D1-67","D1-68","D1-69",
    "D2-1","D2-2","D2-4","D2-5","D2-11","D2-12","D2-16","D2-26","D2-27",
    "D3-A1","D3-B1","D3-B3","D3-B5","D3-C4","D3-C5","D3-C14",
    "D3-S1","D3-S2","D3-S4","D3-S8",
    "D4-1","D4-3","D4-4","D4-5","D4-7","D4-8","D4-9","D4-10","D4-11",
    "D4-14","D4-15","D4-16","D4-18","D4-19","D4-20","D4-22","D4-23",
    "D4-27","D4-28","D4-29",
    "D5-1","D5-3","D6-1","D6-3","D6-4","D6-9","D8-7","D8-10",
    "D9-1","D9-2","D9-3","D9-4","D9-5","D9-7","D9-8","D9-10","D9-11","D9-13",
    "D3-C1","D3-C2","D3-C7","D3-C13","D4-13",
]

FAIL_D = {
    "D4-2":  "env | grep -i access_key 未拦截（generic access_key 无云前缀）",
    "D4-6":  "hook_check_command(--admin-pass) 返回 allow 未告警",
    "D4-17": "hook 模糊输入 fail-open（&& rm -rf /、$(curl|sh) 放行）",
    "D4-21": "hook_check_artifacts 未拦截 HCL actions=[*] / AdministratorFullAccess",
    "D4-25": "Python hook 写操作遥测误分类 cli:invoke（应 cli:write）",
    "D4-26": "findings.evidence JSON 带引号 key 明文 secret_key/adminPass 泄漏",
    "D3-S5": "serviceCatalog 复合意图未命中多 service（回退 help）",
    "D3-S6": "FunctionGraph CreateFunction 返回 Invalid parameter: code.filename，未生成 URN/触发器",
    "D3-S7": "RDS 复合意图部署目标未命中 + CreateInstance 缺前置（Invalid parameter: db.password）",
    "D9-12": "initialize 版本检查缺失 + 非法时序 tools/list 未拒 -32600",
    "D10-3": "serviceCatalog 中文意图 EXP-E01「云主机」未命中（92.9% 未达 100%）",
    "D1-70": "proxy-agent getWebSocketImpl 崩溃：bundled undici@8.12.2 decompress.js 解构 node:zlib.createZstdDecompress(node22.13 无)→undefined.bind TypeError",
}

SPEC_D = {
    "D8-9":  "sanitizeValue 未脱敏 AK/SK/token 敏感值（契约漂移）",
    "D9-9":  "capabilities.cancellation 未声明（契约漂移）",
    "D10-4": "规则库由 16 条(9deny+7warn) 增至 19 条(9deny+10warn)，用例断言漂移",
}

BLOCKED_D = {
    "D2-10": "【补环境】R7 current 档跟随需 KooCLI 多 profile 夹具（current=deploy 切换）",
    "D2-13": "【补环境】R9 configuredBySession 优先 env 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库）",
    "D4-12": "【补环境】供应链安装期安全需 npm 安装期抓包/SBOM 审计通道",
    "D4-24": "【补环境】确认令牌过期/重复确认边界需审批流 + 可注入时钟",
    "D9-6":  "【调归属】跨客户端互通需多客户端并存环境（单机仅 Hermes）",
    "D3-C3": "【补环境】沙箱服务维护中（HDKIT_SANDBOX_MAINTENANCE: 沙箱功能正在升级优化），sandbox_connect/deploy_nginx 全链路不可达；解除条件=华为云沙箱维护完成",
    "D3-C6": "【补环境】沙箱服务维护中（HDKIT_SANDBOX_MAINTENANCE），check_user/connect/credentials/exec_one_shot/close_session 7 隐式工具均不可用；解除条件=华为云沙箱维护完成",
    "D3-S3": "【补环境】沙箱服务维护中（HDKIT_SANDBOX_MAINTENANCE），check_user 无法返回 realnameVerified/agreementSigned，沙箱预览 URL 场景不可验证；解除条件=华为云沙箱维护完成",
}

NOTRUN_D = {
    "D1-39": "【调归属】Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；Linux 侧由 EXP-NR3-10(disttags 探针)代表覆盖",
    "D8-1":  "【改用例】文档与能力一致需白盒 docs 全量比对，本轮未覆盖",
    "D8-4":  "【改用例】引导步骤可机械执行需逐条核验 getting-started 步骤，本轮未覆盖",
    "D8-6":  "【改用例】中英文文档一致需中英双源逐段比对，本轮未覆盖",
}

DESIGN = {}
for c in PASS_D:
    DESIGN[c] = ("PASS", f"evidence/{c}", "")
# 真云/审批流用例共用 realcloud-probe 证据（单条 stdout.txt 覆盖 D2-1/D3-C4/D4-14/D4-18/19/20）
for c in ["D2-1", "D3-C4", "D4-14", "D4-18", "D4-19", "D4-20"]:
    DESIGN[c] = ("PASS", "evidence/realcloud-probe", "")
for c, br in FAIL_D.items():
    DESIGN[c] = ("FAIL", f"evidence/{c}", "")
for c, br in SPEC_D.items():
    DESIGN[c] = ("SPEC-MISMATCH", f"evidence/{c}", "")
for c, br in BLOCKED_D.items():
    ev = f"evidence/{c}" if os.path.isdir(os.path.join(EVID, c)) else ""
    DESIGN[c] = ("BLOCKED", ev, br)
for c, br in NOTRUN_D.items():
    DESIGN[c] = ("NOT_RUN", "", br)

EXPANDED = {}
EXPANDED["EXP-D5-8-1"] = ("PASS", "evidence/D5-1", "")
EXPANDED["EXP-D5-8-3"] = ("PASS", "evidence/D5-3", "")
for i in range(1, 23):
    EXPANDED[f"EXP-C4-{i:02d}"] = ("PASS", "evidence/realcloud-probe", "")
for c in ["EXP-E02","EXP-E03","EXP-E04","EXP-E05","EXP-E06","EXP-E07","EXP-E09","EXP-E10","EXP-E11","EXP-E12","EXP-E13","EXP-E14","EXP-E15"]:
    EXPANDED[c] = ("PASS", "evidence/D10-3", "")
EXPANDED["EXP-E08"] = ("PASS", "evidence/EXP-E08", "")
EXPANDED["EXP-E01"] = ("FAIL", "evidence/D10-3", "")
EXPANDED["EXP-NR3-02"] = ("PASS", "evidence/D1-27", "")
EXPANDED["EXP-NR3-04"] = ("PASS", "evidence/D1-42", "")
EXPANDED["EXP-NR3-10"] = ("PASS", "evidence/EXP-NR3-10", "")
EXPANDED["EXP-NR3-24"] = ("PASS", "evidence/D1-45", "")

def rewrite(path, mapping, id_col="ID"):
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    for r in rows:
        cid = (r.get(id_col) or "").strip()
        if cid in mapping:
            st, ev, br = mapping[cid]
            r["执行状态"] = st
            r["执行时间"] = TS if st != "NOT_RUN" else ""
            r["evidencePath"] = ev
            if "blockedReason" in fields:
                r["blockedReason"] = br if st in ("BLOCKED", "NOT_RUN") else ""
        else:
            r["执行状态"] = "NOT_RUN"
            r["执行时间"] = ""
            r["evidencePath"] = ""
            if "blockedReason" in fields:
                r["blockedReason"] = "本轮未覆盖（映射缺失）"
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)
    return rows

drows = rewrite(os.path.join(BASE, "用例矩阵-设计级.csv"), DESIGN)
erows = rewrite(os.path.join(BASE, "用例矩阵-展开级.csv"), EXPANDED)

tpath = os.path.join(BASE, "需求-设计-证据追踪表.csv")
with open(tpath, encoding="utf-8-sig") as f:
    trows = list(csv.DictReader(f))
tfields = list(trows[0].keys())
covered = set(DESIGN.keys()) | set(EXPANDED.keys())
n = 0
for r in trows:
    cid = (r.get("designCaseId") or "").strip()
    ecid = (r.get("expandedCaseId") or "").strip()
    if (cid in DESIGN) or (ecid in EXPANDED):
        r["执行时间"] = TS; n += 1
with open(tpath, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=tfields); w.writeheader(); w.writerows(trows)

# ===== 使命清单回填（mission-001：D4 安全域 9 用例，状态取自 DESIGN 映射）=====
import glob
for m_path in glob.glob(os.path.join(BASE, "使命-*.csv")):
    with open(m_path, encoding="utf-8-sig") as f:
        mrows = list(csv.DictReader(f))
    mfields = list(mrows[0].keys())
    for r in mrows:
        cid = (r.get("ID") or "").strip()
        if cid in DESIGN:
            st, ev, br = DESIGN[cid]
            r["执行状态"] = st
            r["执行时间"] = TS if st != "NOT_RUN" else ""
            r["evidencePath"] = ev
            if "blockedReason" in mfields:
                r["blockedReason"] = br if st in ("BLOCKED", "NOT_RUN") else ""
    with open(m_path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=mfields); w.writeheader(); w.writerows(mrows)
    print(f"使命清单 {os.path.basename(m_path)} {len(mrows)} 行已回填")

c1 = Counter((x.get("执行状态") or "").strip() for x in drows)
c2 = Counter((x.get("执行状态") or "").strip() for x in erows)
print(f"\n时间戳: {TS}")
print(f"设计级 {len(drows)} 行: {dict(c1)}")
print(f"展开级 {len(erows)} 行: {dict(c2)}")
print(f"追踪表 {len(trows)} 行, 回填执行时间 {n} 行")
missing_d = [r["ID"] for r in drows if not (r.get("执行状态") or "").strip()]
print("设计级缺失状态行:", missing_d)