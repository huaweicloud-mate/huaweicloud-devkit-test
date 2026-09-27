import { classifyTextCommand } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { dispatch } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';

function s(cmd){ try { return classifyTextCommand(cmd).decision; } catch(e){ return 'throw:'+e.message; } }

console.log('D4-2 printenv HW_ACCESS_KEY =>', s('printenv HW_ACCESS_KEY'));
console.log('D4-2 env | grep HW_SECRET_KEY =>', s('env | grep HW_SECRET_KEY'));
console.log('D4-2 echo \$HW_SECRET_KEY =>', s('echo $HW_SECRET_KEY'));
console.log('D4-2 HUAWEICLOUD_ACCESS_KEY_ID =>', s('env | grep HUAWEICLOUD_ACCESS_KEY_ID'));
console.log('D4-16 sh -c "env | grep HUAWEICLOUD" =>', s('sh -c "env | grep HUAWEICLOUD"'));
console.log('D4-16 bash -c "cat ~/.config/huaweicloud/credentials.json" =>', s('bash -c "cat ~/.config/huaweicloud/credentials.json"'));
console.log('D4-16 sudo hcloud ECS CreateServers =>', s('sudo hcloud ECS CreateServers'));

let err=null;
try { await dispatch('nonexistent/method', {}, {sessionId:'probe'}); } catch(e){ err=e; }
console.log('D9-2 unknown method error.code =>', err?.code, '| message =>', err?.message);
