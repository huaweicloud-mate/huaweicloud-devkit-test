# -*- coding: utf-8 -*-
import io, json, os
for g in ['d4-security','d2-auth','c4-service-matrix','d1-upgrade','mcp-tools']:
    d = json.load(io.open(os.path.join(g, 'stdout.log'), encoding='utf-8-sig'))
    for r in d.get('results', []):
        # print id, pass only, compact
        print(f"{g}\t{r.get('id')}\t{r.get('name')}\t{'PASS' if r.get('pass') else 'FAIL'}")