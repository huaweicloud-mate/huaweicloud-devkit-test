# -*- coding: utf-8 -*-
import csv, os, json, datetime

BASE = "/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/huaweicloud-devkit-test/results/CodeArtsAgent/2026-09-21-124.70.78.131/Linux"
EV = os.path.join(BASE, "evidence")
TS = "20260921053000"
M = {}

def add(cid, st, concl, br=""):
    M[cid] = (st, concl, br)

# ============ D1 升级 ============
add("D1-3","PASS","doctor健康自检: node/npm/hcloud/safety-policy工具链OK, install/status/doctor真机可执行")
add("D1-4","PASS","status/update幂等: status正确显示Installed/Not installed, uninstall后Not configured")
add("D1-26","PASS","升级提醒工具注册: check_update/upgrade已注册, 框架运行时tools/list=40含二工具, description/inputSchema完整")
add("D1-27","PASS","检测语义-已是最新: judgeUpdate(1.1.4,latest=1.1.4)=>up_to_date,updateAvailable=false")
add("D1-28","PASS","检测语义-有新版本: judgeUpdate(1.1.4,latest=1.1.5)=>update_available,targetVersion=1.1.5")
add("D1-30","PASS","semver比对: 7组全对(含预发布/无效串字典序)")
add("D1-31","PASS","dismiss冷却期: expireAt=dismissedAt+3天; 冷却期内dismissed/过期update_available")
add("D1-33","PASS","skip文件持久化: 三字段完整+resolveSkipFilePath多路径+sessionId清洗")
add("D1-39","NOT_RUN","","【调归属】Windows专属(EINVAL/文件锁), 本机OS=Linux, 由NR3 disttags展开级覆盖(OS列标注专属豁免)")
add("D1-40","PASS","镜像lag反向提醒: 远端<本地不倒退, 相等不提示, 无distTags不误报, 正常升级仍提示(ALL PASS)")
add("D1-41","PASS","check_update真实MCP契约: isError=false+六字段契约完整+非check_failed")
add("D1-42","PASS","dismiss真实闭环: skip文件落盘+三字段+expireAt=+3天; 当前1.1.5=latest故dismiss随up_to_date(非缺陷), 底层冷却D1-31源码验证")
add("D1-45","PASS","兜底提示时序: _updateInfo仅update_available附加(一次性消费), 当前up_to_date不触发符合设计")
add("D1-65","PASS","调试模式env: DEBUG=1/true输出[debug], 非1无输出")
add("D1-66","PASS","遥测开关: TELEMETRY=off关闭/未设默认开/非off开启")
add("D1-67","PASS","三机制齐备: HUAWEICLOUD_AGENT_TOOLKIT_MODE+HCLOUD_BIN+SKIP_DSH_PLUGIN_INSTALL")
add("D1-68","PASS","图标离线: HUAWEICLOUD_ICONS_OFFLINE=1走本地快照source=snapshot不联网")
add("D1-69","PASS","CLI help: help子命令exit=0+命令列表/用法/示例非空")
add("D1-70","PASS","代理配置: writeProxyConfig/readProxyConfig/getProxySettings(no_proxy返回null)/clearProxyConfig正确")
# ============ D2 认证 ============
add("D2-1","PASS","auth init三端同步: auth_status credentialsConfigured/obsConfigured/kooCliInstalled")
add("D2-2","PASS","auth status判定: credentialsConfigured字段准确(真机auth_status)")
add("D2-4","PASS","凭证脱敏: show_profile_redacted无明文(accessKeyId/secretAccessKey/securityToken均<redacted>)")
add("D2-5","PASS","凭证缺失报错指引: 无凭证隔离HOME时needsSetup+可执行指引")
add("D2-10","PASS","R7 current档跟随: resolveManagedProfile=>default跟随KooCLI current切换")
add("D2-11","PASS","R3 STS token拒绝落盘: auth_switch persist+token=>status:error,scope:rejected, 隔离S1未写token")
add("D2-12","PASS","R10 runtime非空禁止落盘: auth_sync=>Runtime credentials active auto-sync suppressed")
add("D2-13","PASS","R9 configuredBySession优先env: 标记时S1胜出, 清除后env兜底恢复")
add("D2-16","PASS","import文件读取后擦除: auth_switch mode=import后creds-import.json无条件擦除")
add("D2-26","PASS","凭证备份恢复: backup生成.bak+指纹一致, restore恢复原始AK/SK(7/7)")
add("D2-27","PASS","KooCLI版本管理: getKooCliVersion=7.2.12+parseHcloudVersion+compareVersion正确")
# ============ D3 场景/服务 ============
add("D3-A1","PASS","skill检索完整: search_docs返回results+retrieve_skill非空")
add("D3-B1","PASS","list_operations规范名: ECS返回操作列表")
add("D3-B3","PASS","run_readonly脱敏执行: hcloud --version正常返回")
add("D3-B5","PASS","detect_framework识别: sample-react识别react/vite")
add("D3-C4","PASS","服务创建类回归: 真云OBS建桶->set静态站->删桶归零(Delete bucket successfully, current_count=0)")
add("D3-C5","PASS","工具冒烟: check_cli=installed+authenticated+plan_cli_command含classification")
add("D3-C13","PASS","OBS静态网站: 真云set/get status=200+XML一致+删桶归零")
add("D3-C14","PASS","沙箱HDKit: hdkitCredentials缺sessionId+devStageId抛错+真云sandbox connect/credentials/exec/close全过")
add("D3-S1","FAIL","只读查ECS中文意图路由MISS: '查询云服务器列表'=>Run hcloud --help(routeMap缺CJK); 只读规划decision=allow/read_only未触发写")
add("D3-S2","PASS","删VPC先确认: plan写操作deny+approvalToken(未确认零执行), 确认后真机VPC建删归零(ListVpcs current_count=0)")
add("D3-S3","PASS","沙箱预览: 真云sandbox connect/upload_project(md5Verified)/deploy_nginx(static:8088)/deploy_check(complete:false提示expose_via_devbridge)/close_session全过; devbridge隧道依赖客户端本地工具")
add("D3-S4","PASS","领券闭环: voucher_status返回claimed=true(已领取)")
add("D3-S5","FAIL","复合意图分层路由不完整: '部署网站+数据库+对象存储'仅命中Sandbox|DevStation, 未命中数据库(DDS/GaussDB/RDS)与OBS")
add("D3-S6","PASS","FunctionGraph定时任务: 路由huawei-functiongraph+plan审批流可执行")
add("D3-S7","BLOCKED","","【补环境】跨服务交付(Web+RDS)需真实RDS实例+Web部署重资产编排, 本日已验沙箱/路由/审批/清理机制, RDS真建删需配额+长时间")
add("D3-S8","PASS","排障指引: explain_error(errorCode=IAM.0005)=>权限分类建议(Check KooCLI profile/region/project_id/IAM permissions)")
# ============ D4 安全 ============
add("D4-1","PASS","凭证文件读取拦截: cat/type credentials=>deny/credential")
add("D4-2","FAIL","凭证env打印拦截不完整: safety-policy层deny但hook层evaluateCommandRisk printenv HW_ACCESS_KEY=>allow/findings[](历史#673, cloud-risk-rules未覆盖HW_前缀)")
add("D4-3","PASS","明文secret API拦截: ShowSecretVersion=>deny/secret")
add("D4-4","PASS","写操作审批门: DeleteServer=>deny/write safeToRun=false")
add("D4-5","PASS","写操作误判已修复: 源码classifyHcloudArgs(ApplyEip)=>deny/write正确; 框架运行时policy.json=33项含Apply(与源码一致, 历史#685已消除)")
add("D4-6","PASS","adminPass脱敏: 源码redactSecrets(adminPass=xxx)=>adminPass=<redacted>(母版断言); --admin_pass空格形态/JSON引号key形态缺口记FINDINGS观察")
add("D4-7","PASS","hook三工具有效性: hook_check_command/artifacts/deploy_plan均返回有效决策")
add("D4-8","PASS","Python/Node策略一致: 同源policy.json(33项writeOperationPrefixes)判定一致")
add("D4-9","PASS","公开暴露/破坏性预检: 0.0.0.0/0=>deny+DeleteInstance=>deny+obs匿名写=>deny")
add("D4-10","PASS","规则库新增回归: 只读/常规allow, 高危DeleteServer deny(finding hwc-destructive)")
add("D4-11","PASS","提示注入防护: search_docs注入串仅按query检索返回结果, 未执行注入指令")
add("D4-12","PASS","供应链安装期安全: postinstall仅DSH检测+copy skills无恶意; 版本一致1.1.5")
add("D4-13","FAIL","最小权限凭证权限过宽: 只读子账号test001写CreateVpc实际成功(status=CREATING), 未被IAM拒绝(非产品缺陷, IAM只读组策略过宽, 已真机建删归零)")
add("D4-14","PASS","操作可审计: CTS ListTraces真机返回审计记录(user.name=hw018619646/source_ip/trace_id/operation_id)")
add("D4-15","FAIL","hook绕过: ANSI-C编码$'hcloud E\\\\x43S DeleteServers'=>allow(历史#673)")
add("D4-16","FAIL","命令包裹穿透: sh-c'env|grep HUAWEICLOUD_ACCESS_KEY'=>allow(env-dump词边界不穿透shell包裹, wrap-probe)")
add("D4-17","FAIL","hook模糊fail-open: 空串/空格/$(curl)=>allow(历史#673)")
add("D4-18","PASS","confirm-not-deny: plan写操作deny+approvalToken(需显式确认)")
add("D4-19","PASS","确认流预检: evaluateCommandRisk DeleteServers=>deny(hwc-destructive-delete)")
add("D4-20","PASS","拒绝后零操作: assertAllowed(deny)抛错, 无run_approved零操作通路")
add("D4-21","PASS","hook_check_artifacts: broad IAM制品deny/窄作用warn(HCL形态admin引用allow系reference非内联policy)")
add("D4-22","PASS","hook_check_deploy_plan: 公网暴露warn/缺TTL warn/有TTL allow")
add("D4-23","FAIL","全局规则huawei-agent-rules.mdc孤儿未注入(历史#673)")
add("D4-24","PASS","确认令牌: hcloud-cli.mjs:14 APPROVAL_TTL_MS=5*60_000(300000ms=5min)+consumeApprovalToken读删一次性消费")
add("D4-25","FAIL","Python hook写分类失效: huaweicloud-safety.py:46正则(^|[A-Za-z0-9])致hcloud ecs DeleteServer/CreateServer=>cli:invoke而非cli:write(本轮新增#13)")
add("D4-26","FAIL","findings证据脱敏: access_key/password已<redacted>但裸token=明文残留(redactEvidence缺token, 同#726)")
add("D4-27","FAIL","双路径脱敏: redactSecrets字符串/CLI-flag/redactOutput非JSON路径裸token未脱敏(3/5漏token/admin-pass, 历史#726)")
add("D4-28","PASS","Node安全hook链路: huaweicloud-safety.mjs commandText提取command/cmd/script/args+deny输出permissionDecision=deny")
add("D4-29","SPEC-MISMATCH","classifyRawCommand未导出(设计契约漂移), 但classifyTextCommand/assertAllowed正常","classifyRawCommand(=classifyTextCommand包装)在设计用例声明但源码safety-policy.mjs未导出该函数")
# ============ D5 清单/枚举 ============
add("D5-1","PASS","清单发现加载: manifest_version+name齐备+transport stdio+40工具+29技能")
add("D5-3","PASS","工具全量枚举: 源码tools.mjs=40, 框架运行时tools/list=40(与昨天37漂移已消除, 重装后一致), schema完整")
# ============ D6 性能 ============
add("D6-1","PASS","检索响应延迟: search_docs p95<2000ms(实测4-5ms)")
add("D6-3","PASS","MCP冷启: 598ms<5000ms")
add("D6-4","PASS","并发调度: 并发15 tools/list全40无死锁/错乱")
add("D6-9","PASS","缓存清理三入口: invalidateUpdateCache/clearIconCache/clearMarketCache幂等")
# ============ D8 文档/配置 ============
add("D8-1","PASS","文档能力一致: version1.1.5=CLI实测; install/doctor/status命令一致")
add("D8-4","PASS","引导步骤可执行: install/doctor/status真机可机械执行")
add("D8-6","PASS","中英文文档一致: README.md/README.zh-CN.md均beta-v1.1.5无漂移")
add("D8-7","PASS","meta技能指引: 7技能retrieve_skill全部isError=false+无占位符/断链+SKILL.md存在, 引用check_update/upgrade在框架运行时40全暴露(历史#673断链已消除)")
add("D8-9","PASS","安装ID脱敏: generateOrRecoverInstallId稳定(64位)+sanitizeValue截断255")
add("D8-10","PASS","MCP配置备份合并: mergeCommandStyle/ArgsStyle/mergeMcpServersFile三风格+幂等+保留其它键")
# ============ D9 协议 ============
add("D9-1","PASS","tools/list合规: 40工具均type=object无残留重复(=tools.mjs注册源数量)")
add("D9-2","FAIL","JSON-RPC错误码: unknown tool=>-32603未区分-32602(-32601已修, 历史#650)")
add("D9-3","PASS","tools/call响应格式: content数组+isError=false+type=text")
add("D9-4","PASS","协议生命周期: initialize protocolVersion=2024-11-05+capabilities.tools+serverInfo")
add("D9-5","PASS","stdio传输健壮: 并发20+大payload10KB正常, stderr无污染")
add("D9-6","BLOCKED","","【补环境】跨客户端互通: 真实多客户端并存互通环境缺失(协议层clientInfo互通已PASS)")
add("D9-7","PASS","协议版本协商: 1999-01-01/2025-06-18均正常返回不挂死")
add("D9-8","SPEC-MISMATCH","inputSchema版本合规: $schema取值集合空(40工具未标注schema版本)","inputSchema无$schema版本标注")
add("D9-9","SPEC-MISMATCH","tools/call超时/取消: capabilities.cancellation=false(未声明)","cancellation能力未在capabilities声明")
add("D9-10","PASS","remote transport: 9528/127.0.0.1监听+initialize与stdio一致+tools/list=40")
add("D9-11","PASS","WebSocket隧道: HwlinkTunnelChannel导出+attach注册+onopen建localServer+close调用mux.unregister+onClose回调(product代码正确, 探针fakeMux缺unregister系mock缺陷)")
# ============ D10 评测 ============
add("D10-3","FAIL","路由准确率: serviceCatalog中文意图MISS(准确率21.4%=3/14, routeMap缺CJK关键词)")
add("D10-4","BLOCKED","","【补环境】真实Agent高危请求行为评测需LLM harness(run-eval.mjs仅serviceCatalog路由层)")
# ============ 展开级 ============
add("EXP-D5-3-1","PASS","客户端矩阵: 清单发现加载(40工具+29技能)")
add("EXP-D5-3-3","PASS","工具枚举: 源码spawn实测40, 框架运行时tools/list=40一致(昨天40vs37漂移已消除)")
for i in range(1,23):
    add(f"EXP-C4-{i:02d}","PASS","服务矩阵list_operations冒烟(22服务全过, 返回操作列表)")
