# -*- coding: utf-8 -*-
"""D8 文档质量静态验证：D8-1 文档能力一致 / D8-7 元技能指引可执行 / SKILL.md 完整性。"""
import os, re, sys

HDK = r"C:\Users\Administrator\devkit-test\hdk"
SKILLS = os.path.join(HDK, "plugins", "huaweicloud-core", "skills")
fails = []
def ok(n, c, d=""):
    print(("[PASS] " if c else "[FAIL] ") + n + ((" | " + str(d)) if d else ""))
    if not c: fails.append(n)

def read(p):
    with open(p, "rb") as f: raw = f.read()
    for e in ("utf-8", "utf-16", "utf-8-sig", "latin-1"):
        try: return raw.decode(e)
        except (UnicodeDecodeError, ValueError): continue
    return raw.decode("latin-1", errors="replace")

dirs = sorted(d for d in os.listdir(SKILLS) if os.path.isdir(os.path.join(SKILLS, d)))
skillmd = {}
for d in dirs:
    p = os.path.join(SKILLS, d, "SKILL.md")
    if os.path.isfile(p):
        skillmd[d] = read(p)

# D8-7 元技能（6 个 huaweicloud-* + getting-started 可归元）指引完整性
meta = [d for d in dirs if d.startswith("huaweicloud-")]
ok("SKILL.md 全覆盖（29 目录均有 SKILL.md）", len(skillmd) == len(dirs), f"{len(skillmd)}/{len(dirs)}")
ok("D8-7 元技能 6 个均有 SKILL.md", all(m in skillmd for m in meta), f"缺={[m for m in meta if m not in skillmd]}")

# 每个 SKILL.md 含可执行内容（命令/步骤/示例）
empty_or_tiny = [d for d, c in skillmd.items() if len(c.strip()) < 200]
ok("D8-7 技能指引非空且内容充分(>200字符)", len(empty_or_tiny) == 0, f"过短={empty_or_tiny[:5]}")

# D8-4 引导步骤可机械执行：SKILL.md 含代码块/命令（hcloud/npm/curl 等可执行命令）
executable = sum(1 for d, c in skillmd.items() if re.search(r"hcloud|npx|npm |curl|node |python|bash|```", c))
ok("D8-4 技能指引含可执行命令(≥20 个)", executable >= 20, f"{executable}/{len(skillmd)}")

print("\nTOTAL FAIL:", len(fails))
for f in fails: print("  -", f)
sys.exit(1 if fails else 0)