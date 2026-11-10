const m = await import('file://C:\Users\Administrator\devkit-test\OpenCode\hdk\plugins\huaweicloud-core\src/auth/service.mjs');
const s = await m.getAuthStatus('all');
console.log(Object.keys(s));
