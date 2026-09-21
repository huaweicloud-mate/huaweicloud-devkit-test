#!/usr/bin/env python3
# D4-25 Python hook 事件遥测分类探针 (2026-09-20 Hermes/Linux)
import importlib.util, json, os, tempfile
from pathlib import Path

HOOK = os.path.expanduser('~/devkit-test/Hermes/hdk/plugins/huaweicloud-core/hooks/huaweicloud-safety.py')
spec = importlib.util.spec_from_file_location('hs', HOOK)
hs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hs)
tmp = tempfile.mkdtemp()
hs.TELEMETRY_DIR = Path(tmp)
hs.HOOK_EVENTS_PATH = hs.TELEMETRY_DIR / 'hook-events.jsonl'

cases = [
    ('read-list',   'hcloud ECS ListServersDetails --cli-region=cn-north-4', 'cli:read'),
    ('read-show',   'hcloud VPC ShowVpc --vpc_id=x',                          'cli:read'),
    ('write-delete','hcloud ECS DeleteServers --servers.1.id=x',              'cli:write'),
    ('write-create','hcloud VPC CreateVpc --vpc.name=t',                      'cli:write'),
    ('invoke-other','hcloud help',                                            'cli:invoke'),
]
results = []
for name, cmd, expect in cases:
    hs.record_cli_event(cmd)
events = [json.loads(l) for l in hs.HOOK_EVENTS_PATH.read_text().splitlines() if l.strip()] if hs.HOOK_EVENTS_PATH.exists() else []
for (name, cmd, expect), ev in zip(cases, events):
    got = ev['key']
    results.append({'name': name, 'cmd': cmd, 'expect': expect, 'got': got,
                    'pass': got == expect, 'value': ev['value']})
print(json.dumps({'cases': len(cases), 'results': results}, ensure_ascii=False, indent=2))