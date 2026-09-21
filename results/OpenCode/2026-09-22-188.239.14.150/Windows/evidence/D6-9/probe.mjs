// D6-9: Cache cleanup
import { invalidateUpdateCache } from 'C:/Users/Administrator/devkit-test/opencode/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { clearIconCache } from 'C:/Users/Administrator/devkit-test/opencode/hdk/plugins/huaweicloud-core/src/icon-library.mjs';
import { clearMarketCache } from 'C:/Users/Administrator/devkit-test/opencode/hdk/plugins/huaweicloud-core/src/search-market.mjs';
invalidateUpdateCache(); clearIconCache(); clearMarketCache();
