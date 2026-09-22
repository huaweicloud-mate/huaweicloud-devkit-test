// AI生成
// D1-28: 检测语义-有新版本
// Direct call judgeUpdate with current < latest
import { judgeUpdate } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  const current = '1.1.1';
  const distTags = { latest: '1.1.2' };
  const result = await judgeUpdate(current, distTags, null);
  
  const isUpdateAvail = result.result === 'update_available';
  const updateFlag = result.updateAvailable === true;
  const targetCorrect = result.targetVersion === '1.1.2';
  const status = (isUpdateAvail && updateFlag && targetCorrect) ? 'PASS' : 'FAIL';
  
  const res = {
    status,
    why: status === 'PASS'
      ? `result=update_available, updateAvailable=true, targetVersion=1.1.2`
      : `预期update_available+targetVersion=1.1.2但得到result=${result.result}, updateAvailable=${result.updateAvailable}, targetVersion=${result.targetVersion}`,
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
