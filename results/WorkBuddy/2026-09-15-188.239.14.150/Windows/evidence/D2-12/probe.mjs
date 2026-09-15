import { setRuntimeCredentials, hasRuntimeCredentials, clearRuntimeCredentials } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/auth/credentials.mjs';
setRuntimeCredentials('AKTEST','SKTEST','','cn-north-4');
console.log('runtime active:', hasRuntimeCredentials());
clearRuntimeCredentials();
console.log('runtime after clear:', hasRuntimeCredentials());
if (hasRuntimeCredentials() === false) console.log('PASS: runtime credentials can be set and cleared');
else console.log('FAIL');