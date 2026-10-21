// D9-13 credential no leak
const r = await server.call('huaweicloud_show_profile_redacted', {});
console.log(r.result.content[0].text.slice(0,200));
