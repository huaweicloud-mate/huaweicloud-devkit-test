# -*- coding: utf-8 -*-
"""Mission 摄入器：把 AI Test Manager 生成的 mission（YAML）解析成可执行清单。

对齐 test-ai-orchestration-architecture.md §四 missions/*.yaml 格式：
    apiVersion / kind / metadata{id,domain,priority,estimatedDuration} /
    spec{scope, affectedTools, affectedCases[], constraints, qualityCriteria}

职责（纯函数，无 IO 副作用）：
    parse_mission(text)             -> dict（YAML 最小子集解析，仅支持本仓库生成格式）
    filter_mission_for(client, os?) -> 是否本客户端相关（按 affectedTools 归属维度推断，兜底全下发）
    merge_mission(rows, mission)    -> 在用例矩阵行上打标（mission + missionPriority 两列）
    to_mission_csv(rows, mission)   -> 生成使命清单 CSV 行（追加执行态空列，与 init_day 一致）

用法:
    from mission_ingest import parse_mission, merge_mission, to_mission_csv
    (由 init_day.py 调用；本模块也可独立运行 python scripts/mission_ingest.py <file> 打印解析结果)
"""
import os
import re
import sys

MISSION_COL = "mission"
MISSION_PRIORITY_COL = "missionPriority"
EXEC_COLS = ["执行状态", "执行时间", "evidencePath", "blockedReason"]

# 用例 ID 形如 D1-1 / D3-C10 / EXP-E01 / D3-S1（设计级与展开级通用）
_CASE_ID_RE = re.compile(r"\b(?:D\d+-[A-Z]?\d+[A-Z0-9]*|EXP-[A-Z]+\d+)\b", re.I)


def _strip_csv_quotes(s):
    s = s.strip()
    if len(s) >= 2 and s[0] == s[-1] and s[0] in ("'", '"'):
        return s[1:-1]
    return s


def _parse_scalar(line):
    """'key: value' -> value（去掉引号/行尾注释）。"""
    _, _, val = line.partition(":")
    val = val.split("#")[0].strip()
    return _strip_csv_quotes(val)


def parse_mission(text):
    """解析单条 mission YAML -> dict。

    只支持本仓库 run-plan.mjs 生成的固定结构；含受控宽松（缺可选字段给默认值）以保证
    FAIL 不致于让整个摄入流程崩掉。缺 id/affectedCases 视为非法返回 None。
    """
    lines = text.splitlines()
    mission = {}
    cases = []
    tools = []
    constraints = []
    criteria = []
    in_section = None
    for raw in lines:
        line = raw.rstrip()
        # YAML 列表项（- item）
        m_list = re.match(r"^\s*-\s+(.*)$", line)
        if m_list:
            item = _strip_csv_quotes(m_list.group(1).strip())
            if in_section == "affectedCases":
                cases.append(item)
            elif in_section == "affectedTools":
                tools.append(item)
            elif in_section == "constraints":
                constraints.append(item)
            elif in_section == "qualityCriteria":
                criteria.append(item)
            continue
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if stripped == "affectedCases:":
            in_section = "affectedCases"; continue
        if stripped == "affectedTools:":
            in_section = "affectedTools"; continue
        if stripped == "constraints:":
            in_section = "constraints"; continue
        if stripped == "qualityCriteria:":
            in_section = "qualityCriteria"; continue
        if re.match(r"^(scope|spec|metadata|apiVersion|kind)\s*[:|]\s*$", stripped):
            in_section = None
            continue
        # 普通 key: value（metadata 或顶层）
        if re.match(r"^\s*[A-Za-z][A-Za-z0-9]*\s*:", line):
            key = line.split(":", 1)[0].strip()
            in_section = None
            val = _parse_scalar(line)
            mission[key] = val
    mission["affectedCases"] = cases
    mission["affectedTools"] = tools
    mission["constraints"] = constraints
    mission["qualityCriteria"] = criteria
    if not mission.get("id") or not cases:
        return None
    mission.setdefault("domain", mission.get("id"))
    mission.setdefault("priority", "P2")
    return mission


def load_missions_dirs(missions_dirs):
    """读多个目录（或单文件）下的所有 *.yaml mission。返回 ([mission], [errors])。"""
    found = []
    errors = []
    paths = []
    for d in missions_dirs:
        if os.path.isfile(d) and d.endswith((".yaml", ".yml")):
            paths.append(d)
        elif os.path.isdir(d):
            for name in sorted(os.listdir(d)):
                if name.endswith((".yaml", ".yml")):
                    paths.append(os.path.join(d, name))
    for p in paths:
        try:
            with open(p, encoding="utf-8") as f:
                m = parse_mission(f.read())
            if m:
                found.append(m)
        except Exception as e:  # noqa: BLE001
            errors.append(f"{p}: {e}")
    return found, errors


# MCP 工具/模块 → 客户端归属（供使命按客户端相关性预筛；空映射 = 通用使命全下发）。
# 依据 docs/01-测试规划.md §2.6：D5/hook 载体相关客户端差异大，安全/D3 主流程与客户端弱相关。
_TOOL_CLIENT_HINTS = {
    "hook_check_command": "Hermes",
    "config_backup": "Hermes",
    "auth_sync": "Hermes",
}


def filter_mission_for(mission, client):
    """使命是否与本客户端相关。默认 True；命中已知客户端专属工具时仅该客户端 True。"""
    if not mission.get("affectedTools"):
        return True
    for t in mission["affectedTools"]:
        hint = _TOOL_CLIENT_HINTS.get(t)
        if hint and hint != client:
            return False
    return True


def merge_mission(rows, mission):
    """在用例矩阵行（list[dict]）上打标：命中 affectedCases 的行加 mission 两列。

    返回新行列表（不就地改原列表）。列的键名由调用方确保 header 包含这两列。
    """
    target = set(mission.get("affectedCases", []))
    if not target:
        return rows
    new_rows = []
    for r in rows:
        r = dict(r)
        cid = (r.get("ID") or "").strip()
        if cid in target:
            r[MISSION_COL] = mission.get("id", "")
            r[MISSION_PRIORITY_COL] = mission.get("priority", "")
        new_rows.append(r)
    return new_rows


def to_mission_csv(rows, mission):
    """生成使命清单 CSV 行：仅含本使命命中行，追加执行态空列（复用 init_day 约定）。"""
    target = set(mission.get("affectedCases", []))
    out_headers = []
    all_headers = set()
    out = []
    for r in rows:
        cid = (r.get("ID") or "").strip()
        if cid in target:
            row = dict(r)
            row[MISSION_COL] = mission.get("id", "")
            row[MISSION_PRIORITY_COL] = mission.get("priority", "")
            for c in EXEC_COLS:
                row.setdefault(c, "")
            out.append(row)
            all_headers.update(row.keys())
    if out:
        ordered = ["ID"] + sorted(all_headers - {"ID"})
        out_headers = ordered
    return out_headers, out


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python scripts/mission_ingest.py <mission.yaml>")
        sys.exit(2)
    with open(sys.argv[1], encoding="utf-8") as f:
        m = parse_mission(f.read())
    if not m:
        print("[FAIL] 非法 mission（缺 id 或 affectedCases）")
        sys.exit(1)
    print("mission:", m.get("id"), "| domain:", m.get("domain"), "| priority:", m.get("priority"))
    print("cases:", ", ".join(m.get("affectedCases", [])) or "(空)")
    print("tools:", ", ".join(m.get("affectedTools", [])) or "(空)")