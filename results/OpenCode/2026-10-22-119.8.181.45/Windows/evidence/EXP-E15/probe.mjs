// EXP-E15 eval routing
const r = await server.call('huaweicloud_service_catalog', {intent:'帮我领一下华为云的代金券'});
console.log(JSON.stringify(r.result).slice(0,300));
