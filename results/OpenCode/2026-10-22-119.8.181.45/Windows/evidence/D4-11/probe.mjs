// D4-11 injection protection
const r = await server.call('huaweicloud_search_docs', {query:'ECS; rm -rf /'});
console.log('safe:', !!r.result);
