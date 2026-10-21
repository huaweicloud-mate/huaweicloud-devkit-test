// D8-6 i18n docs consistency
const r1 = await server.call('huaweicloud_search_docs', {query:'ECS instance'});
const r2 = await server.call('huaweicloud_search_docs', {query:'云服务器'});
console.log('en:', !!r1.result, 'zh:', !!r2.result);
