// D3-C6 sandbox 7 implicit tools
const r = await server.call('huaweicloud_sandbox_check_user', {});
console.log('responded:', !!r.result || !!r.error);
