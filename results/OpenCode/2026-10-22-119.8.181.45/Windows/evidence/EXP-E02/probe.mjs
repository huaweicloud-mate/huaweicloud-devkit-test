// EXP-E02 eval routing
const r = await server.call('huaweicloud_service_catalog', {intent:'创建一台 2C4G 的 Ubuntu 云服务器 规格通用型'});
console.log(JSON.stringify(r.result).slice(0,300));
