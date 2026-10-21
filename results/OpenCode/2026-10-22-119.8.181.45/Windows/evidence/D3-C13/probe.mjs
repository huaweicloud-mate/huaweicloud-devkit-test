// D3-C13 OBS static website config
const r = await server.call('huaweicloud_obs_set_website_config', {action:'get',bucket:'test',region:'cn-north-4'});
console.log(JSON.stringify(r.result).slice(0,200));
