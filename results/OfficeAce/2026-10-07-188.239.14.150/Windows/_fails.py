import json
for g in ['d2-auth','mcp-tools','c4-service-matrix']:
    obj=json.load(open(g+'/stdout.log',encoding='utf-8'))
    print('==== '+g+' ====')
    for r in obj.get('results',[]):
        if r.get('pass') is not True:
            print(json.dumps(r,ensure_ascii=False))