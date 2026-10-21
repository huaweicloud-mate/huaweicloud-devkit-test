// D3-S3 sandbox preview URL
const r = await server.call('huaweicloud_sandbox_check_user', {});
console.log('precondition:', !!r.result || !!r.error);
