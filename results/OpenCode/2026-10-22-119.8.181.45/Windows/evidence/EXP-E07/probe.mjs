// EXP-E07 eval routing
const r = await server.call('huaweicloud_service_catalog', {intent:'给生产环境的服务器配置一个每日备份策略'});
console.log(JSON.stringify(r.result).slice(0,300));
