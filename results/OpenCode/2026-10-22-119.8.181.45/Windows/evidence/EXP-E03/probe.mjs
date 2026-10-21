// EXP-E03 eval routing
const r = await server.call('huaweicloud_service_catalog', {intent:'把本地 dist 目录部署成一个公网静态网站'});
console.log(JSON.stringify(r.result).slice(0,300));
