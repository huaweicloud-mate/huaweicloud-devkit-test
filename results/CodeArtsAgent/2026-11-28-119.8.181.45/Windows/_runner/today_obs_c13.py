import json,os,sys,datetime,random
from obs import ObsClient
BASE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CRED=json.load(open(os.path.expanduser("~/.config/huaweicloud/credentials.json"),encoding="utf-8"))
ts=datetime.datetime.now().strftime("%Y%m%d%H%M%S")
b="tctest-obsweb-"+ts+"-"+str(random.randint(1000,9999))
c=ObsClient(access_key_id=CRED["ak"],secret_access_key=CRED["sk"],server="https://obs.cn-north-4.myhuaweicloud.com")
log={}
def ev(st,why,res):
    d=os.path.join(BASE,"evidence","D3-C13"); os.makedirs(d,exist_ok=True)
    open(os.path.join(d,"stdout.log"),"w",encoding="utf-8").write(json.dumps({"caseId":"D3-C13","status":st,"why":why,"executedAt":ts,"result":res},ensure_ascii=False,indent=2))
    print("D3-C13",st,"|",why[:260]); sys.exit(0)
try:
    log["create"]=c.createBucket(b,location="cn-north-4").status
    g0=c.getBucketWebsite(b); log["getUnset"]={"status":g0.status,"code":g0.errorCode if g0.status>=300 else None}
    s=c.setBucketWebsite(b,{"indexDocument":{"suffix":"index.html"},"errorDocument":{"key":"error.html"}}); log["set"]=s.status
    g1=c.getBucketWebsite(b)
    idx=None
    try: idx=g1.body.indexDocument.suffix if hasattr(g1.body,"indexDocument") else g1.body.indexDocument
    except Exception: idx=str(getattr(g1.body,"indexDocument",None))
    log["getAfter"]={"status":g1.status,"indexDocument":idx}
    d=c.deleteBucketWebsite(b); log["delete"]=d.status
    g2=c.getBucketWebsite(b); log["getAfterDelete"]={"status":g2.status,"code":g2.errorCode if g2.status>=300 else None}
    miss=None
    try:
        m=c.setBucketWebsite(b,{}); miss={"status":m.status,"code":m.errorCode if m.status>=300 else None}
    except Exception as e:
        miss={"exception":str(e)[:200]}
    log["missingIndex"]=miss
    log["delBucket"]=c.deleteBucket(b).status
    log["head"]=c.headBucket(b).status
    ok=(log["set"]<300 and g1.status<300 and idx=="index.html" and log["delete"]<300 and g2.status>=300 and log["head"]==404)
    ev("PASS" if ok else "FAIL","OBS 网站托管：未配置get=%s→set indexDocument(index.html/error.html)=%s→get核对=%s→delete=%s→删后get=%s→缺indexDocument set=%s→桶删除归零=%s"%(
        log["getUnset"]["status"],log["set"],log["getAfter"]["status"],log["delete"],log["getAfterDelete"]["status"],miss,log["head"]==404),log)
finally:
    try: c.deleteBucketWebsite(b); c.deleteBucket(b)
    except Exception: pass
    c.close()