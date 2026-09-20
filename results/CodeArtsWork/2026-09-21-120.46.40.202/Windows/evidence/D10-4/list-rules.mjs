import { readFileSync } from 'node:fs';
const path = 'C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json';
const j = JSON.parse(readFileSync(path, 'utf8'));
j.rules.forEach(x => {
  const any = x.match.any ? x.match.any.map(c => c.regex).join(' OR ') : '';
  const all = x.match.all ? x.match.all.map(c => c.regex).join(' AND ') : '';
  console.log(x.id + ' | ' + x.severity + ' | stages=' + x.stages.join(',') + ' | any=' + any + ' | all=' + all);
});
