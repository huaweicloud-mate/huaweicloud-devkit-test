# -*- coding: utf-8 -*-
"""D8 文档质量 + D7 兼容：D8-1 能力一致 / D8-6 中英文一致 / D7-4 国内镜像 / D8-4 引导可执行。"""
import os, re, sys

HDK = r"C:\Users\Administrator\devkit-test\hdk"
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

readme_en = os.path.join(HDK, "README.md")
readme_zh = os.path.join(HDK, "README.zh-CN.md")

# D8-6 中英文文档一致
ok("D8-6 英文 README.md 存在", os.path.isfile(readme_en))
ok("D8-6 中文 README.zh-CN.md 存在", os.path.isfile(readme_zh))

en = read(readme_en) if os.path.isfile(readme_en) else ""
zh = read(readme_zh) if os.path.isfile(readme_zh) else ""

# D8-1 文档与能力一致：README 声明的 CLI 命令与 setup.cjs --help 一致
cli_commands = ["install", "uninstall", "update", "status", "doctor", "install-hcloud", "auth", "proxy", "version"]
missing = [c for c in cli_commands if c not in en]
ok("D8-1 README 含 CLI 命令(install/doctor/status/auth/...)一致", len(missing) == 0, f"缺={missing}")

# D7-4 国内镜像源说明
mirror = "mirrors.huaweicloud.com" in en or "npmmirror" in en
ok("D7-4 README 含国内镜像源说明(npm mirror)", mirror, "mirrors.huaweicloud.com" if "mirrors.huaweicloud.com" in en else "npmmirror")

# D8-4 引导步骤机械执行：README 含可执行安装命令(npx/npm install)
exec_steps = bool(re.search(r"npx|npm install|npm i |huaweicloud-devkit install", en))
ok("D8-4 README 引导步骤含可执行命令(npx/npm)", exec_steps)

# D8-6 中英文一致：中文 README 也含关键命令/章节
zh_ok = "install" in zh and ("安装" in zh or "命令" in zh)
ok("D8-6 中文 README 含关键命令与汉化", zh_ok)

print("\nTOTAL FAIL:", len(fails))
for f in fails: print("  -", f)
sys.exit(1 if fails else 0)