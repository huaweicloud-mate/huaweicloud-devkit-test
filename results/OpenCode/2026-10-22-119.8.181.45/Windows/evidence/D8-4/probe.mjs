// D8-4 guidance executable
const r = await server.call('huaweicloud_retrieve_skill', {name:'huawei-ecs'});
console.log(r.result.content[0].text.slice(0,200));
