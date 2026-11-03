// D6-4 probe: 并发调度正确性 — session-manager + hwlink-fair-queue + multiplexer
// Source-level: Map-based session store (single-threaded event loop = no deadlock/race);
// hwlink-fair-queue ensures fair ordering; multiplexer dedups concurrent requests
