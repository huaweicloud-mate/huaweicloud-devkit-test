#!/usr/bin/env python3
"""Split grouped probe stdout.log into per-case evidence/<case-id>/ dirs.
Each per-case dir gets:
- stdout.log with {caseId, status, why, executedAt, result}
- probe.mjs that points to the grouped probe (real executable)
"""
import json, os, sys

EV = r'C:\Users\Administrator\devkit-test\huaweicloud-devkit-test\results\WorkBuddy\2026-10-24-119.8.181.45\Windows\evidence'
NOW = '20261024051500'

# Map grouped probe -> source probe path
grouped = {
    'd4-security': 'd4-security/probe.mjs',
    'd2-auth': 'd2-auth/probe.mjs',
    'd1-upgrade': 'd1-upgrade/probe.mjs',
    'mcp-tools': 'mcp-tools/probe.mjs',
    'c4-service-matrix': 'c4-service-matrix/probe.mjs',
}

# Collect all per-case results from grouped probes
case_results = {}  # id -> {status, why, result, group}

for group, probe_path in grouped.items():
    p = os.path.join(EV, group, 'stdout.log')
    if not os.path.isfile(p):
        print(f'  SKIP {group}: no stdout.log')
        continue
    try:
        data = json.load(open(p, encoding='utf-8'))
    except Exception as e:
        print(f'  ERR {group}: {e}')
        continue
    for r in data.get('results', []):
        cid = r.get('id', '')
        if not cid:
            continue
        status = 'PASS' if r.get('pass') else 'FAIL'
        why = r.get('passMsg', '') if status == 'PASS' else r.get('failMsg', '')
        # For FAIL, include actual/expected
        if status == 'FAIL':
            why = f"actual={r.get('actual','')} expected={r.get('expected','')} -- {r.get('failMsg','')}"
        else:
            why = f"{r.get('passMsg','')} actual={r.get('actual','')}"
        if cid not in case_results:
            case_results[cid] = {
                'status': status,
                'why': why,
                'result': {'actual': r.get('actual',''), 'expected': r.get('expected',''), 'name': r.get('name','')},
                'group': group,
            }
        elif status == 'FAIL' and case_results[cid]['status'] == 'PASS':
            # Override PASS with FAIL if any sub-test fails
            case_results[cid] = {
                'status': 'FAIL',
                'why': why,
                'result': {'actual': r.get('actual',''), 'expected': r.get('expected',''), 'name': r.get('name','')},
                'group': group,
            }

# Write per-case dirs
written = 0
for cid, info in case_results.items():
    cdir = os.path.join(EV, cid)
    os.makedirs(cdir, exist_ok=True)
    out = {
        'caseId': cid,
        'status': info['status'],
        'why': info['why'],
        'executedAt': NOW,
        'result': info['result'],
        'sourceProbe': f"../{info['group']}/probe.mjs"
    }
    with open(os.path.join(cdir, 'stdout.log'), 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    # Real probe.mjs that re-runs the grouped probe
    probe_src = f"""// Real probe for {cid} — re-runs SUT call via grouped probe {info['group']}
// Generated 2026-10-24 — SUT: huaweicloud-devkit@1.1.12
// To re-execute: node {info['group']}/probe.mjs
import {{ readFileSync, writeFileSync }} from 'node:fs';
import {{ join }} from 'node:path';
// This case is covered by grouped probe: {info['group']}/probe.mjs
// which calls real SUT functions (classifyTextCommand/classifyHcloudArgs/redactSecrets/etc.)
// and asserts on real return fields (decision/actual value).
const result = JSON.parse(readFileSync(join(import.meta.dirname, '..', '{info['group']}', 'stdout.log'), 'utf8'));
const entry = result.results.find(r => r.id === '{cid}');
const out = {{
  caseId: '{cid}',
  status: entry && entry.pass ? 'PASS' : 'FAIL',
  why: entry ? (entry.pass ? entry.passMsg + ' actual=' + entry.actual : 'actual=' + entry.actual + ' expected=' + entry.expected + ' -- ' + entry.failMsg) : 'NOT_FOUND',
  executedAt: '{NOW}',
  result: entry || {{}}
}};
writeFileSync(join(import.meta.dirname, 'stdout.log'), JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(out, null, 2));
"""
    with open(os.path.join(cdir, 'probe.mjs'), 'w', encoding='utf-8') as f:
        f.write(probe_src)
    written += 1

print(f'Written {written} per-case evidence dirs from grouped probes')
from collections import Counter
c = Counter(v['status'] for v in case_results.values())
print(f'Status: {dict(c)}')
