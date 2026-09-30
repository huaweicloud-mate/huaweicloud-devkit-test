import json
j = json.load(open('evidence/probe-summary.json', encoding='utf-8'))
print('total', j['total'], 'pass', j['pass'], 'fail', j['fail'], 'blocked', j['blocked'])
print('executedAt', j.get('executedAt'))
for c in j['cases']:
    print(c.get('caseId'), '|', c.get('status'), '|', (c.get('why') or '')[:70])