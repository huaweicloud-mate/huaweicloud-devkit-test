# -*- coding: utf-8 -*-
import io, json, os
for g in ['d4-security','d2-auth','c4-service-matrix','d1-upgrade','mcp-tools']:
    d = json.load(io.open(os.path.join(g, 'stdout.log'), encoding='utf-8-sig'))
    ids = [(r.get('id'), r.get('name'), r.get('pass')) for r in d.get('results', [])]
    print('=====', g, len(ids))
    for i in ids:
        print('   ', i)