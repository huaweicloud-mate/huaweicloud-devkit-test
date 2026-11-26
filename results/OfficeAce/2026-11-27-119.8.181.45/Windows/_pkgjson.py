import json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
j = json.load(open(r'C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\package.json', encoding='utf-8'))
print('name:', j.get('name'), 'version:', j.get('version'))
print('main:', j.get('main'), 'bin:', json.dumps(j.get('bin')))
print('type:', j.get('type'))
print('scripts:', json.dumps(j.get('scripts', {}), ensure_ascii=False)[:400])
