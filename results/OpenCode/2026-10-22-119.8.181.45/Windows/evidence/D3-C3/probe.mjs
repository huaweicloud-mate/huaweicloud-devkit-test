// D3-C3 sandbox deploy E2E
const r = await server.call('huaweicloud_sandbox_check_user', {});
console.log('result:', typeof r.result || typeof r.error);
