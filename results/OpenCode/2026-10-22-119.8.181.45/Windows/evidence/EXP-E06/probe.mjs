// EXP-E06 eval routing
const r = await server.call('huaweicloud_service_catalog', {intent:'创建一个 Redis 缓存实例用于会话存储'});
console.log(JSON.stringify(r.result).slice(0,300));
