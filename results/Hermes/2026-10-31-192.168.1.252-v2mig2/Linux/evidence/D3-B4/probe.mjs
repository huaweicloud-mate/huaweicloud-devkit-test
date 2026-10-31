// huaweicloud-devkit v2 (fcfe047f) D3 补测探针（自包含）
// 用法: node probe.mjs <plugins/huaweicloud-core/dist/mcp-server.js> <CASE: D3-A2|D3-A6|D3-B4|D3-B6>
import { spawn } from 'node:child_process';

function makeServer(serverPath) {
  const child = spawn(process.execPath, [serverPath], { stdio:['pipe','pipe','pipe'], env:{...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE:'local'} });
  let buf = Buffer.alloc(0); const pending = new Map(); let _id = 1;
  child.stdout.on('data', d => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n'); if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0,h).toString());
      if (!m) { buf = buf.slice(h+4); continue; }
      const n = +m[1]; if (buf.length < h+4+n) break;
      const body = buf.slice(h+4, h+4+n).toString(); buf = buf.slice(h+4+n);
      try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  function send(o){ const b=JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise(r=>pending.set(o.id,r)); }
  function call(name, args){ return send({jsonrpc:'2.0',id:_id++,method:'tools/call',params:{name,arguments:args||{}}}); }
  return { child, send, call, kill:()=>child.kill() };
}
const toolText = (resp) => resp?.result?.content?.[0]?.text ?? '';

const [serverPath, CASE] = [process.argv[2], process.argv[3]];
const srv = makeServer(serverPath);
await srv.send({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'eval',version:'1'}}});
srv.send({jsonrpc:'2.0',method:'notifications/initialized'});
let vendored = false;
async function call2(name, args) {
  let r = await srv.call(name, args); let t = toolText(r);
  if (name === 'huaweicloud_service_catalog' && !vendored && /Vendor challenge/.test(t)) {
    vendored = true; r = await srv.call(name, args); t = toolText(r);
  }
  return { text: t, obj: (()=>{ try{return JSON.parse(t);}catch{return {};} })() };
}

