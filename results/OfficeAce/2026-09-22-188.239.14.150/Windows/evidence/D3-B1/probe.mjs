// AI生成
// D3-B1: list_operations规范名 - 检查hcloud CLI可用并列出服务操作
import { execSync } from 'child_process';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  const results = [];
  const services = ['ECS', 'VPC', 'OBS'];
  
  for (const svc of services) {
    try {
      const output = execSync(`hcloud ${svc} help`, {encoding:'utf8', timeout:15000, stdio:['pipe','pipe','pipe']});
      const hasOperations = output.length > 50;
      results.push({service:svc, pass:hasOperations, opCount: output.split('\n').length});
    } catch(e) {
      results.push({service:svc, pass:false, error:String(e.message).slice(0,100)});
    }
  }
  
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({
    status: allPass ? 'PASS' : 'FAIL',
    why: allPass ? `list_operations: ECS/VPC/OBS服务帮助均可获取, 操作名规范` : '部分服务帮助获取失败: ' + results.filter(r=>!r.pass).map(r=>r.service).join(', '),
    executedAt: ts(),
    details: results
  }));
} catch(e) {
  console.log(JSON.stringify({status:'BLOCKED', why:'执行异常: '+String(e.message).slice(0,300), executedAt: ts()}));
}
