// EXP-E14 eval routing
const r = await server.call('huaweicloud_service_catalog', {intent:'我账号下的用户都有哪些权限 帮我审计一下'});
console.log(JSON.stringify(r.result).slice(0,300));
