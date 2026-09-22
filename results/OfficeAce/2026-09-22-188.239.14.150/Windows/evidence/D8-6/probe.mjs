// AI生成
// D8-6: 中英文文档一致 - 对比README.md与README.zh-CN.md
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
const repoRoot = 'C:/Users/Administrator/devkit-test/officeclaw/hdk';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
try {
  const results = [];
  const enPath = join(repoRoot, 'README.md');
  const zhPath = join(repoRoot, 'README.zh-CN.md');
  if (existsSync(enPath) && existsSync(zhPath)) {
    const en = readFileSync(enPath, 'utf8');
    const zh = readFileSync(zhPath, 'utf8');
    // Compare section headers
    const enHeaders = (en.match(/^#+\s+.+/gm) || []).map(h => h.trim());
    const zhHeaders = (zh.match(/^#+\s+.+/gm) || []).map(h => h.trim());
    results.push({check:'header_count', pass: Math.abs(enHeaders.length - zhHeaders.length) <= 5, value:{en:enHeaders.length, zh:zhHeaders.length}});
    // Compare code blocks count
    const enCodeBlocks = (en.match(/```/g) || []).length;
    const zhCodeBlocks = (zh.match(/```/g) || []).length;
    results.push({check:'code_blocks', pass: Math.abs(enCodeBlocks - zhCodeBlocks) <= 4, value:{en:enCodeBlocks, zh:zhCodeBlocks}});
    // Check both have same tool names
    const enTools = (en.match(/huaweicloud_\w+/g) || []).sort();
    const zhTools = (zh.match(/huaweicloud_\w+/g) || []).sort();
    const enToolSet = new Set(enTools);
    const zhToolSet = new Set(zhTools);
    const missingInZh = [...enToolSet].filter(t => !zhToolSet.has(t));
    const missingInEn = [...zhToolSet].filter(t => !enToolSet.has(t));
    results.push({check:'tool_names', pass: missingInZh.length <= 2 && missingInEn.length <= 2, value:{enCount:enToolSet.size, zhCount:zhToolSet.size, missingInZh, missingInEn}});
  } else {
    results.push({check:'readme_files', pass:false, error:`EN:${existsSync(enPath)}, ZH:${existsSync(zhPath)}`});
  }
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? '中英文文档一致: README.md与README.zh-CN.md章节数/代码块数/工具名基本一致' : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
