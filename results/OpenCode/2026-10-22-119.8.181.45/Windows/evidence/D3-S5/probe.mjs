// D3-S5 composite intent routing
const r = await server.call('huaweicloud_service_catalog', {intent:'部署Web应用并创建RDS'});
console.log(JSON.stringify(r.result).slice(0,200));
