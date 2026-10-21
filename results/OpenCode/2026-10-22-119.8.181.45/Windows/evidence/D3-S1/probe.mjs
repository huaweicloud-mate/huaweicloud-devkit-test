// D3-S1 read-only ECS query
const r = await server.call('huaweicloud_service_catalog', {intent:'查看ECS列表'});
console.log(JSON.stringify(r.result).slice(0,200));
