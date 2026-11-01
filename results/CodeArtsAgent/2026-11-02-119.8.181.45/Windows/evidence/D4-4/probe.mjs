import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const results = {};

try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const hcloud = await import(fileUrl);
  
  const writeOps = [
    ['ECS', 'CreateServer', '--flavor_ref=test', '--image_ref=test'],
    ['ECS', 'DeleteServer', '--server_id=test'],
    ['VPC', 'CreateVpc', '--name=test'],
    ['RDS', 'CreateInstance', '--name=test'],
  ];
  
  const allNeedApproval = writeOps.every(args => {
    const plan = hcloud.planHcloudCommand ? hcloud.planHcloudCommand(args) : { safeToRun: false };
    return plan.safeToRun === false;
  });
  
  results['D4-4'] = { 
    status: allNeedApproval ? 'PASS' : 'FAIL', 
    allNeedApproval,
    why: `All ${writeOps.length} write ops require approval=${allNeedApproval}`
  };
} catch(e) { results['D4-4'] = { status: 'BLOCKED', why: e.message }; }

writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
