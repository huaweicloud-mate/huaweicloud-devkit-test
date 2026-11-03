// D1-31 probe: dismiss cooldown — judgeUpdate skipState logic
// writeSkipState(file, dismissedVersion, {days:3}) -> {dismissedVersion, dismissedAt, expireAt}
// inCooldown = now < expireAt && semverCompare(target, dismissedVersion) <= 0
// newer version (target > dismissedVersion) breaks cooldown -> update_available
