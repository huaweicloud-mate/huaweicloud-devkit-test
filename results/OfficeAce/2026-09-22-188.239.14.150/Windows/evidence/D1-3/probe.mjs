// AI生成
// D1-3: doctor健康自检
// 检查 hcloud CLI 可用性 + 插件文件完整性
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  const results = [];
  
  // 1. Check hcloud CLI
  try {
    const hcloudVer = execSync('hcloud version', {encoding:'utf8',timeout:10000}).trim();
    results.push({check:'hcloud_version', pass:true, value:hcloudVer});
  } catch(e) {
    results.push({check:'hcloud_version', pass:false, error:String(e.message).slice(0,200)});
  }
  
  // 2. Check plugin manifest
  const manifestPath = join(SRC, 'openclaw.plugin.json');
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    results.push({check:'manifest_exists', pass:true, value:{name:manifest.name, version:manifest.version}});
  } else {
    results.push({check:'manifest_exists', pass:false, error:'openclaw.plugin.json not found'});
  }
  
  // 3. Check core source files
  const coreFiles = ['mcp-server.mjs', 'tools.mjs', 'safety-policy.mjs', 'update-check.mjs', 'hcloud-cli.mjs'];
  for (const f of coreFiles) {
    const exists = existsSync(join(SRC, 'src', f));
    results.push({check:`src_file_${f}`, pass:exists});
  }
  
  // 4. Check safety rules
  const rulesPath = join(SRC, 'safety', 'rules', 'cloud-risk-rules.json');
  if (existsSync(rulesPath)) {
    const rules = JSON.parse(readFileSync(rulesPath, 'utf8'));
    results.push({check:'safety_rules', pass:true, value:{count: rules.length || Object.keys(rules).length}});
  } else {
    results.push({check:'safety_rules', pass:false, error:'cloud-risk-rules.json not found'});
  }
  
  // 5. Check skills directory
  const skillsDir = join(SRC, 'skills');
  if (existsSync(skillsDir)) {
    results.push({check:'skills_dir', pass:true});
  } else {
    results.push({check:'skills_dir', pass:false});
  }
  
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({
    status: allPass ? 'PASS' : 'FAIL',
    why: allPass ? 'doctor检查: hcloud CLI可用, 插件manifest完整, 5个核心源文件存在, 安全规则文件存在, skills目录存在' : '部分检查失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(', '),
    executedAt: ts(),
    details: results
  }));
} catch(e) {
  console.log(JSON.stringify({status:'BLOCKED', why:'执行异常: '+String(e.message).slice(0,300), executedAt: ts()}));
}
