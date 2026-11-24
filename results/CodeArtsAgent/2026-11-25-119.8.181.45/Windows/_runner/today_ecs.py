import json,subprocess,time,os,sys,datetime
EV=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),"evidence","D3-C1")
os.makedirs(EV,exist_ok=True)
ts=datetime.datetime.now().strftime("%Y%m%d%H%M%S")
NM="tctest-ecs-"+ts
def hc(args,timeout=180):
    r=subprocess.run(["hcloud"]+args+["--cli-profile=deploy","--cli-region=cn-north-4"],capture_output=True,text=True,timeout=timeout)
    try: j=json.loads(r.stdout)
    except Exception: j=None
    return {"rc":r.returncode,"j":j,"out":(r.stdout or "")[:1200],"err":(r.stderr or "")[:800]}
def done(status,why,result):
    rec={"caseId":"D3-C1","status":status,"why":why,"executedAt":ts,"result":result}
    open(os.path.join(EV,"stdout.log"),"w",encoding="utf-8").write(json.dumps(rec,ensure_ascii=False,indent=2))
    print(status,"|",why[:300]); sys.exit(0)
vpc_id=subnet_id=sg_id=server_id=None
log={}
try:
    r=hc(["VPC","CreateVpc","--vpc.name="+NM,"--vpc.cidr=192.168.0.0/16"]); log["vpc"]=r
    vpc_id=((r["j"] or {}).get("vpc") or {}).get("id")
    if not vpc_id: done("FAIL","创建 VPC 失败 rc=%s %s"%(r["rc"],(r["out"]+r["err"])[:300]),log)
    r=hc(["VPC","CreateSubnet","--subnet.name="+NM,"--subnet.cidr=192.168.0.0/24","--subnet.gateway_ip=192.168.0.1","--subnet.vpc_id="+vpc_id,"--subnet.dhcp_enable=true","--subnet.primary_dns=100.125.1.250"]); log["subnet"]=r
    subnet_id=((r["j"] or {}).get("subnet") or {}).get("id")
    if not subnet_id: done("FAIL","创建子网失败 rc=%s %s"%(r["rc"],(r["out"]+r["err"])[:300]),log)
    r=hc(["VPC","CreateSecurityGroup","--security_group.name="+NM,"--security_group.vpc_id="+vpc_id]); log["sg"]=r
    sg_id=((r["j"] or {}).get("security_group") or {}).get("id")
    img="9c2f377e-7f49-4fdf-b0be-c6c8d3b96fde"; flv="c6.large.2"
    args=["ECS","CreateServers","--server.name="+NM,"--server.flavorRef="+flv,"--server.imageRef="+img,
          "--server.vpcid="+vpc_id,"--server.nics.1.subnet_id="+subnet_id,
          "--server.availability_zone=cn-north-4a","--server.root_volume.volumetype=SSD","--server.root_volume.size=40","--server.count=1"]
    if sg_id: args.append("--server.security_groups.1.id="+sg_id)
    r=hc(args,240); log["create"]=r
    server_id=((r["j"] or {}).get("serverIds") or [None])[0]
    if not server_id: done("FAIL","创建 ECS 失败 rc=%s %s"%(r["rc"],(r["out"]+r["err"])[:400]),log)
    st=""; t0=time.time(); poll=[]
    while time.time()-t0<600:
        s=hc(["ECS","ShowServer","--server_id="+server_id],120)
        st=((s["j"] or {}).get("server") or {}).get("status","")
        poll.append({"t":int(time.time()-t0),"status":st})
        if st=="ACTIVE": break
        if st in ("ERROR","DELETED"): break
        time.sleep(20)
    log["poll"]=poll
    active=(st=="ACTIVE")
    d=hc(["ECS","DeleteServers","--servers.1.id="+server_id,"--delete_publicip=true","--delete_volume=true"],180); log["delete"]=d
    gone=False; t1=time.time()
    while time.time()-t1<420:
        s=hc(["ECS","ShowServer","--server_id="+server_id],120)
        if s["rc"]!=0 or not ((s["j"] or {}).get("server")) or ((s["j"] or {}).get("server") or {}).get("status")=="DELETED": gone=True; break
        time.sleep(15)
    if not gone:
        hc(["ECS","DeleteServers","--servers.1.id="+server_id,"--delete_publicip=true","--delete_volume=true"],180)
        time.sleep(20)
        s=hc(["ECS","ShowServer","--server_id="+server_id],120)
        gone=(s["rc"]!=0 or not ((s["j"] or {}).get("server")))
    ls=hc(["ECS","ListServersDetails"]); total=((ls["j"] or {}).get("count"))
    log["listAfter"]=total
    done("PASS" if (active and gone and (total==0)) else ("FAIL" if not gone else "FAIL"),
         "真机 ECS 生命周期：创建 %s(%s,%s)→状态=%s→删除→ListServersDetails count=%s 归零=%s"%(NM,flv,server_id,st,total,gone),
         {"serverId":server_id,"flavor":flv,"image":img,"finalStatus":st,"active":active,"deletedVerified":gone,"accountServerCount":total})
finally:
    if server_id:
        hc(["ECS","DeleteServers","--servers.1.id="+server_id,"--delete_publicip=true","--delete_volume=true"],180)
    if subnet_id: hc(["VPC","DeleteSubnet","--subnet_id="+subnet_id,"--vpc_id="+vpc_id],120)
    if sg_id: hc(["VPC","DeleteSecurityGroup","--security_group_id="+sg_id],120)
    if vpc_id: hc(["VPC","DeleteVpc","--vpc_id="+vpc_id],120)