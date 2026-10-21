// D3-C14 sandbox service params
const r = await server.call('huaweicloud_sandbox_check_user', {});
console.log(JSON.stringify(r).slice(0,200));
