// EXP-E11 eval routing
const r = await server.call('huaweicloud_service_catalog', {intent:'查一下我账号这个月的费用情况'});
console.log(JSON.stringify(r.result).slice(0,300));
