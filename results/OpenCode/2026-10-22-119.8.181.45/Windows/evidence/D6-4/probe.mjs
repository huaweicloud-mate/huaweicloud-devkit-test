// D6-4 concurrent dispatch
const [r1,r2,r3] = await Promise.all([
  server.call('huaweicloud_list_regions', {}),
  server.call('huaweicloud_search_docs', {query:'ECS'}),
  server.call('huaweicloud_check_cli', {})
]);
console.log('all ok:', r1.result && r2.result && r3.result);
