import io, glob, json, sys
sys.stdout.reconfigure(encoding='utf-8')
for p in sorted(glob.glob('evidence/*/stdout.log')):
    raw = io.open(p, encoding='utf-8').read().strip()
    # strip BOM
    raw = raw.lstrip('\ufeff')
    st = None
    try:
        d = json.loads(raw)
        if isinstance(d, dict):
            st = d.get('status')
            if not st and len(d) == 1:
                st = list(d.values())[0].get('status')
            if not st and 'pass' in d:
                st = 'PASS' if d['pass'] else 'FAIL'
    except Exception as e:
        for s in ('SPEC-MISMATCH','BLOCKED','NOT_RUN','FAIL','PASS'):
            if s in raw.upper():
                st = s; break
    case = p.split('\\')[1]
    print(f"{case:12} -> {st}")