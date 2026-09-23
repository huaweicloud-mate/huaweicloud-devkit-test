#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# D4-25 Python hook 事件遥测分类 (cli:read/cli:write/cli:invoke)
# 直接 import 被测 hook 模块, patch TELEMETRY_DIR 到临时目录, 逐条 record_cli_event 后核对分类。
import importlib.util, sys, json, tempfile, os
from pathlib import Path

HDK = os.environ.get('HDK_PLUGIN_SRC', '/home/zhangshuang/multica_workspaces/092aa561-f81a-4371-a2a4-8988c3df7bc9/01a0cbc6/workdir/hdk/plugins/huaweicloud-core')
EVID = os.environ.get('EVID_DIR', '.')
PY_HOOK = os.path.join(HDK, 'hooks', 'huaweicloud-safety.py')

spec = importlib.util.spec_from_file_location('hdk_safety_hook', PY_HOOK)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

# patch TELEMETRY_DIR / HOOK_EVENTS_PATH to temp (avoid polluting source repo)
tmp = tempfile.mkdtemp(prefix='hdk-hook-events-')
mod.TELEMETRY_DIR = Path(tmp) / 'telemetry'
mod.HOOK_EVENTS_PATH = mod.TELEMETRY_DIR / 'hook-events.jsonl'

cases = [
    ('hcloud ecs ListServersDetails --limit 10', 'read', 'cli:read'),
    ('hcloud ecs DeleteServer --id i-123', 'write', 'cli:write'),
    ('hcloud configure show', 'other', 'cli:invoke'),
    ('hcloud ecs CreateServer --flavor s6.small.1', 'write', 'cli:write'),
]

results = []
for text, label, expected in cases:
    mod.record_cli_event(text)
    entries = []
    if mod.HOOK_EVENTS_PATH.exists():
        entries = [json.loads(l) for l in mod.HOOK_EVENTS_PATH.read_text().splitlines() if l.strip()]
    got = entries[-1]['key'] if entries else '(none)'
    ok = got == expected
    results.append((text, label, expected, got, ok))

out = []
out.append('=== D4-25 Python hook 事件遥测分类 ===')
for text, label, expected, got, ok in results:
    out.append(f'{text!r:45s} 期望={expected:10s} 实际={got:12s} {"PASS" if ok else "FAIL<<<"}')
out.append('')
out.append('源码: hooks/huaweicloud-safety.py record_cli_event():')
out.append('  READ_OPERATION_RE = \\b(List|Show|Get|Describe|NovaList|NovaShow)\\w*')
out.append('  WRITE_OPERATION_RE = (^|[A-Za-z0-9])(Create|Delete|Update|...)\\w*  (要求写前缀前有字母/数字/行首)')
out.append('')
# 判定整体
write_mis = [r for r in results if r[1]=='write' and not r[4]]
overall = 'PASS' if all(r[4] for r in results) else ('FAIL' if write_mis else 'PARTIAL')
out.append(f'结论: 写操作删除类若落 cli:invoke 即 FAIL ({"发现 "+str(len(write_mis))+" 条写操作误分类" if write_mis else "无写操作误分类"})')
out.append(f'RESULT: {overall}')

body = '\n'.join(out)
os.makedirs(os.path.join(EVID, 'D4-25'), exist_ok=True)
with open(os.path.join(EVID, 'D4-25', 'stdout.txt'), 'w', encoding='utf-8') as f:
    f.write(body)
print(body)
# cleanup temp
import shutil
shutil.rmtree(tmp, ignore_errors=True)