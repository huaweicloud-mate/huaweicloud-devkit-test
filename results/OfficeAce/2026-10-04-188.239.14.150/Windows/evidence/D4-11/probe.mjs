// D4-11: 供应链安装期安全
import { loadSafety } from '../_helper.mjs';
const { classifyTextCommand } = await loadSafety();

const credShow = classifyTextCommand('hcloud configure show');
const envDump = classifyTextCommand('env | grep HUAWEICLOUD');
const credFile = classifyTextCommand('cat ~/.huaweicloud/credentials.json');
const ok = credShow.decision === 'deny' && envDump.decision === 'deny' && credFile.decision === 'deny';

console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D4-11',
  why: ok ? 'Supply-chain credential exfil vectors (configure show, env dump, cred file read) all denied.' : 'Some vectors not denied.',
  executedAt: '20261001103000',
  details: [credShow, envDump, credFile]
}, null, 2));