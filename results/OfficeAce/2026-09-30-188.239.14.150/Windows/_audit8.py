import os, json
d = 'evidence'
valid_statuses = {'PASS','FAIL','BLOCKED','SPEC-MISMATCH','NOT_RUN'}
no_valid = []
status_count = {}
for x in sorted(os.listdir(d)):
    full = os.path.join(d, x)
    if not os.path.isdir(full):
        continue
    files = os.listdir(full)
    src = None
    if 'stdout.log' in files:
        src = 'stdout.log'
    elif 'stdout.txt' in files:
        src = 'stdout.txt'
    if src is None:
        no_valid.append((x, 'NO_OUTPUT', None))
        continue
    raw = open(os.path.join(full, src), encoding='utf-8-sig').read().lstrip('\ufeff').strip()
    try:
        j = json.loads(raw)
    except Exception as e:
        no_valid.append((x, 'PARSE_FAIL:' + repr(raw[:60]), str(e)))
        continue
    if isinstance(j, dict) and j.get('status') in valid_statuses:
        status_count[j['status']] = status_count.get(j['status'], 0) + 1
    else:
        no_valid.append((x, 'NO_VALID_STATUS', json.dumps(j)[:80] if isinstance(j, dict) else type(j).__name__))
print('STATUS COUNT:', status_count)
print('NO-VALID dirs:', len(no_valid))
for x, reason, detail in no_valid:
    print(f'{x:18s} {reason} {detail}')