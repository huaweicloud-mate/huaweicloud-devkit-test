// EXP-E04 eval routing
const r = await server.call('huaweicloud_service_catalog', {intent:'给这台服务器绑定一个弹性公网IP'});
console.log(JSON.stringify(r.result).slice(0,300));
