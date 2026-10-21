// D8-9 install ID telemetry redaction
const r = await server.call('huaweicloud_show_profile_redacted', {});
console.log('no leak:', !r.result.content[0].text.match(/AK[A-Z0-9]{10,}/));
