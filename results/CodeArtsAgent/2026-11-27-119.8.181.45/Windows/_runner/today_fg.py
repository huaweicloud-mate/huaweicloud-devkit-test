import json,subprocess,time,os,sys,datetime,base64,zipfile,io
EV=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),"evidence","D3-S6")
os.makedirs(EV,exist_ok=True)
ts=datetime.datetime.now().strftime("%Y%m%d%H%M%S"); NM="tctest-fg-"+ts
def hc(a,t=180):
    r=subprocess.run(["hcloud"]+a+["--cli-profile=deploy","--cli-region=cn-north-4"],capture_output=True,text=True,timeout=t)
    try: j=json.loads(r.stdout)
    except Exception: j=None
    return {"rc":r.returncode,"j":j,"out":(r.stdout or "")[:900],"err":(r.stderr or "")[:500]}
def done(st,why,res):
    open(os.path.join(EV,"stdout.log"),"w",encoding="utf-8").write(json.dumps({"caseId":"D3-S6","status":st,"why":why,"executedAt":ts,"result":res},ensure_ascii=False,indent=2))
    print(st,"|",why[:260]); sys.exit(0)
buf=io.BytesIO()
with zipfile.ZipFile(buf,"w") as z: z.writestr("index.py","def handler(event, context):\n    return 'ok'\n")
b64=base64.b64encode(buf.getvalue()).decode()
code=os.path.join(os.environ["TEMP"],"fg_code_"+ts+".b64"); open(code,"w").write(b64)
log={}
try:
    r=hc(["FunctionGraph","CreateFunction","--func_name="+NM,"--runtime=Python3.9","--handler=index.handler","--memory_size=128","--package=default","--func_code.file="+code,"--code_type=zip","--timeout=30"],240); log["create"]=r
    urn=((r["j"] or {}).get("func_urn"))
    if not urn:
        done("FAIL","创建 FunctionGraph 函数失败 rc=%s %s"%(r["rc"],(r["out"]+r["err"])[:400]),log)
    ready=False
    for i in range(12):
        g=hc(["FunctionGraph","ShowFunctionConfig","--function_urn="+urn],120); log["show"+str(i)]=g
        stt=((g["j"] or {}).get("status"))
        if stt in ("1","Active","active"): ready=True; break
        time.sleep(10)
    d=hc(["FunctionGraph","DeleteFunction","--function_urn="+urn],180); log["delete"]=d
    gone=False
    for i in range(10):
        g=hc(["FunctionGraph","ShowFunctionConfig","--function_urn="+urn],120)
        if g["rc"]!=0 or not ((g["j"] or {}).get("func_urn")): gone=True; break
        time.sleep(8)
    lf=hc(["FunctionGraph","ListFunctions"]); cnt=((lf["j"] or {}).get("count"))
    ok=ready and gone and (cnt==0)
    done("PASS" if ok else "FAIL","真机 FunctionGraph：创建 %s→就绪=%s→删除→ListFunctions count=%s 归零=%s"%(NM,ready,cnt,gone),
         {"urn":urn,"ready":ready,"deletedVerified":gone,"accountFunctionCount":cnt})
finally:
    try:
        if 'urn' in dir() and urn: hc(["FunctionGraph","DeleteFunction","--function_urn="+urn],180)
    except Exception: pass