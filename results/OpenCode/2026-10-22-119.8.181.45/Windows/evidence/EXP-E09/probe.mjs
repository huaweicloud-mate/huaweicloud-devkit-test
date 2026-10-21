// EXP-E09 eval routing
const r = await server.call('huaweicloud_service_catalog', {intent:'开设一个 Kubernetes 集群用于微服务部署'});
console.log(JSON.stringify(r.result).slice(0,300));
