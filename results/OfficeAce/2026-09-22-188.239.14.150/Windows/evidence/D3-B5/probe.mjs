// AI生成
// D3-B5: detect_framework识别 - 检查detect-framework.mjs存在且含框架定义
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  const results = [];
  const detectPath = join(SRC, 'src', 'detect-framework.mjs');
  
  if (existsSync(detectPath)) {
    const content = readFileSync(detectPath, 'utf8');
    // Check for framework names
    const frameworks = ['React', 'Vue', 'Angular', 'Next', 'Nuxt', 'VitePress', 'Docusaurus', 'Hugo', 'Hexo', 'Taro', 'uni-app'];
    const found = frameworks.filter(fw => content.includes(fw));
    results.push({check:'frameworks_defined', pass: found.length >= 8, value:{count:found.length, found}});
    
    // Check for key functions
    const hasDetect = content.includes('detectFramework') || content.includes('detect_framework');
    results.push({check:'detect_function', pass: hasDetect});
    
    // Check for FRAMEWORKS constant
    const hasConst = content.includes('FRAMEWORKS') || content.includes('frameworks');
    results.push({check:'frameworks_constant', pass: hasConst});
  } else {
    results.push({check:'detect_framework_file', pass:false, error:'detect-framework.mjs not found'});
  }
  
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({
    status: allPass ? 'PASS' : 'FAIL',
    why: allPass ? `detect_framework: detect-framework.mjs存在, 识别${results[0]?.value?.count || 0}种框架, 含detect函数和FRAMEWORKS常量` : '部分检查失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(', '),
    executedAt: ts(),
    details: results
  }));
} catch(e) {
  console.log(JSON.stringify({status:'BLOCKED', why:'执行异常: '+String(e.message).slice(0,300), executedAt: ts()}));
}
