const m = await import('file://C:\Users\Administrator\devkit-test\OpenCode\hdk\plugins\huaweicloud-core\src/tools.mjs');
const d=m.listSkillDirs('C:\Users\Administrator\.config\opencode\skills');
console.log(["huaweicloud-core","huawei-ecs","huawei-obs","huawei-rds","huawei-getting-started","huaweicloud-cli-and-auth","huaweicloud-troubleshooting"].filter(n=>!d.includes(n)));
