// Real probe for D3-C13: OBS静态网站托管配置(真机)
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const b = 'tctest-codearts1-w' + stamp;
  const xml = '<CreateBucketConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LocationConstraint>cn-north-4</LocationConstraint></CreateBucketConfiguration>';
  const c = await signedRequest('PUT', '/' + b, { body: xml, contentType: 'application/xml' });
  const before = await signedRequest('GET', '/', { bucket: b, subresource: 'website' });
  const setXml = '<WebsiteConfiguration><IndexDocument><Suffix>index.html</Suffix></IndexDocument><ErrorDocument><Key>error.html</Key></ErrorDocument></WebsiteConfiguration>';
  const set = await signedRequest('PUT', '/', { bucket: b, subresource: 'website', body: setXml, contentType: 'application/xml' });
  const after = await signedRequest('GET', '/', { bucket: b, subresource: 'website' });
  const afterText = (await after.text()).slice(0, 300);
  const del = await signedRequest('DELETE', '/', { bucket: b, subresource: 'website' });
  const afterDel = await signedRequest('GET', '/', { bucket: b, subresource: 'website' });
  const delBucket = await signedRequest('DELETE', '/', { bucket: b });
  const head = await signedRequest('HEAD', '/', { bucket: b });
  const ok = c.status === 200 && before.status === 404 && set.status === 200 && after.status === 200 && /index\.html/.test(afterText) && del.status === 204 && afterDel.status === 404 && delBucket.status === 204 && head.status === 404;
  return { status: ok ? 'PASS' : 'FAIL', why: 'OBS 网站托管：未配置get=' + before.status + '→set=' + set.status + '→get核对=' + after.status + '→delete=' + del.status + '→删后get=' + afterDel.status + '→桶删除=' + delBucket.status + ' head=' + head.status, result: { create: c.status, getUnset: before.status, set: set.status, getAfter: after.status, getAfterBody: afterText, delete: del.status, getAfterDelete: afterDel.status, delBucket: delBucket.status, headAfter: head.status } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
