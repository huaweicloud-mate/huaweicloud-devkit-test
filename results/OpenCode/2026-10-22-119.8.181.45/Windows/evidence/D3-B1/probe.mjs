// D3-B1 list_operations naming
const r = await server.call('huaweicloud_list_operations', {service:'ECS'});
console.log(r.result.content[0].text.slice(0,200));
