// D4-27: 输出脱敏
import { loadSafety } from '../_helper.mjs';
const { redactSecrets } = await loadSafety();

const obj = redactSecrets({access_key:'AKXYZ123',secret_key:'SKABC456',name:'test'});
const objOk = obj.access_key==='<redacted>' && obj.secret_key==='<redacted>' && obj.name==='test';
const str = redactSecrets('access_key=AKXYZ123');
const strOk = str.includes('<redacted>') && !str.includes('AKXYZ123');
const nested = redactSecrets({credentials:{password:'secret123'},region:'cn-north-4'});
const nestedOk = JSON.stringify(nested).includes('<redacted>') && !JSON.stringify(nested).includes('secret123');
const ok = objOk && strOk && nestedOk;
console.log(JSON.stringify({status:ok?'PASS':'FAIL',caseId:'D4-27',why:`objOk=${objOk}, strOk=${strOk}, nestedOk=${nestedOk}`,executedAt:'20261001103000',details:{obj,str,nested}},null,2));