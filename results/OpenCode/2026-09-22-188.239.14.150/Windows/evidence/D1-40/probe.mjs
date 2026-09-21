// D1-40: Mirror lag detection
import { queryDistTags, judgeUpdate } from 'C:/Users/Administrator/devkit-test/opencode/hdk/plugins/huaweicloud-core/src/update-check.mjs';
const official = await queryDistTags();
process.env.npm_config_registry = 'https://repo.huaweicloud.com/repository/npm/';
const mirror = await queryDistTags();
const downgrade = judgeUpdate('1.1.6', { latest: '1.1.5' }, null);
console.log('No downgrade:', downgrade.result === 'up_to_date');
