// D1-39: Windows upgrade detection chain
import { queryDistTagsSync, queryDistTags } from 'C:/Users/Administrator/devkit-test/opencode/hdk/plugins/huaweicloud-core/src/update-check.mjs';
const tags = queryDistTagsSync ? queryDistTagsSync() : await queryDistTags();
console.log(JSON.stringify(tags, null, 2));
