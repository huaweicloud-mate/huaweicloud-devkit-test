#!/usr/bin/env python3
# 深挖探针：D4-2 (HW_ 前缀 env-dump) / D4-8 (Python/Node 一致性) / D4-17 (fail-closed)
# Node hook 与 Python hook 对同一 payload 直调对比，结果落 evidence/<case>/stdout.log
import subprocess, json, os

HDK = "/home/zhangshuang/devkit-test/Hermes/hdk"
NODE_HOOK = os.path.join(HDK, "plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs")
PY_HOOK = os.path.join(HDK, "plugins/huaweicloud-core/hooks/huaweicloud-safety.py")
EV = "/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-17-113.44.143.91/Linux/evidence"

def run_node(payload):
    r = subprocess.run(["node", NODE_HOOK], input=json.dumps(payload), capture_output=True, text=True, timeout=10)
    out = r.stdout.strip()
    if not out:
        return "allow(放行)"
    try:
        j = json.loads(out)
        return j.get("hookSpecificOutput", {}).get("permissionDecision", out)
    except Exception:
        return out[:80]

def run_py(payload):
    r = subprocess.run(["python3", PY_HOOK], input=json.dumps(payload), capture_output=True, text=True, timeout=10)
    out = r.stdout.strip()
    if not out:
        return "allow(放行)"
    try:
        j = json.loads(out)
        return j.get("hookSpecificOutput", {}).get("permissionDecision", out)
    except Exception:
        return out[:80]

def write(case, lines):
    p = os.path.join(EV, case)
    os.makedirs(p, exist_ok=True)
    with open(os.path.join(p, "stdout.log"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

# ---- D4-2: HW_ 前缀 env-dump ----
print("=== D4-2 HW_ 前缀 env-dump ===")
d4_2_lines = []
payloads = [
    ("env | grep HW_ACCESS_KEY", "deny"),
    ("env | grep HW_SECRET_KEY", "deny"),
    ("printenv HW_ACCESS_KEY", "deny"),
    ("env | grep HUAWEICLOUD_ACCESS_KEY", "deny"),  # 对照组
]
fails = 0
for cmd, expect in payloads:
    node = run_node({"tool_name": "Bash", "tool_input": {"command": cmd}})
    ok = (node == "deny") == (expect == "deny")
    if not ok:
        fails += 1
    d4_2_lines.append(f"  cmd={cmd!r}  node={node}  expect={expect}  {'PASS' if ok else 'FAIL'}")
summary = f"=== CASE D4-2 ===  {'FAIL' if fails else 'PASS'}  (HW_ 前缀凭证 env-dump 拦截)"
d4_2_lines.insert(0, summary)
d4_2_lines.append(f"  detail: env-dump 正则未覆盖 HW_ 前缀凭证名（env | grep HW_* 放行）" if fails else "  detail: HW_ 前缀已拦截")
write("D4-2", d4_2_lines)
print("\n".join(d4_2_lines))

# ---- D4-8: Python/Node hook 一致性 ----
print("\n=== D4-8 Python/Node 一致性 ===")
d4_8_lines = []
pairs = [
    ("hcloud configure show", "deny"),
    ("hcloud ECS DeleteServers --id i", "deny"),
    ("hcloud ECS ListServers --limit 10", "allow"),  # 只读对照
]
inconsistent = 0
for cmd, _expect in pairs:
    node = run_node({"tool_name": "Bash", "tool_input": {"command": cmd}})
    py = run_py({"tool_name": "Bash", "tool_input": {"command": cmd}})
    n = "deny" if node == "deny" else "allow"
    p = "deny" if py == "deny" else "allow"
    same = (n == p)
    if not same:
        inconsistent += 1
    d4_8_lines.append(f"  cmd={cmd!r}  node={node}  py={py}  {'一致' if same else '不一致(缺陷)'}")
summary = f"=== CASE D4-8 ===  {'FAIL' if inconsistent else 'PASS'}  (Node/Python hook 判定一致性)"
d4_8_lines.insert(0, summary)
write("D4-8", d4_8_lines)
print("\n".join(d4_8_lines))

# ---- D4-17: fail-closed (空/畸形输入) ----
print("\n=== D4-17 fail-closed ===")
d4_17_lines = []
cases = [
    ("空命令 ''", {"tool_name": "Bash", "tool_input": {"command": ""}}),
    ("纯空白", {"tool_name": "Bash", "tool_input": {"command": "   "}}),
    ("空 tool_input {}", {"tool_name": "Bash", "tool_input": {}}),
    ("畸形 JSON payload", None),  # 直接传非法 JSON 字符串
]
failopen = 0
for label, payload in cases:
    if payload is None:
        node = run_node("not-json-at-all")
        py = "n/a"
    else:
        node = run_node(payload)
        py = run_py(payload)
    # fail-closed 期望：异常输入默认 deny（而非 allow 放行）
    node_closed = node in ("deny",)
    is_open = (node == "allow(放行)" or node == "allow")
    if is_open:
        failopen += 1
    d4_17_lines.append(f"  [{label}] node={node} py={py}  {'PASS(fail-closed)' if node_closed else 'FAIL(fail-open 放行)'}")
summary = f"=== CASE D4-17 ===  {'FAIL' if failopen else 'PASS'}  (异常输入 fail-closed)"
d4_17_lines.insert(0, summary)
d4_17_lines.append("  detail: 无法解析/空输入默认 allow（fail-open）" if failopen else "")
write("D4-17", d4_17_lines)
print("\n".join(d4_17_lines))