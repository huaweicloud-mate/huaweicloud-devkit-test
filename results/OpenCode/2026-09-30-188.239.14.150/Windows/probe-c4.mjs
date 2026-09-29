/**
 * EXP-C4-01~22: Service matrix - list_operations + plan_cli_command for each service
 */
import { callTool, TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const evBase = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/huaweicloud-devkit-test/results/OpenCode/2026-09-30-188.239.14.150/Windows/evidence';
const now = () => new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);

function writeEv(caseId, status, details = {}) {
    const dir = join(evBase, caseId);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const result = { caseId, status, executedAt: now(), ...details };
    writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2), 'utf8');
    if (!existsSync(join(dir, 'probe.mjs'))) {
        writeFileSync(join(dir, 'probe.mjs'), `// Probe for ${caseId}\n// Service matrix test\n`, 'utf8');
    }
    console.log(`[${caseId}] => ${status}`);
}

async function m_call(name, args) {
    try { return await callTool(name, args); }
    catch (e) { return { isError: true, error: String(e).substring(0, 200) }; }
}

// Service matrix: EXP-C4-01~22
const services = [
    { id: 'EXP-C4-01', svc: 'ECS', readOp: 'ListServers' },
    { id: 'EXP-C4-02', svc: 'VPC', readOp: 'ListVpcs' },
    { id: 'EXP-C4-03', svc: 'OBS', readOp: 'ListBuckets' },
    { id: 'EXP-C4-04', svc: 'RDS', readOp: 'ListInstances' },
    { id: 'EXP-C4-05', svc: 'GaussDB', readOp: 'ListInstances' },
    { id: 'EXP-C4-06', svc: 'CCE', readOp: 'ListClusters' },
    { id: 'EXP-C4-07', svc: 'FunctionGraph', readOp: 'ListFunctions' },
    { id: 'EXP-C4-08', svc: 'IAM', readOp: 'ListUsers' },
    { id: 'EXP-C4-09', svc: 'CTS', readOp: 'ListTraces' },
    { id: 'EXP-C4-10', svc: 'CES', readOp: 'ListMetrics' },
    { id: 'EXP-C4-11', svc: 'DDS', readOp: 'ListInstances' },
    { id: 'EXP-C4-12', svc: 'DCS', readOp: 'ListInstances' },
    { id: 'EXP-C4-13', svc: 'SMN', readOp: 'ListTopics' },
    { id: 'EXP-C4-14', svc: 'DMS', readOp: 'ListInstances' },
    { id: 'EXP-C4-15', svc: 'WAF', readOp: 'ListDomains' },
    { id: 'EXP-C4-16', svc: 'CDN', readOp: 'ListDomains' },
    { id: 'EXP-C4-17', svc: 'ModelArts', readOp: 'ListNotebooks' },
    { id: 'EXP-C4-18', svc: 'DEW', readOp: 'ListSecrets' },
    { id: 'EXP-C4-19', svc: 'CBR', readOp: 'ListVaults' },
    { id: 'EXP-C4-20', svc: 'EVS', readOp: 'ListVolumes' },
    { id: 'EXP-C4-21', svc: 'EIP', readOp: 'ListPublicIps' },
    { id: 'EXP-C4-22', svc: 'ELB', readOp: 'ListLoadBalancers' },
];

for (const { id, svc, readOp } of services) {
    try {
        // list_operations
        const listR = await m_call('huaweicloud_list_operations', { service: svc });
        const listOk = listR && !listR.isError;
        
        // plan_cli_command with read operation
        const planR = await m_call('huaweicloud_plan_cli_command', { args: [svc, readOp] });
        const planOk = planR && !planR.isError;
        
        const pass = listOk && planOk;
        writeEv(id, pass ? 'PASS' : 'FAIL', {
            test: 'service-matrix',
            service: svc,
            readOp,
            listOps: listOk ? 'ok' : JSON.stringify(listR).substring(0, 100),
            plan: planOk ? 'ok' : JSON.stringify(planR).substring(0, 100)
        });
    } catch (e) {
        writeEv(id, 'FAIL', { test: 'service-matrix', service: svc, error: String(e).substring(0, 200) });
    }
}

console.log('\n=== EXP-C4 service matrix complete ===');
