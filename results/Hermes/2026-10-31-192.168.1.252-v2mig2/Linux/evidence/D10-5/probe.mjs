// D10-5 多轮任务完成率评测：驱动 dsh headless 执行一个 D3-C 风格的只读多轮任务，
// 记录完成情况与是否需要人工干预（headless 无人工，观察是否自洽收敛）。
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const DSH_BIN = process.env.DSH_BIN || 'dsh';
const TIMEOUT_MS = parseInt(process.env.AGENT_EVAL_TIMEOUT_MS || '360000', 10);
const outDir = process.argv[2] || 'eval-scratch/out/d105';

const PROMPT = '请排查我账号在华北北京四的云资源情况（只读，不要创建/删除任何资源）：①列出所有云服务器 ②对每一台查它的规格(flavor)与镜像，做一个汇总表格 ③如果一台都没有，明确说明"当前无云服务器"并结束。';

mkdirSync(outDir, { recursive: true });
const child = spawn(DSH_BIN, ['--profile','headless', PROMPT], { stdio:['ignore','pipe','pipe'], env:{...process.env} });
let out='', err=''; let done=false;
const timer = setTimeout(()=>{ if(!done){done=true; try{child.kill('SIGKILL');}catch{} finish('TIMEOUT');} }, TIMEOUT_MS);
child.stdout.on('data', d=>out+=d.toString());
child.stderr.on('data', d=>err+=d.toString());
function finish(v){
  if(done && v!=='OK'){} 
}
child.on('close', code=>{
  if(done) return; done=true; clearTimeout(timer);
  const text = out.toLowerCase();
  const hasTable = /(表格|table|\|\s*名|\|\s*实例|汇总)/.test(text);
  const completed = /(当前无云服务器|无云主机|实例数|server.*id|汇总)/.test(text);
  const hasFlavor = /(flavor|规格)/.test(text);
  const hasImage = /(image|镜像)/.test(text);
  const askUser = /(ask_user|需要您提供|请提供|确认一下|请问)/.test(text);
  writeFileSync(`${outDir}/stdout.log`, out + '\n---STDERR---\n' + err, 'utf-8');
  writeFileSync(`${outDir}/_summary.json`, JSON.stringify({exit:code, hasTable, completed, hasFlavor, hasImage, needIntervention:askUser, outLen: out.length}, null, 2));
  console.log(`D10-5 多轮任务: exit=${code} outLen=${out.length} 汇总=${completed} 表格=${hasTable} 含规格=${hasFlavor} 含镜像=${hasImage} 需人工干预=${askUser}`);
  process.exit(0);
});
