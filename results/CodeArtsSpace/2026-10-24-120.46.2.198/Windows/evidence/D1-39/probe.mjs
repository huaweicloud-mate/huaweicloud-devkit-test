// D1-39: queryDistTagsSync + queryDistTags on Windows
import {queryDistTagsSync, queryDistTags} from 'C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src/update-check.mjs';
const sync=queryDistTagsSync('huaweicloud-devkit');
const asyncR=await queryDistTags('huaweicloud-devkit');
console.log(JSON.stringify({sync,asyncR}));