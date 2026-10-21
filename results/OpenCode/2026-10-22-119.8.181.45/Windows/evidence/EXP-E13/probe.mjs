// EXP-E13 eval routing
const r = await server.call('huaweicloud_service_catalog', {intent:'申请HTTPS证书并配置到我的域名'});
console.log(JSON.stringify(r.result).slice(0,300));
