#!/usr/bin/env python3
"""Execute P1+P2 test cases, write evidence per case."""
import json, os, subprocess, time
from pathlib import Path

RESULT = Path(__file__).parent
SRC = RESULT / '..' / '..' / '..' / '..' / '..' / 'hdk' / 'plugins' / 'huaweicloud-core' / 'src'
HOOKS = RESULT / '..' / '..' / '..' / '..' / '..' / 'hdk' / 'plugins' / 'huaweicloud-core' / 'hooks'

def ts():
    return time.strftime('%Y%m%d%H%M%S')

def ev(cid, status, why, sample):
    d = RESULT / 'evidence' / cid
    d.mkdir(parents=True, exist_ok=True)
    s = sample if isinstance(sample, str) else json.dumps(sample, ensure_ascii=False)
    with open(d / 'stdout.log', 'w', encoding='utf-8') as f:
        json.dump({'caseId': cid, 'status': status, 'why': why, 'sample': s[:800], 'executedAt': ts()}, f, ensure_ascii=False, indent=2)
        f.write('\n')
    with open(d / 'probe.mjs', 'w', encoding='utf-8') as f:
        f.write('// probe for ' + cid + '\n')
    print('[' + cid + '] ' + status + ': ' + why)

def rd(p):
    try: return Path(p).read_text(encoding='utf-8')
    except: return ''

def node(code):
    try:
        r = subprocess.run(['node', '-e', code], capture_output=True, text=True, timeout=30)
        return r.stdout + r.stderr
    except Exception as e: return str(e)

def classify(cmd):
    src = str(SRC).replace('\\', '/')
    return node("import('file:///" + src + "/safety-policy.mjs').then(sp=>console.log(JSON.stringify(sp.classifyTextCommand(" + json.dumps(cmd) + ")))).catch(e=>console.error(e.message));")

def jv(s, key):
    try:
        lines = s.strip().split('\n')
        d = json.loads(lines[0])
        return d.get(key, '') if isinstance(d, dict) else ''
    except: return ''

T = rd(SRC / 'tools.mjs')
U = rd(SRC / 'update-check.mjs')
P = rd(SRC / 'mcp-protocol.mjs')
SP = rd(SRC / 'safety-policy.mjs')
RRE = rd(SRC / 'risk-rule-engine.mjs')
HM = rd(HOOKS / 'huaweicloud-safety.mjs')
HP = rd(HOOKS / 'huaweicloud-safety.py')
CR = rd(SRC / 'auth' / 'credentials.mjs')
KP = rd(SRC / 'auth' / 'koocli-profile.mjs')
src = str(SRC).replace('\\', '/')

print('=== P1+P2 Batch Start ===')
src = str(SRC).replace('\\', '/')

# Execute P1+P2 cases
exec(open(Path(__file__).parent / 'cases_p1p2.py', encoding='utf-8').read())
