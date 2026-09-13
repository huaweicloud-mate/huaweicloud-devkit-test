# -*- coding: utf-8 -*-
"""D5 静态验证：清单发现加载(D5-1)/工具全量枚举(D5-3)/服务矩阵双向对齐(D5-8)。ad-hoc 脚本，产出到 evidence。"""
import os, re, sys

HDK = r"C:\Users\Administrator\devkit-test\hdk"
TOOLS = os.path.join(HDK, "plugins", "huaweicloud-core", "src", "tools.mjs")
SKILLS = os.path.join(HDK, "plugins", "huaweicloud-core", "skills")

def read(p):
    with open(p, "rb") as f: raw = f.read()
    for e in ("utf-8", "utf-16", "utf-8-sig", "latin-1"):
        try: return raw.decode(e)
        except (UnicodeDecodeError, ValueError): continue
    return raw.decode("latin-1", errors="replace")

tools_src = read(TOOLS)
fails = []
def ok(n, c, d=""):
    print(("[PASS] " if c else "[FAIL] ") + n + ((" | " + str(d)) if d else ""))
    if not c: fails.append(n)

# D5-3 工具枚举：TOOL_DEFINITIONS = [ 数组内 name: 'huaweicloud_...' 计数
m = re.search(r"TOOL_DEFINITIONS\s*=\s*\[(.*?)\n\s*\];", tools_src, re.S)
seg = m.group(1) if m else ""
tool_names = re.findall(r"name:\s*'huaweicloud_([a-z0-9_]+)'", seg)
ok("D5-3 工具全量枚举=39(TOOL_DEFINITIONS)", len(tool_names) == 39, f"{len(tool_names)}")

# D5-1 清单发现加载：skills 目录服务技能 + 元技能
dirs = sorted(d for d in os.listdir(SKILLS) if os.path.isdir(os.path.join(SKILLS, d)))
serv = [d for d in dirs if d.startswith("huawei-")]
meta = [d for d in dirs if d.startswith("huaweicloud-")]
ok("D5-1 技能清单发现加载(服务技能23+元技能6=29)", len(serv) == 23 and len(meta) == 6, f"{len(serv)}+{len(meta)}={len(dirs)}")

# D5-8 服务矩阵 routeMap skills ⊆ 目录；目录服务技能 - routeMap = 元技能(getting-started/iac/voucher)
route_skills = set(re.findall(r"skills:\s*\[([^\]]*)\]", tools_src))
route_skill_set = set()
for g in route_skills:
    for s in re.findall(r"'([a-z0-9-]+)'", g):
        route_skill_set.add(s)
only_route = route_skill_set - set(serv)
only_dir = set(serv) - route_skill_set
ok("D5-8 routeMap skills ⊆ 目录(无孤儿映射)", len(only_route) == 0, f"孤儿={only_route}")
ok("D5-8 目录服务技能未路由=元技能(getting-started/iac)", only_dir == {"huawei-getting-started", "huawei-iac"}, f"未路由={only_dir}")

# D5-8 服务矩阵 services 覆盖：每个 routeMap 条目有 services 非空
route_services = re.findall(r"services:\s*\[([^\]]*)\]", tools_src)
ok("D5-8 每个服务映射均有 services 非空", all("'" in s for s in route_services), f"{len(route_services)} 条目")

print("\nTOTAL FAIL:", len(fails))
for f in fails: print("  -", f)
sys.exit(1 if fails else 0)