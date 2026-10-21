// D3-C7 cross-region guidance
const r1 = await server.call('huaweicloud_list_regions', {});
const r2 = await server.call('huaweicloud_get_regional_availability', {service:'ecs',region:'cn-north-4'});
console.log('ok:', !!r1.result && !!r2.result);
