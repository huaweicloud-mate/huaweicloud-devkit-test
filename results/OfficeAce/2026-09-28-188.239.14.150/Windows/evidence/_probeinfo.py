import io, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
for d in ['d4-security','d2-auth','d1-upgrade','mcp-tools','c4-service-matrix']:
    p = os.path.join(base, d, 'probe.mjs')
    if os.path.isfile(p):
        s = io.open(p, encoding='utf-8').read()
        ids = sorted(set(re.findall(r'(?:D\d+-[A-Z0-9-]+|D\d+-\d+|EXP-[A-Z0-9-]+)', s)))
        print('=====', d, 'len', len(s))
        print('ref case ids:', ids)