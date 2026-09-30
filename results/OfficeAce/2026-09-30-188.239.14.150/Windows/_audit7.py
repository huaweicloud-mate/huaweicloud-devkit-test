import json, os
p = os.path.join('evidence', 'D1-26', 'stdout.log')
raw = open(p, encoding='utf-8').read()
print('first bytes repr:', repr(raw[:5]))
print('strip first bytes repr:', repr(raw.strip()[:5]))
try:
    j = json.loads(raw.strip())
    print('parse OK:', j.get('status'))
except Exception as e:
    print('parse FAIL:', type(e).__name__, e)