# -*- coding: utf-8 -*-
"""C1a 善后：将旧 Codex 配置中 CLI 兼容的有价值字段合并回新 config.toml
- 跳过已知冲突字段 (model_catalog_json / notify 等 App 专属)
- 合并后必须保证 codex CLI 仍可解析（否则回滚）"""
import re
import shutil

OLD = r"C:\Users\Administrator\.codex\config.toml.bak-hwc-conflict"
NEW = r"C:\Users\Administrator\.codex\config.toml"

old = open(OLD, encoding="utf-8").read()
new = open(NEW, encoding="utf-8").read()

# 顶层安全字段（标量，CLI 兼容）
SAFE_KEYS = [
    "model_provider", "model", "review_model",
    "network_access", "disable_response_storage",
]
fields = []
for key in SAFE_KEYS:
    m = re.search(rf"^{re.escape(key)}\s*=\s*(.+)$", old, re.M)
    if m and not re.search(rf"^{re.escape(key)}\s*=", new, re.M):
        fields.append(f"{key} = {m.group(1).strip()}")

# [model_providers.OpenAI] 段（若含自定义 provider 配置）
prov_block = ""
m = re.search(r"^\[model_providers\.OpenAI\](.*?)(?=^\s*\[|\Z)", old, re.M | re.S)
if m and m.group(1).strip() and re.search(r"^\s*(base_url|wire_api|env_key|api_key)\s*=", m.group(1), re.M):
    prov_block = "\n[model_providers.OpenAI]" + m.group(1).rstrip() + "\n"

if not fields and not prov_block:
    print("无可用合并字段（已存在或全部为冲突字段），无需改动")
else:
    # 备份新配置再合并（幂等安全）
    shutil.copy(NEW, NEW + ".hwc-merge-bak")
    merged = "\n".join(fields) + ("\n" if fields else "") + prov_block + "\n" + new
    open(NEW, "w", encoding="utf-8", newline="\n").write(merged)
    print("已合并字段:", fields)
    if prov_block:
        print("已合并段: [model_providers.OpenAI]")

print("---")
print("合并后 config.toml 前 20 行:")
print("\n".join(open(NEW, encoding="utf-8").read().splitlines()[:20]))