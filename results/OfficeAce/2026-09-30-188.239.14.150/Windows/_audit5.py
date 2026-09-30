import os, json
d = 'evidence'
# Full inventory: every dir, whether stdout.log/txt/probe exists, and status if parseable
rows = []
for x in sorted(os.listdir(d)):
    full = os.path.join(d, x)
    if not os.path.isdir(full):
        continue
    files = os.listdir(full)
    probe = 'probe.mjs' in files
    log = 'stdout.log' in files
    txt = 'stdout.txt' in files
    st = ''
    if log:
        raw = open(os.path.join(full, 'stdout.log'), encoding='utf-8').read().strip()
        try:
            j = json.loads(raw)
            st = j.get('status', '(no-status)' if isinstance(j, dict) else 'NON-DICT')
        except Exception:
            st = 'parse-fail'
    elif txt:
        raw = open(os.path.join(full, 'stdout.txt'), encoding='utf-8').read().strip()
        try:
            j = json.loads(raw)
            st = j.get('status', '(no-status)' if isinstance(j, dict) else 'NON-DICT')
        except Exception:
            st = 'txt-parse-fail'
    rows.append((x, probe, log, txt, st, len(files)))

print('total dirs:', len(rows))
for x, probe, log, txt, st, nf in rows:
    flag = ''
    if not (log or txt):
        flag = '  <<< NO OUTPUT'
    print(f'{x:20s} probe={probe} log={log} txt={txt} status={st} files={nf}{flag}')