if (CASE === 'D3-A2') {
  const R = [
    ['帮我查一下华北北京四有哪些云主机','ECS'],['创建一台 2C4G 的 Ubuntu 云服务器 规格通用型','ECS'],
    ['删除一台不再使用的云服务器','ECS'],['把本地 dist 目录部署成一个公网静态网站','OBS'],
    ['创建一个对象存储桶并设为公共读','OBS'],['往 OBS 桶里上传一个图片文件','OBS'],
    ['给这台服务器绑定一个弹性公网IP','EIP'],['创建一个虚拟私有网络 VPC','VPC'],
    ['创建一个子网并关联到 VPC','VPC'],['创建一个安全组并开放 22 端口','VPC'],
    ['看一下我的云数据库MySQL实例的状态','RDS'],['创建一台云数据库 RDS MySQL 实例','RDS'],
    ['创建一个 Redis 缓存实例用于会话存储','DCS'],['给生产环境的服务器配置一个每日备份策略','CBR'],
    ['把云硬盘挂载到云服务器上','EVS'],['开设一个 Kubernetes 集群用于微服务部署','CCE'],
    ['部署一个函数处理图片自动压缩','FunctionGraph'],['查一下我账号这个月的费用情况','BSS'],
    ['我账号下的用户都有哪些权限 帮我审计一下','IAM'],['申请HTTPS证书并配置到我的域名','SCM'],
    ['把应用日志指标推送到云监控告警','CES'],['创建一个消息通知主题用于告警推送','SMN'],
    ['帮我领一下华为云的代金券','Voucher'],['用 Terraform 管理我的云资源','Terraform'],
  ];
  let hit=0, miss=0;
  for (const [intent, exp] of R) {
    const { obj } = await call2('huaweicloud_service_catalog', { intent, vendorConfirmed: '用户场景已明确为华为云（hcloud/华为云控制台/华北北京四/代金券等原文）' });
    const skills = obj.recommendedSkills||[], svcs = obj.recommendedServices||[];
    const ok = skills.some(s=>s.toLowerCase().includes(exp.toLowerCase())) || svcs.some(s=>s.toLowerCase().includes(exp.toLowerCase()));
    ok?hit++:miss++;
    console.log(`${ok?'HIT ':'MISS'} | 期望=${exp.padEnd(14)} | skills=${(skills.join('|')||'-').slice(0,70)} | svcs=${(svcs.join('|')||'-').slice(0,50)} | ${intent.slice(0,22)}`);
  }
  const acc=(hit/(hit+miss)*100).toFixed(1);
  console.log(`\nD3-A2 触发词路由准确率: HIT=${hit} MISS=${miss} 准确率=${acc}% (N=${hit+miss})`);
}
if (CASE === 'D3-A6') {
  const queries=[['对象存储','计算'],['云服务器','计算'],['数据库','存储'],['容器','计算'],['人工智能','人工智能'],['网络','网络']];
  for (const [q] of queries) {
    const { obj } = await call2('huaweicloud_search_marketplace', { query: q });
    const res=(obj.results||[])[0]; console.log(`Q=${q} count=${obj.count} top=${res?.name||'-'} score=${res?.score??'-'}`);
  }
  const icons=['ecs','obs','rds','cce','modelarts','vpc','iam','gaussdb'];
  for (const s of icons) {
    const { obj } = await call2('huaweicloud_get_service_icon', { service: s });
    const r0=(obj.results||[])[0]; const url=String(r0?.logo?.source_url||r0?.logo||'');
    const official=/^https:\/\/.*(hc-cdn\.cn|huaweicloud)/.test(url);
    console.log(`icon ${s}: name=${r0?.name||'-'} official=${official} url=${url.slice(0,70)}`);
  }
}
if (CASE === 'D3-B4') {
  const ERRORS=[
    {service:'ECS',errorCode:'Ecs.0019',message:'flavor has been taken offline'},
    {service:'ECS',errorCode:'Ecs.0707',message:'the product does not exist'},
    {service:'ECS',errorCode:'Ecs.0067',message:'order rejected balance'},
    {service:'ECS',errorCode:'Ecs.0319',message:'insufficient capacity in AZ'},
    {service:'APIGW',errorCode:'APIGW.0301',message:'invalid parameter'},
    {service:'OBS',errorCode:'403',message:'restricted IAM user OBS operation'},
  ];
  const actionable=/(hcloud\s+[A-Z]|--cli-region|Fix:|switch to|Run `|run `|Check |grant |top up|Verify |recreate|retry)/i;
  let exec=0;
  for (const e of ERRORS) {
    const { obj } = await call2('huaweicloud_explain_error', e);
    const sug=(obj.suggestions||[]).join(' '); const ok=actionable.test(sug); ok&&exec++;
    console.log(`${ok?'EXEC':'NOPE'} | ${e.errorCode}: ${sug.slice(0,160)}`);
  }
  console.log(`\nD3-B4 explain_error 可执行=${exec}/${ERRORS.length}`);
}
if (CASE === 'D3-B6') {
  const Q=[
    ['ECS 实例规格列表怎么查','ecs'],['ECS 配额限制是多少','ecs'],['RDS MySQL 备份策略怎么设置','rds'],
    ['OBS 桶权限 ACL 怎么配置','obs'],['VPC 安全组规则怎么添加','vpc'],['IAM 用户权限怎么分配','iam'],
    ['CCE 集群节点怎么扩容','cce'],['FunctionGraph 函数怎么部署','functiongraph'],['BSS 账单费用怎么查询','billing'],
    ['CBR 云备份怎么创建','cbr'],['EVS 云硬盘怎么挂载','evs'],['DCS Redis 怎么创建','dcs'],
    ['SMN 消息通知怎么订阅','smn'],['CES 云监控告警怎么配','ces'],['ELB 负载均衡怎么创建','elb'],
    ['GaussDB 数据库怎么连接','gaussdb'],['ModelArts 训练任务怎么提交','modelarts'],['KMS 密钥怎么管理','dew'],
    ['CTS 云审计怎么开通','cts'],['APIG API 网关怎么发布','apig'],
  ];
  let hit=0;
  for (const [q, topic] of Q) {
    const { obj } = await call2('huaweicloud_search_docs', { query: q });
    const top=(obj.results||[])[0]; const name=(top?.name||'').toLowerCase(); const ok=name.includes(topic); ok&&hit++;
    console.log(`${ok?'HIT ':'MISS'} | ${q.slice(0,24).padEnd(26)} → ${top?.name||'-'} (rel=${top?.relevance??top?.score??'-'})`);
  }
  const acc=(hit/Q.length*100).toFixed(1);
  console.log(`\nD3-B6 search_docs 命中率: HIT=${hit}/${Q.length} = ${acc}%`);
}
srv.kill(); process.exit(0);
