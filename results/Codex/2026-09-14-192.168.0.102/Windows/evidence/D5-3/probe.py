# -*- coding: utf-8 -*-
"""D5-3 工具枚举：dev tools.mjs 工具清单 vs Hermes MCP 实际暴露（基于本会话工具定义）"""
import re
import json

TOOLS_MJS = r"C:\Users\Administrator\devkit-test\hdk\plugins\huaweicloud-core\src\tools.mjs"

# Hermes 本会话暴露的 huaweicloud_devkit MCP 工具（来自工具注册清单，去前缀对比）
HERMES_TOOLS = [
    "auth_confirm", "auth_init", "auth_status", "auth_switch", "auth_sync",
    "check_cli", "detect_framework", "explain_error", "get_regional_availability",
    "get_service_icon", "hook_check_artifacts", "hook_check_command",
    "hook_check_deploy_plan", "list_operations", "list_regions",
    "plan_cli_command", "retrieve_skill", "run_approved_command",
    "run_readonly_command", "sandbox_check_user", "sandbox_close_session",
    "sandbox_connect", "sandbox_credentials", "sandbox_deploy_check",
    "sandbox_deploy_nginx", "sandbox_exec_one_shot", "sandbox_exec_with_session",
    "sandbox_sign_agreement", "sandbox_upload_file", "sandbox_upload_project",
    "search_docs", "search_marketplace", "service_catalog", "setup_obs_config",
    "show_profile_redacted", "voucher_claim", "voucher_status",
]

text = open(TOOLS_MJS, encoding="utf-8").read()

# 提取工具名：匹配 name: 'xxx'（工具定义块内），去除 huaweicloud_ 前缀后与 Hermes 对比
names = re.findall(r"\bname:\s*['\"]([a-z_0-9]+)['\"]", text)
seen = set()
tools_mjs = []
for n in names:
    if n not in seen:
        seen.add(n)
        tools_mjs.append(n.replace("huaweicloud_", ""))

print(f"tools.mjs 提取工具数(去重, 去前缀): {len(tools_mjs)}")
print("tools.mjs 工具名:", tools_mjs)
print()
print(f"Hermes 暴露工具数: {len(HERMES_TOOLS)}")

s_tools = set(tools_mjs)
s_hermes = set(HERMES_TOOLS)

only_src = sorted(s_tools - s_hermes)
only_hermes = sorted(s_hermes - s_tools)
print()
print(f"[差异] tools.mjs 有而 Hermes 无 ({len(only_src)}): {only_src}")
print(f"[差异] Hermes 有而 tools.mjs 无 ({len(only_hermes)}): {only_hermes}")

# D10-1 相关：schema 完整性粗检（description 字段存在性）
desc_missing = [n for n in tools_mjs if f"name: '{n}'" in text and not re.search(
    rf"name:\s*'{re.escape(n)}'(.{{0,400}}?)description:", text, re.S)]
print(f"\n[粗检] 定义后 400 字符内无 description 的工具: {desc_missing or '无'}")

print()
print("结论: ", "工具清单与 Hermes 暴露一致" if not only_src and not only_hermes else "存在差异，需人工核对（可能的版本差/隐藏工具）")