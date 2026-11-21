import json,os,time,sys,datetime,urllib.request,random
from obs import ObsClient
BASE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CRED=json.load(open(os.path.expanduser("~/.config/huaweicloud/credentials.json"),encoding="utf-8"))
ts=datetime.datetime.now().strftime("%Y%m%d%H%M%S")
def mkcli():
    return ObsClient(access_key_id=CRED["ak"],secret_access_key=CRED["sk"],server="https://obs.cn-north-4.myhuaweicloud.com")
def ev(cid,st,why,res):
    d=os.path.join(BASE,"evidence",cid); os.makedirs(d,exist_ok=True)
    open(os.path.join(d,"stdout.log"),"w",encoding="utf-8").write(json.dumps({"caseId":cid,"status":st,"why":why,"executedAt":ts,"result":res},ensure_ascii=False,indent=2))
    print(cid,st,"|",why[:240])
# ---------- D3-C2 ----------
cid="D3-C2"; b="tctest-obs-"+ts+"-"+str(random.randint(1000,9999))
c=mkcli(); log={}
try:
    r=c.createBucket(b,location="cn-north-4"); log["create"]=r.status
    ok_create=r.status<300
    if not ok_create:
        ev(cid,"FAIL","创建桶失败 status=%s %s"%(r.status,getattr(r,"errorMessage","")),log)
        sys.exit(0)
    r=c.putContent(b,"index.html","<html><body><h1>tctest daily</h1></body></html>",headers={"ContentType":"text/html"}); log["put"]=r.status
    pol={"Statement":[{"Effect":"Allow","Principal":{"ID":["*"]},"Action":["GetObject"],"Resource":[b+"/*"]}]}; r=c.setBucketPolicy(b,json.dumps(pol)); log["acl"]=r.status
    url="https://"+b+".obs.cn-north-4.myhuaweicloud.com/index.html"
    code=0; body=""
    try:
        u=urllib.request.urlopen(url,timeout=30); code=u.status; body=u.read(80).decode("utf-8","ignore")
    except Exception as e:
        code=getattr(e,"code",0)
    log["curl"]={"code":code,"body":body[:60]}
    # cleanup
    d1=c.deleteObject(b,"index.html"); log["delObj"]=d1.status
    d2=c.deleteBucket(b); log["delBucket"]=d2.status
    ex=c.headBucket(b); log["headAfter"]=ex.status
    ok=ok_create and log["put"]<300 and log["acl"]<300 and code==200 and d2.status<300 and ex.status==404
    ev(cid,"PASS" if ok else "FAIL","真机 OBS 静态站：建桶 %s→上传 index.html(status=%s)→public-read(status=%s)→curl %s→删对象/桶→headBucket=%s 归零=%s"%(b,log["put"],log["acl"],code,ex.status,ex.status==404),log)
finally:
    try:
        c.deleteObject(b,"index.html"); c.deleteBucket(b)
    except Exception: pass
    c.close()