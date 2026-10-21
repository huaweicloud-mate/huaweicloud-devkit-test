// EXP-E01 eval routing
const r = await server.call('huaweicloud_service_catalog', {intent:'帮我查一下我账号在华北北京四有哪些云主机'});
console.log(JSON.stringify(r.result).slice(0,300));
