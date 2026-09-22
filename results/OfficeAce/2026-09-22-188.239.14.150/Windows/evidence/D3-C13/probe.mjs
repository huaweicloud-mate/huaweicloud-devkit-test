// AI生成
// D3-C13: OBS静态网站托管配置 - 检查tools.mjs中OBS website config处理
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  const results = [];
  const toolsPath = join(SRC, 'src', 'tools.mjs');
  
  if (existsSync(toolsPath)) {
    const content = readFileSync(toolsPath, 'utf8');
    const hasObsWebsite = content.includes('obs_set_website_config') || content.includes('ObsWebsiteConfig') || content.includes('handleObsWebsiteConfig');
    results.push({check:'obs_website_config_tool', pass: hasObsWebsite});
    
    const hasAws4Sign = content.includes('AWS4') || content.includes('aws4') || content.includes('obsSignedRequest') || content.includes('signedRequest');
    results.push({check:'aws4_signing', pass: hasAws4Sign});
    
    const hasIndexDoc = content.includes('indexDocument') || content.includes('index_document');
    results.push({check:'index_document', pass: hasIndexDoc});
  } else {
    results.push({check:'tools_file', pass:false});
  }
  
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({
    status: allPass ? 'PASS' : 'FAIL',
    why: allPass ? 'OBS静态网站托管: tools.mjs含obs_set_website_config/handleObsWebsiteConfig, AWS4签名, indexDocument参数' : '部分检查失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(', '),
    executedAt: ts(),
    details: results
  }));
} catch(e) {
  console.log(JSON.stringify({status:'BLOCKED', why:'执行异常: '+String(e.message).slice(0,300), executedAt: ts()}));
}
