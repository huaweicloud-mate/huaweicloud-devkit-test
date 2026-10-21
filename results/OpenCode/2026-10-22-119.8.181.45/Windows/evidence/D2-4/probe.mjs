// D2-4 credential redaction
const { redactSecrets } = await import('safety-policy.mjs');
const r = redactSecrets({access_key:'AKIDxxx',secret_key:'SKxxx',password:'Pass',region:'cn-north-4'});
console.log(JSON.stringify(r));
