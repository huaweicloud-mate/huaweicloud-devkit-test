# -*- coding: utf-8 -*-
import json, io
for cid in ['c4-service-matrix','d1-upgrade','d2-auth','d4-security','mcp-tools']:
    j = json.load(io.open('evidence/' + cid + '/stdout.log', encoding='utf-8-sig'))
    ids = sorted(set(r.get('id') for r in j['results'] if r.get('id')))
    print(cid, '->', len(ids), 'unique ids')
    print('  ', ids)
print()
print('c4-service-matrix full ids:')
j = json.load(io.open('evidence/c4-service-matrix/stdout.log', encoding='utf-8-sig'))
for r in j['results']:
    print('  ', r.get('id'), 'pass' if r.get('pass') else 'FAIL')