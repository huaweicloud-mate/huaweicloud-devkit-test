// D8-1 docs consistency
const r = await server.call('huaweicloud_search_docs', {query:'OBS bucket create lifecycle'});
console.log('ok:', !!r.result);
