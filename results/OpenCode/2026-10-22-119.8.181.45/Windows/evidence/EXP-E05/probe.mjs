// EXP-E05 eval routing
const r = await server.call('huaweicloud_service_catalog', {intent:'看一下我的云数据库MySQL实例的状态'});
console.log(JSON.stringify(r.result).slice(0,300));
