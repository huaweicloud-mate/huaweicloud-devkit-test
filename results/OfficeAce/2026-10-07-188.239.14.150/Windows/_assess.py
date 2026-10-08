# -*- coding: utf-8 -*-
import os, json, collections, csv

root = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(root, 'evidence')
dirs = sorted([d for d in os.listdir(ev) if os.path.isdir(os.path.join(ev, d))])
print('TOTAL_EVIDENCE_DIRS', len(dirs))

has_probe = []
has_stdout = []
empty_stdout = []
no_stdout = []
status = collections.Counter()
unparse = []

for d in dirs:
    p = os.path.join(ev, d)
    files = os.listdir(p)
    probe = any(f.lower().endswith('.mjs') for f in files)
    sp = os.path.join(p, 'stdout.log')
    if probe:
        has_probe.append(d)
    if os.path.isfile(sp):
        has_stdout.append(d)
        raw = open(sp, encoding='utf-8', errors='replace').read().strip()
        if not raw:
            empty_stdout.append(d)
        else:
            try:
                j = json.loads(raw)
                if 'status' in j and isinstance(j['status'], str):
                    status[j['status']] += 1
                else:
                    # nested map {id:{status}} or list
                    found = False
                    def walk(o):
                        global found
                        if isinstance(o, dict):
                            if 'status' in o and isinstance(o['status'], str):
                                status[o['status']] += 1
                            for v in o.values():
                                walk(v)
                        elif isinstance(o, list):
                            for v in o:
                                walk(v)
                    walk(j)
                    found = True
            except Exception as e:
                status['_unparseable'] += 1
                unparse.append(d)
    else:
        no_stdout.append(d)

print('HAS_PROBE', len(has_probe))
print('HAS_STDOUT', len(has_stdout))
print('EMPTY_STDOUT', empty_stdout)
print('NO_STDOUT', no_stdout)
print('STATUS_DIST', dict(status))
print('UNPARSEABLE', unparse)