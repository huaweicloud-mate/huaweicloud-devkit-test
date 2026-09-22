// AI生成
// D1-27: 检测语义-已是最新
// Direct call judgeUpdate(current, distTags, null) with current == latest
import { judgeUpdate } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  const current = '1.1.2';
  const distTags = { latest: '1.1.2' };
  const result = await judgeUpdate(current, distTags, null);
  
  const isUpToDate = result.result === 'up_to_date';
  const noUpdate = result.updateAvailable === false;
  const status = (isUpToDate && noUpdate) ? 'PASS' : 'FAIL';
  
  const res = {
    status,
    why: status === 'PASS'
      ? `result=up_to_date, updateAvailable=false (current=${current}, latest=${distTags.latest})`
      : `预期up_to_date但得到result=${result.result}, updateAvailable=${result.updateAvailable}`,
    executedAt: ts(),
    input: { current, distTags },
    result
  };
  
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
} catch (e) {
  const res = { status: 'FAIL', why: `执行失败: ${e.message}`, executedAt: ts(), error: e.stack };
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
}
process.exit(0);
