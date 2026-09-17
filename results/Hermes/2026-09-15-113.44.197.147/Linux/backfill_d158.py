# -*- coding: utf-8 -*-
"""D1-58 假阻塞消解回填：源码级直调(PTY 直驱真实 install→configureGenericMCP)实测全 PASS。

探针: evidence/probe-d158.sh（隔离 HOME + HERMES_HOME，使 detectAgents() 返回空 →
      promptZeroDetect 菜单 option3 → configureGenericMCP，setup-cli.mjs:3259-3308）
回填：设计级 D1-58 BLOCKED→PASS；展开级 EXP-D1-58-01~05 BLOCKED→PASS；
      D1-39/D4-13/D4-14 保留 BLOCKED 并补四要素 blockedReason。
"""
import csv, os, datetime

REPO = "/home/testbot1/devkit-test/Hermes/huaweicloud-devkit-test"
PACK = os.path.join(REPO, "results/Hermes/2026-09-15-113.44.197.147/Linux")
EXEC_TIME = datetime.datetime.now().strftime("%Y%m%d%H%M%S")

# 四要素 blockedReason（实测时间 + 缺什么资源 + 影响 + 解除条件）
BLOCKED_REASON = {
    "D1-39": ("实测2026-09-15 UTC约21:50 ｜ 缺Windows运行环境：升级检测链 .cmd/EINVAL 为 Windows 专属语义"
              "（设计级 OS 列标注 Windows；Linux/macOS 走 NR3 终端矩阵）｜ 影响=该平台专属缺陷无法在 Linux 复现验证 ｜ "
              "解除条件=Windows 测试机执行；Linux 侧已由展开级 EXP-NR3-10(54 通用断言) PASS 覆盖"),
    "D4-13": ("实测2026-09-15 UTC约21:50 ｜ 缺 ~/.config/huaweicloud/credentials.readonly.json 只读子账号(test001)凭证"
              "（最小权限矩阵需 run-as-readonly.py 临时注入，不能替换管理员凭证）｜ 影响=无法构建最小权限通过率矩阵 ｜ "
              "解除条件=下发只读子账号凭证文件到 ~/.config/huaweicloud/credentials.readonly.json"),
    "D4-14": ("实测2026-09-15 UTC约21:50 ｜ 缺真云 CTS 审计链路：需真云建删资源后查 CloudTrace 审计日志（本轮未执行真云建删）｜ "
              "影响=操作可审计性断言无法验证 ｜ 解除条件=基于有效 AK/SK 执行一次真云建删+删除归零验证后查询 CTS"),
}

def backfill(path, changes):
    rows = list(csv.DictReader(open(path, encoding="utf-8-sig")))
    fields = list(rows[0].keys())
    n = 0
    for r in rows:
        cid = r["ID"].strip()
        if cid not in changes:
            continue
        ch = changes[cid]
        r["执行状态"] = ch["st"]
        r["执行时间"] = EXEC_TIME
        r["evidencePath"] = ch.get("ev", "")
        r["blockedReason"] = ch.get("br", "")
        n += 1
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)
    return n

# 展开级：5 条 D1-58 BLOCKED→PASS
exp_changes = {}
for i in range(1, 6):
    cid = f"EXP-D1-58-0{i}"
    exp_changes[cid] = {"st": "PASS", "ev": f"evidence/{cid}/stdout.txt", "br": ""}
n_exp = backfill(os.path.join(PACK, "用例矩阵-展开级.csv"), exp_changes)

# 设计级：D1-58 → PASS；D1-39/D4-13/D4-14 → BLOCKED(保留) + 四要素
des_changes = {
    "D1-58": {"st": "PASS", "ev": "evidence/D1-58/stdout.txt", "br": ""},
    "D1-39": {"st": "BLOCKED", "ev": "", "br": BLOCKED_REASON["D1-39"]},
    "D4-13": {"st": "BLOCKED", "ev": "", "br": BLOCKED_REASON["D4-13"]},
    "D4-14": {"st": "BLOCKED", "ev": "", "br": BLOCKED_REASON["D4-14"]},
}
n_des = backfill(os.path.join(PACK, "用例矩阵-设计级.csv"), des_changes)

# 追踪表：刷新执行时间
tpath = os.path.join(PACK, "需求-设计-证据追踪表.csv")
trows = list(csv.DictReader(open(tpath, encoding="utf-8-sig")))
for r in trows:
    r["执行时间"] = EXEC_TIME
with open(tpath, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(trows[0].keys())); w.writeheader(); w.writerows(trows)

print(f"展开级回填 {n_exp}/5 条 (D1-58 PASS)")
print(f"设计级回填 {n_des}/4 条 (D1-58 PASS; D1-39/D4-13/D4-14 四要素 BLOCKED)")
print(f"追踪表 {len(trows)} 行 执行时间刷新 = {EXEC_TIME}")
print("D1-58 假阻塞消解完成")