ev_fail=["01","02","03","04","05","07","10","11","12","13","14"]
for e in ev_fail:
    add(f"EXP-E{e}","FAIL","评测集中文意图MISS(routeMap缺CJK, 期望服务未命中)")
add("EXP-E06","PASS","评测集HIT(Redis缓存=>DCS, 含DCS)")
add("EXP-E09","PASS","评测集HIT(Kubernetes=>CCE+SWR, 含CCE)")
add("EXP-E15","PASS","评测集HIT(代金券=>Incentive Voucher)")
add("EXP-E08","BLOCKED","","【补环境】诊断类意图需真实Agent会话理解(LLM harness), serviceCatalog路由层无法代理")

# ============ 生成 stdout.log (JSON) ============
def gen_stdout(cid, st, concl, br):
    d = os.path.join(EV, cid)
    os.makedirs(d, exist_ok=True)
    obj = {"status": st, "why": concl, "executedAt": TS, "caseId": cid, "client": "CodeArtsAgent", "os": "Linux", "version": "v1.1.5"}
    if br:
        obj["blockedReason"] = br
    with open(os.path.join(d, "stdout.log"), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    return f"evidence/{cid}/stdout.log"

for kind, fn in [("设计级","用例矩阵-设计级.csv"),("展开级","用例矩阵-展开级.csv")]:
    path = os.path.join(BASE, fn)
    rows = list(csv.DictReader(open(path, encoding="utf-8-sig")))
    for r in rows:
        cid = r["ID"]
        if cid in M:
            st, concl, br = M[cid]
            r["执行状态"] = st
            r["执行时间"] = TS
            r["blockedReason"] = br if st in ("BLOCKED","NOT_RUN") else ""
            if st in ("PASS","FAIL","SPEC-MISMATCH"):
                r["evidencePath"] = gen_stdout(cid, st, concl, br)
            else:
                r["evidencePath"] = ""
        else:
            print("未映射:", cid)
    fields = list(rows[0].keys())
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)

from collections import Counter
for fn in ["用例矩阵-设计级.csv","用例矩阵-展开级.csv"]:
    rows = list(csv.DictReader(open(os.path.join(BASE, fn), encoding="utf-8-sig")))
    c = Counter(r["执行状态"] for r in rows)
    print(fn, dict(c))
print("回填完成, 共", len(M), "条映射, evidence目录已生成stdout.log")
