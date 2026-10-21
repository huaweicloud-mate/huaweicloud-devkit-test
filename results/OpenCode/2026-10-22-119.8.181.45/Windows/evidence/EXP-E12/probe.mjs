// EXP-E12 eval routing
const r = await server.call('huaweicloud_service_catalog', {intent:'把应用日志指标推送到云监控告警'});
console.log(JSON.stringify(r.result).slice(0,300));
