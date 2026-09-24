# -*- coding: utf-8 -*-
import io, json, os
for g in ['d4-security','d2-auth','c4-service-matrix','d1-upgrade','mcp-tools']:
    p = os.path.join(g, 'stdout.log')
    raw = io.open(p, encoding='utf-8-sig').read()
    try:
        d = json.loads(raw)
        print(g, 'type=', type(d).__name__, 'keys=', list(d.keys()) if isinstance(d, dict) else 'N/A', 'total=', d.get('total') if isinstance(d, dict) else '')
    except Exception as e:
        print(g, 'ERR', e, 'raw head=', raw[:120])