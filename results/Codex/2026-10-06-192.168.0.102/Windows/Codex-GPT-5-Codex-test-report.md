# Codex GPT-5-Codex Daily Test Report

- Client: Codex
- OS: Windows
- SUT: huaweicloud-devkit@1.1.8-next.1, hdk ffd7b47
- Archive: results/Codex/2026-10-06-192.168.0.102/Windows/
- Result: PARTIAL

## Summary

| Layer | Total | PASS | FAIL | BLOCKED | SPEC-MISMATCH | NOT_RUN |
|---|---:|---:|---:|---:|---:|---:|
| Design | 102 | 80 | 4 | 18 | 0 | 0 |
| Expanded | 39 | 28 | 11 | 0 | 0 | 0 |
| Total | 141 | 108 | 15 | 18 | 0 | 0 |

Pass rate over PASS+FAIL: 87.8%. P0 failures: D4-16, D9-12, D9-13.

## Execution

Executed reusable grouped probes, Codex fixtures, protocol probe, and source-level harnesses against the local hdk checkout. PASS cases have per-case evidence under evidence/<case-id>/ with stdout.log and probe.mjs. No cloud resources were intentionally created by this run.

## Failures

See FINDINGS.md for root causes and evidence. Main issues: MCP hook wrapper allow, credential redaction leaks, JSON-RPC invalid params missing -32602, and service catalog eval route misses.

## Blocked

18 design-level cases were marked BLOCKED because today's Codex Windows run had no executable Codex-owned fixture for Hermes/OpenCode hook chains or full real-agent/cloud scenario workflows. Each row has blockedReason in the design CSV and per-case stdout.log.

## Gates

- verify_no_fake_pass.py Codex Windows: PASS
- verify_coverage.py Codex Windows: PASS
- Resources: no persistent cloud resource creation observed in executed probes.
