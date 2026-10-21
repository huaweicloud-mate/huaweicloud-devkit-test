// EXP-E08 eval routing
const r = await server.call('huaweicloud_service_catalog', {intent:'我的ECS启动失败了 帮我分析原因'});
console.log(JSON.stringify(r.result).slice(0,300));
