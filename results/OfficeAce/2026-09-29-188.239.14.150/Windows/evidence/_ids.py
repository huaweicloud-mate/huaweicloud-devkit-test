import io, re
for f in ['d2-auth/probe.mjs', 'd4-security/probe.mjs', 'mcp-tools/probe.mjs']:
    t = io.open(f, encoding='utf-8', errors='replace').read()
    ids = sorted(set(re.findall(r"'((?:D[0-9]+[-A-Za-z0-9]*)|EXP[-A-Za-z0-9]+)'", t)))
    print('====', f, 'len', len(t))
    print('  literals:', ids)