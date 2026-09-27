#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""2026-09-20 OpenClaw Linux — D4-25 Python hook 事件遥测三态分类 源码级直调探针。
直调 plugins/huaweicloud-core/hooks/huaweicloud-safety.py 的 record_cli_event()，
把 HOOK_EVENTS_PATH 重定向到隔离临时目录，验证 只读→cli:read / 写→cli:write / 其他→cli:invoke 且事件含 key/value/capability。"""
import json, os, sys, tempfile, importlib.util, shutil
from pathlib import Path

HOOK = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/hooks/huaweicloud-safety.py'
PLUGIN_DIR = os.path.dirname(os.path.dirname(HOOK))  # plugins/huaweicloud-core

tmp = tempfile.mkdtemp(prefix='hdk-d4-25-')
iso_plugin = os.path.join(tmp, 'plugins', 'huaweicloud-core')
os.makedirs(iso_plugin, exist_ok=True)
shutil.copy2(HOOK, os.path.join(iso_plugin, 'huaweicloud-safety.py'))
# copy policy + rules so module load works (uses parents[1]/safety)
shutil.copytree(os.path.join(PLUGIN_DIR, 'safety'), os.path.join(iso_plugin, 'safety'))

spec = importlib.util.spec_from_file_location('hwsafety', os.path.join(iso_plugin, 'huaweicloud-safety.py'))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

# redirect HOOK_EVENTS_PATH + its telemetry dir to isolated tmp (module computes PLUGIN_DIR from __file__)
mod.TELEMETRY_DIR = Path(tmp) / 'plugins' / 'huaweicloud-core' / 'telemetry'
mod.TELEMETRY_DIR.mkdir(parents=True, exist_ok=True)
mod.HOOK_EVENTS_PATH = mod.TELEMETRY_DIR / 'hook-events.jsonl'

passn = 0
failn = 0
def check(cid, title, actual, expected):
    global passn, failn
    ok = actual == expected
    passn += ok; failn += (not ok)
    print(f"{'PASS' if ok else 'FAIL'}  {cid}  {title}  => {json.dumps(actual, ensure_ascii=False)} (expected {json.dumps(expected, ensure_ascii=False)})")

# 喂三种 hcloud 命令
mod.record_cli_event("hcloud ECS NovaListServers --cli-region=cn-north-4")
mod.record_cli_event("hcloud VPC CreateSecurityGroup --security_group.name=x")
mod.record_cli_event("hcloud ECS SomeOtherVerb --foo=bar")

with open(mod.HOOK_EVENTS_PATH, encoding='utf-8') as f:
    events = [json.loads(l) for l in f if l.strip()]

keys = [e.get('key') for e in events]
check('D4-25', '只读→cli:read、写→cli:write、其他→cli:invoke', keys, ['cli:read', 'cli:write', 'cli:invoke'])
check('D4-25', '事件含 key 字段(全部)', all('key' in e for e in events), True)
check('D4-25', '事件含 value 字段(全部)', all('value' in e for e in events), True)
check('D4-25', '事件含 capability=cli(全部)', all(e.get('capability') == 'cli' for e in events), True)

shutil.rmtree(tmp, ignore_errors=True)
print(f"\nTOTAL pass={passn} fail={failn}")
sys.exit(1 if failn else 0)