// EXP-E10 eval routing
const r = await server.call('huaweicloud_service_catalog', {intent:'部署一个函数处理图片自动压缩'});
console.log(JSON.stringify(r.result).slice(0,300));
